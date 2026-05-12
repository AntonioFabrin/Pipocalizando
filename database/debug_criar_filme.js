/**
 * 🔍 PIPOCALIZANDO — DEBUG COMPLETO DE CRIAÇÃO DE FILME
 *
 * Testa cada camada individualmente e aponta exatamente onde está o problema.
 *
 * Execute: cd backend && node ..\database\debug_criar_filme.js
 */

const mysql  = require('mysql2/promise');
const http   = require('http');
const path   = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const BASE_URL = 'http://localhost:3333';
const EMAIL    = 'admin@pipocalizando.com';
const SENHA    = 'admin123';

// ─── helper: faz requests HTTP sem axios ────────────────
function request(method, urlPath, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 3333,
      path: urlPath,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data   ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token  ? { 'Authorization': `Bearer ${token}` }       : {}),
      },
    };
    const req = http.request(options, (res) => {
      let rawBody = '';
      res.on('data', chunk => rawBody += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(rawBody);
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, data: rawBody });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ─── helper: status colorido ────────────────────────────
const OK  = (msg) => console.log(`  ✅ ${msg}`);
const ERR = (msg) => console.log(`  ❌ ${msg}`);
const INF = (msg) => console.log(`  ℹ️  ${msg}`);
const SEP = ()    => console.log('\n' + '─'.repeat(60));

async function main() {
  console.log('\n🔍 PIPOCALIZANDO — DEBUG DE CRIAÇÃO DE FILME');
  console.log('━'.repeat(60));

  // ═══════════════════════════════════════════════════════
  // ETAPA 1: Banco de Dados direto
  // ═══════════════════════════════════════════════════════
  SEP();
  console.log('📦 ETAPA 1 — Conexão com o Banco de Dados');

  let pool;
  try {
    pool = await mysql.createPool({
      host:     process.env.DB_HOST     || 'localhost',
      user:     process.env.DB_USER     || 'root',
      password: process.env.DB_PASSWORD || '1234',
      database: process.env.DB_NAME     || 'pipocalizando',
      port:     Number(process.env.DB_PORT) || 3306,
    });
    await pool.query('SELECT 1');
    OK(`Conectado em ${process.env.DB_HOST}:${process.env.DB_PORT} → banco: ${process.env.DB_NAME}`);
  } catch (err) {
    ERR(`Falha na conexão com MySQL: ${err.message}`);
    console.log('\n⚠️  Sem banco, não é possível continuar. Verifique se o MySQL está rodando.\n');
    process.exit(1);
  }

  // ═══════════════════════════════════════════════════════
  // ETAPA 2: Verificar colunas da tabela movies
  // ═══════════════════════════════════════════════════════
  SEP();
  console.log('🗄️  ETAPA 2 — Estrutura da tabela `movies`');

  const REQUIRED_COLS = [
    'id','title','description','category_id','genre','duration_minutes',
    'director','cast_info','rating','poster_url','trailer_url',
    'session_date','session_time','room','room_id','price',
    'premiere_date','on_display_until','status','is_active',
  ];

  try {
    const [cols] = await pool.query('DESCRIBE movies');
    const colNames = cols.map(c => c.Field);
    INF(`Colunas encontradas: ${colNames.join(', ')}`);

    const missing = REQUIRED_COLS.filter(c => !colNames.includes(c));
    if (missing.length === 0) {
      OK('Todas as colunas necessárias existem!');
    } else {
      ERR(`Colunas FALTANDO: ${missing.join(', ')}`);
      console.log('\n  👉 Execute o arquivo database/FIX_COMPLETO.sql no HeidiSQL!');
    }
  } catch (err) {
    ERR(`Tabela movies não existe ou erro: ${err.message}`);
    console.log('\n  👉 Execute o arquivo database/FIX_COMPLETO.sql no HeidiSQL!');
  }

  // ═══════════════════════════════════════════════════════
  // ETAPA 3: Verificar usuário admin e seu role
  // ═══════════════════════════════════════════════════════
  SEP();
  console.log('👤 ETAPA 3 — Usuário admin');

  try {
    const [users] = await pool.query(
      'SELECT id, name, email, role FROM users WHERE email = ?', [EMAIL]
    );
    if (users.length === 0) {
      ERR(`Usuário ${EMAIL} não encontrado no banco!`);
      console.log('\n  👉 Execute: node database/criar_admin.js');
    } else {
      const u = users[0];
      INF(`Encontrado: id=${u.id} | name="${u.name}" | role="${u.role}"`);

      const ALLOWED_ROLES = ['super_admin', 'manager', 'seller'];
      if (ALLOWED_ROLES.includes(u.role)) {
        OK(`Role "${u.role}" tem permissão para criar filmes ✓`);
      } else {
        ERR(`Role "${u.role}" NÃO tem permissão para criar filmes!`);
        console.log(`\n  👉 Execute no HeidiSQL:`);
        console.log(`     UPDATE users SET role = 'super_admin' WHERE email = '${EMAIL}';`);
      }
    }
  } catch (err) {
    ERR(`Erro ao buscar usuário: ${err.message}`);
  }

  // ═══════════════════════════════════════════════════════
  // ETAPA 4: Verificar movie_categories e movie_rooms
  // ═══════════════════════════════════════════════════════
  SEP();
  console.log('📂 ETAPA 4 — Categorias e Salas');

  try {
    const [cats]  = await pool.query('SELECT COUNT(*) as n FROM movie_categories');
    const [rooms] = await pool.query('SELECT COUNT(*) as n FROM movie_rooms');
    const nCats  = cats[0].n;
    const nRooms = rooms[0].n;

    if (nCats === 0) {
      ERR(`Tabela movie_categories está VAZIA! O INSERT da categoria_id vai falhar com FK.`);
      console.log('  👉 Execute database/FIX_COMPLETO.sql para popular as categorias.');
    } else {
      OK(`${nCats} categoria(s) de filme encontrada(s)`);
    }

    if (nRooms === 0) {
      ERR(`Tabela movie_rooms está VAZIA! O INSERT de room_id vai falhar com FK.`);
      console.log('  👉 Execute database/FIX_COMPLETO.sql para popular as salas.');
    } else {
      OK(`${nRooms} sala(s) encontrada(s)`);
    }
  } catch (err) {
    ERR(`Erro ao verificar categorias/salas: ${err.message}`);
  }

  // ═══════════════════════════════════════════════════════
  // ETAPA 5: Inserir filme DIRETO no banco (sem HTTP)
  // ═══════════════════════════════════════════════════════
  SEP();
  console.log('🗃️  ETAPA 5 — INSERT direto no banco');

  let directInsertOk = false;
  try {
    const [result] = await pool.query(
      `INSERT INTO movies
        (title, description, category_id, genre, duration_minutes,
         director, cast_info, rating, poster_url, trailer_url,
         session_date, session_time, room, room_id,
         price, premiere_date, on_display_until, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'DEBUG TEST FILME', 'Sinopse de teste do debug', null, 'Teste',
        120, 'Diretor Teste', 'Elenco Teste', '12+',
        null, null,
        '2026-06-01', '19:00:00', 'Sala 1', null,
        25.00, null, '2026-06-30', 'now_playing',
      ]
    );
    OK(`INSERT bem-sucedido! id=${result.insertId}`);
    directInsertOk = true;

    // Remove o registro de teste
    await pool.query('DELETE FROM movies WHERE id = ?', [result.insertId]);
    INF(`Registro de teste removido (id=${result.insertId})`);
  } catch (err) {
    ERR(`Falha no INSERT direto: ${err.message}`);
    console.log(`\n  👉 Erro SQL exato: ${err.sqlMessage || err.message}`);
    if (err.message.includes('Column')) {
      console.log('  👉 Coluna faltando — execute database/FIX_COMPLETO.sql no HeidiSQL!');
    }
    if (err.message.includes('foreign key')) {
      console.log('  👉 FK inválida — verifique se movie_categories e movie_rooms têm dados!');
    }
  }

  // ═══════════════════════════════════════════════════════
  // ETAPA 6: Testar API HTTP — servidor está rodando?
  // ═══════════════════════════════════════════════════════
  SEP();
  console.log('🌐 ETAPA 6 — Servidor HTTP (backend rodando?)');

  let token = null;
  try {
    const pingRes = await request('GET', '/', null, null);
    if (pingRes.status === 200) {
      OK(`Servidor respondendo: ${JSON.stringify(pingRes.data)}`);
    } else {
      ERR(`Servidor retornou status ${pingRes.status}`);
    }
  } catch (err) {
    ERR(`Servidor NÃO está respondendo em ${BASE_URL}`);
    console.log('  👉 Rode no terminal: cd backend && npm run dev');
    console.log('\n⚠️  Pulando testes HTTP — inicie o servidor primeiro.\n');
    await pool.end();
    return;
  }

  // ═══════════════════════════════════════════════════════
  // ETAPA 7: Login via API
  // ═══════════════════════════════════════════════════════
  SEP();
  console.log('🔐 ETAPA 7 — Login via API');

  try {
    const loginRes = await request('POST', '/api/auth/login', { email: EMAIL, password: SENHA }, null);
    if (loginRes.status === 200 && loginRes.data.token) {
      token = loginRes.data.token;
      OK(`Login OK! role="${loginRes.data.user?.role}" | token obtido ✓`);
    } else if (loginRes.status === 401) {
      ERR(`Credenciais inválidas para ${EMAIL} / ${SENHA}`);
      console.log('  👉 Execute: node database/criar_admin.js');
    } else {
      ERR(`Login falhou: ${JSON.stringify(loginRes.data)}`);
    }
  } catch (err) {
    ERR(`Erro no login: ${err.message}`);
  }

  // ═══════════════════════════════════════════════════════
  // ETAPA 8: POST /api/movies via HTTP
  // ═══════════════════════════════════════════════════════
  SEP();
  console.log('🎬 ETAPA 8 — POST /api/movies via HTTP');

  if (!token) {
    ERR('Sem token — pulando teste de criação de filme via API.');
  } else {
    const payload = {
      title:            'Filme de Debug HTTP',
      description:      'Criado pelo script de debug',
      genre:            'Teste',
      duration_minutes: 90,
      director:         'Debugger',
      cast_info:        'Debug Actor',
      rating:           '12+',
      poster_url:       null,
      trailer_url:      null,
      session_date:     '2026-06-01',
      session_time:     '19:00',
      room:             'Sala 1',
      room_id:          null,
      category_id:      null,
      price:            20.00,
      premiere_date:    null,
      on_display_until: '2026-06-30',
      status:           'now_playing',
    };

    try {
      const createRes = await request('POST', '/api/movies', payload, token);
      if (createRes.status === 201) {
        OK(`Filme criado via API! id=${createRes.data.id}`);
        // Remove o filme de teste
        await pool.query('DELETE FROM movies WHERE title = ?', ['Filme de Debug HTTP']);
        INF('Filme de teste removido do banco.');
      } else if (createRes.status === 403) {
        ERR(`403 Forbidden — o usuário não tem permissão (role insuficiente)`);
        console.log('  👉 Verifique o role do admin no banco e no token JWT');
      } else if (createRes.status === 401) {
        ERR('401 Unauthorized — token inválido ou expirado');
      } else {
        ERR(`API retornou ${createRes.status}: ${JSON.stringify(createRes.data)}`);
        if (createRes.data?.detail) {
          console.log(`\n  🧨 Erro SQL exato: ${createRes.data.detail}`);
        }
      }
    } catch (err) {
      ERR(`Erro na requisição: ${err.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════
  // RESUMO FINAL
  // ═══════════════════════════════════════════════════════
  SEP();
  console.log('📋 FIM DO DEBUG\n');
  console.log('Se todas as etapas mostram ✅, o sistema está funcional.');
  console.log('Etapas com ❌ indicam exatamente onde está o problema.\n');

  await pool.end();
}

main().catch(err => {
  console.error('\n💥 Erro fatal no script de debug:', err.message);
  process.exit(1);
});
