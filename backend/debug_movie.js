/**
 * PIPOCALIZANDO — DEBUG COMPLETO DE CRIAÇÃO DE FILME
 * ====================================================
 * Execute: node debug_movie.js
 * (dentro da pasta backend)
 *
 * O que este script faz:
 * 1. Testa conexão com o banco
 * 2. Verifica se a tabela movies existe e lista todas as colunas
 * 3. Verifica se as tabelas movie_categories e movie_rooms têm dados
 * 4. Verifica o usuário admin e sua role
 * 5. Tenta um INSERT real de filme e mostra o erro exato se falhar
 * 6. Se criou, deleta o filme de teste (limpeza)
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const DB = {
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME     || 'pipocalizando',
  port:     Number(process.env.DB_PORT) || 3306,
};

async function run() {
  let conn;
  console.log('\n🔍 PIPOCALIZANDO — DEBUG DE CRIAÇÃO DE FILME');
  console.log('═══════════════════════════════════════════\n');

  // ── 1. CONEXÃO ────────────────────────────────────────────────
  console.log('📡 [1/6] Testando conexão com o banco...');
  try {
    conn = await mysql.createConnection(DB);
    console.log('   ✅ Conectado com sucesso!\n');
  } catch (err) {
    console.error('   ❌ ERRO DE CONEXÃO:', err.message);
    console.error('   → Verifique se o MySQL está rodando e as credenciais no .env');
    process.exit(1);
  }

  // ── 2. ESTRUTURA DA TABELA MOVIES ────────────────────────────
  console.log('🗂  [2/6] Verificando estrutura da tabela movies...');
  try {
    const [cols] = await conn.query('DESCRIBE movies');
    const colNames = cols.map(c => c.Field);
    console.log('   Colunas encontradas:', colNames.join(', '));

    const required = [
      'id', 'title', 'description', 'category_id', 'genre',
      'duration_minutes', 'director', 'cast_info', 'rating',
      'poster_url', 'trailer_url', 'session_date', 'session_time',
      'room', 'room_id', 'price', 'premiere_date', 'on_display_until',
      'status', 'is_active',
    ];

    const missing = required.filter(c => !colNames.includes(c));
    if (missing.length > 0) {
      console.error('\n   ❌ COLUNAS FALTANDO NA TABELA MOVIES:', missing.join(', '));
      console.error('   → Execute o arquivo database/FIX_COMPLETO.sql no HeidiSQL!\n');
    } else {
      console.log('   ✅ Todas as colunas necessárias existem!\n');
    }
  } catch (err) {
    console.error('   ❌ Tabela movies não existe ou erro:', err.message);
    console.error('   → Execute database/FIX_COMPLETO.sql no HeidiSQL!\n');
    await conn.end();
    process.exit(1);
  }

  // ── 3. CATEGORIAS E SALAS ────────────────────────────────────
  console.log('📂 [3/6] Verificando categorias e salas...');
  try {
    const [[catCount]] = await conn.query('SELECT COUNT(*) as n FROM movie_categories WHERE is_active = 1');
    const [[roomCount]] = await conn.query('SELECT COUNT(*) as n FROM movie_rooms WHERE is_active = 1');
    console.log(`   Categorias de filmes: ${catCount.n}`);
    console.log(`   Salas de cinema:      ${roomCount.n}`);
    if (catCount.n === 0) console.warn('   ⚠️  Nenhuma categoria! Execute FIX_COMPLETO.sql.');
    if (roomCount.n === 0) console.warn('   ⚠️  Nenhuma sala! Execute FIX_COMPLETO.sql.');
    else console.log('   ✅ Categorias e salas OK\n');
  } catch (err) {
    console.error('   ❌ Erro ao consultar categorias/salas:', err.message);
  }

  // ── 4. USUÁRIO ADMIN ─────────────────────────────────────────
  console.log('👤 [4/6] Verificando usuário admin...');
  try {
    const [users] = await conn.query(
      "SELECT id, name, email, role FROM users WHERE email = 'admin@pipocalizando.com'"
    );
    if (users.length === 0) {
      console.error('   ❌ Usuário admin@pipocalizando.com NÃO EXISTE!');
      console.error('   → Execute: node database/criar_admin.js\n');
    } else {
      const u = users[0];
      console.log(`   Usuário: ${u.name} (${u.email})`);
      console.log(`   Role:    ${u.role}`);
      const allowed = ['super_admin', 'manager', 'seller'];
      if (!allowed.includes(u.role)) {
        console.error(`   ❌ Role "${u.role}" NÃO tem permissão para criar filmes!`);
        console.error(`   → Roles permitidas: ${allowed.join(', ')}`);
        console.error('   → Execute: node database/criar_admin.js\n');
      } else {
        console.log('   ✅ Usuário tem permissão para criar filmes\n');
      }
    }
  } catch (err) {
    console.error('   ❌ Erro ao consultar usuário:', err.message);
  }

  // ── 5. TESTE DE INSERT ───────────────────────────────────────
  console.log('🧪 [5/6] Tentando INSERT de filme de teste...');
  let testId = null;
  try {
    const [result] = await conn.query(
      `INSERT INTO movies
        (title, description, category_id, genre, duration_minutes,
         director, cast_info, rating, poster_url, trailer_url,
         session_date, session_time, room, room_id,
         price, premiere_date, on_display_until, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        '__TESTE_DEBUG__',
        'Filme de teste criado pelo debug_movie.js',
        1,              // category_id
        'Teste',
        90,
        'Diretor Teste',
        'Ator 1, Ator 2',
        '12+',
        null,           // poster_url
        null,           // trailer_url
        '2026-07-01',   // session_date
        '19:00:00',     // session_time
        'Sala 1',       // room
        1,              // room_id
        25.00,          // price
        '2026-07-01',   // premiere_date
        '2026-07-31',   // on_display_until
        'now_playing',  // status
      ]
    );
    testId = result.insertId;
    console.log(`   ✅ INSERT funcionou! ID gerado: ${testId}\n`);
  } catch (err) {
    console.error('   ❌ ERRO NO INSERT:', err.message);
    console.error('   SQL State:', err.sqlState);
    console.error('   SQL Message completo:', err.sqlMessage || err.message);
    console.error('\n   → Este é o erro que aparece como "Erro interno" no app!\n');
    await conn.end();
    process.exit(1);
  }

  // ── 6. LIMPEZA ───────────────────────────────────────────────
  console.log('🧹 [6/6] Removendo filme de teste...');
  if (testId) {
    try {
      await conn.query('DELETE FROM movies WHERE id = ?', [testId]);
      console.log('   ✅ Filme de teste removido\n');
    } catch (err) {
      console.warn('   ⚠️  Não foi possível remover o filme de teste (ID', testId, ')');
    }
  }

  await conn.end();

  console.log('═══════════════════════════════════════════');
  console.log('✅ DEBUG CONCLUÍDO — Se chegou até aqui sem erros,');
  console.log('   o banco está OK. O problema pode ser:');
  console.log('   1. Token JWT expirado → faça logout e login novamente');
  console.log('   2. Dispositivo físico com IP errado no api.ts');
  console.log('   3. Backend não estava rodando ao tentar criar');
  console.log('═══════════════════════════════════════════\n');
}

run().catch(err => {
  console.error('ERRO FATAL:', err);
  process.exit(1);
});
