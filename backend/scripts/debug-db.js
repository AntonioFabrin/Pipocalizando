const dotenv = require('dotenv');
const postgres = require('postgres');

dotenv.config();

const CONNECTION_NAMES = ['DATABASE_URL', 'DIRECT_URL'];

const redactConnection = (name, rawUrl) => {
  if (!rawUrl) {
    return { name, missing: true };
  }

  try {
    const url = new URL(rawUrl);
    const password = decodeURIComponent(url.password || '');

    return {
      name,
      host: url.hostname,
      port: url.port || '5432',
      user: url.username,
      database: url.pathname.replace(/^\//, '') || 'postgres',
      passwordLength: password.length,
      passwordHasReservedChars: /[:/@?#\[\]@!$&'()*+,;=%]/.test(password),
      isPooler: url.hostname.includes('pooler.supabase.com'),
    };
  } catch (error) {
    return { name, parseError: error.message };
  }
};

const withPort = (rawUrl, port) => {
  const url = new URL(rawUrl);
  url.port = String(port);
  return url.toString();
};

const testConnection = async (label, rawUrl) => {
  const info = redactConnection(label, rawUrl);

  if (info.missing || info.parseError) {
    console.log(`${label}: configuracao invalida`, info);
    return;
  }

  const sql = postgres(rawUrl, {
    ssl: 'require',
    max: 1,
    connect_timeout: 10,
    prepare: false,
  });

  try {
    const rows = await sql.unsafe('select current_user, current_database()');
    console.log(`${label}: OK`, {
      host: info.host,
      port: info.port,
      urlUser: info.user,
      dbUser: rows[0].current_user,
      database: rows[0].current_database,
    });
  } catch (error) {
    console.log(`${label}: FALHOU`, {
      code: error.code,
      message: error.message,
      host: info.host,
      port: info.port,
      user: info.user,
    });
  } finally {
    await sql.end({ timeout: 1 }).catch(() => undefined);
  }
};

const main = async () => {
  console.log('Resumo seguro do .env:');

  for (const name of CONNECTION_NAMES) {
    console.log(redactConnection(name, process.env[name]));
  }

  if (process.env.DATABASE_URL) {
    console.log('\nTestando pooler:');
    await testConnection('DATABASE_URL session pooler 5432', withPort(process.env.DATABASE_URL, 5432));
    await testConnection('DATABASE_URL transaction pooler 6543', withPort(process.env.DATABASE_URL, 6543));
  }

  if (process.env.DIRECT_URL) {
    console.log('\nTestando direct connection:');
    await testConnection('DIRECT_URL', process.env.DIRECT_URL);
  }

  console.log('\nLeitura do resultado:');
  console.log('- 28P01 = usuario/senha recusados. Atualize a senha do banco no .env.');
  console.log('- ENOTFOUND/ENOENT no DIRECT_URL costuma indicar ambiente sem IPv6; use o pooler.');
  console.log('- tenant/user not found no pooler indica host/regiao/project-ref incorreto.');
};

main().catch((error) => {
  console.error('Falha inesperada no debug do banco:', error);
  process.exit(1);
});
