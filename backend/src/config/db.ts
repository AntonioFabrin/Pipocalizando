import dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL nao definido no .env!');
}

const useSsl = !/localhost|127\.0\.0\.1|::1/i.test(connectionString);
const usePrepare = !/pgbouncer=true|pooler\.supabase\.com/i.test(connectionString);

const sql = postgres(connectionString, {
  ssl: useSsl ? 'require' : false,
  max: 10,
  idle_timeout: 20,
  prepare: usePrepare,
});

const describeConnection = (url: string) => {
  try {
    const parsedUrl = new URL(url);

    return {
      host: parsedUrl.hostname,
      port: parsedUrl.port || '5432',
      user: parsedUrl.username,
      database: parsedUrl.pathname.replace(/^\//, '') || 'postgres',
      isPooler: parsedUrl.hostname.includes('pooler.supabase.com'),
    };
  } catch {
    return null;
  }
};

type QueryResult = [any, any];

const booleanColumns = new Set([
  'has_3d',
  'has_accessibility',
  'is_active',
  'is_used',
  'used',
]);

const booleanColumnPattern = [...booleanColumns].join('|');

const normalizeBooleanLiterals = (text: string) =>
  text
    .replace(new RegExp(`\\b(${booleanColumnPattern})\\b\\s*=\\s*1\\b`, 'gi'), '$1 = true')
    .replace(new RegExp(`\\b(${booleanColumnPattern})\\b\\s*=\\s*0\\b`, 'gi'), '$1 = false');

const coerceBooleanValue = (value: any) => {
  if (value === 1 || value === '1') return true;
  if (value === 0 || value === '0') return false;
  return value;
};

const isBooleanAssignment = (sqlPrefix: string) =>
  new RegExp(`\\b(${booleanColumnPattern})\\b\\s*=\\s*$`, 'i').test(sqlPrefix);

const getInsertBooleanParamIndexes = (text: string) => {
  const match = text.match(/^\s*insert\s+into\s+\S+\s*\(([\s\S]*?)\)\s*values\s*\(([\s\S]*?)\)/i);
  const indexes = new Set<number>();

  if (!match) return indexes;

  const columns = match[1].split(',').map((column) => column.trim().replace(/["`]/g, '').toLowerCase());
  const values = match[2].split(',').map((value) => value.trim());
  let paramIndex = 0;

  values.forEach((value, valueIndex) => {
    if (value !== '?') return;

    if (booleanColumns.has(columns[valueIndex])) {
      indexes.add(paramIndex);
    }

    paramIndex += 1;
  });

  return indexes;
};

const convertQuery = (text: string, params: any[] = []) => {
  const normalizedText = normalizeBooleanLiterals(text);
  const insertBooleanParamIndexes = getInsertBooleanParamIndexes(normalizedText);
  const values: any[] = [];
  let sqlText = '';
  let placeholderIndex = 1;
  let paramIndex = 0;

  for (let i = 0; i < normalizedText.length; i += 1) {
    const char = normalizedText[i];

    if (char !== '?') {
      sqlText += char;
      continue;
    }

    const currentParamIndex = paramIndex;
    let value = params[paramIndex++];
    if (insertBooleanParamIndexes.has(currentParamIndex) || isBooleanAssignment(sqlText)) {
      value = coerceBooleanValue(value);
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        sqlText += 'NULL';
        continue;
      }

      sqlText += value
        .map((item) => {
          values.push(item);
          const current = `$${placeholderIndex}`;
          placeholderIndex += 1;
          return current;
        })
        .join(', ');
      continue;
    }

    values.push(value);
    sqlText += `$${placeholderIndex}`;
    placeholderIndex += 1;
  }

  return { sqlText, values };
};

const executeQuery = async (executor: typeof sql, text: string, params: any[] = []): Promise<QueryResult> => {
  const { sqlText, values } = convertQuery(text, params);
  const normalizedSql = /^\s*insert\s+/i.test(sqlText) && !/\breturning\b/i.test(sqlText)
    ? `${sqlText} RETURNING id`
    : sqlText;

  const rawResult = await executor.unsafe(normalizedSql, values);
  const rows = Array.from(rawResult as Iterable<any>);
  const affectedRows = Number((rawResult as any).count ?? rows.length ?? 0);
  const isRowQuery = /^\s*(select|with|show|values)\b/i.test(sqlText);

  return isRowQuery
    ? [rows, { insertId: null, affectedRows }]
    : [{ insertId: rows[0]?.id ?? null, affectedRows }, { rows }];
};

const pool = {
  query: <T = any>(text: string, params?: any[]): Promise<T> => executeQuery(sql, text, params || []) as Promise<T>,
  getConnection: async () => {
    const connection = await sql.reserve();

    return {
      query: <T = any>(text: string, params?: any[]): Promise<T> =>
        executeQuery(connection, text, params || []) as Promise<T>,
      beginTransaction: async (): Promise<void> => {
        await connection.unsafe('BEGIN');
      },
      commit: async (): Promise<void> => {
        await connection.unsafe('COMMIT');
      },
      rollback: async (): Promise<void> => {
        await connection.unsafe('ROLLBACK');
      },
      release: (): void => {
        connection.release();
      },
    };
  },
};

export const testConnection = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();
    await connection.query('SELECT 1');
    console.log('PostgreSQL conectado com sucesso!');
    connection.release();
  } catch (error) {
    const connectionInfo = describeConnection(connectionString);

    if ((error as any)?.code === '28P01') {
      console.error('Erro ao conectar no PostgreSQL: senha/usuario recusados pelo Supabase.');

      if (connectionInfo) {
        console.error(
          `Conexao testada: host=${connectionInfo.host}, porta=${connectionInfo.port}, usuario=${connectionInfo.user}, banco=${connectionInfo.database}`,
        );
      }

      console.error('Verifique se a senha do banco no backend/.env e exatamente a senha atual em Supabase > Project Settings > Database.');
      console.error('Se voce resetou a senha agora, pare o servidor, atualize DATABASE_URL e DIRECT_URL, aguarde alguns minutos e rode npm run dev novamente.');
      process.exit(1);
    }

    console.error('Erro ao conectar no PostgreSQL:', error);
    process.exit(1);
  }
};

export default pool;
