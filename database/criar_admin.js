/**
 * Pipocalizando — Criar/resetar usuário super_admin
 * Execute: node criar_admin.js
 *
 * Requisito: bcryptjs instalado (já está no package.json do backend)
 * Execute dentro da pasta backend: cd backend && node ../database/criar_admin.js
 */

const bcrypt = require('bcryptjs');
const mysql  = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const args = process.argv.slice(2);
const emailArg = args.find((arg) => arg.startsWith('--email='));
const passwordArg = args.find((arg) => arg.startsWith('--password='));

const EMAIL = process.env.ADMIN_EMAIL || (emailArg ? emailArg.split('=')[1] : 'admin@pipocalizando.com');
const SENHA = process.env.ADMIN_PASSWORD || (passwordArg ? passwordArg.split('=')[1] : 'admin123');

async function main() {
  const pool = await mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME     || 'pipocalizando',
    port:     Number(process.env.DB_PORT) || 3306,
  });

  const hash = await bcrypt.hash(SENHA, 10);

  // Verifica se o usuário já existe
  const [rows] = await pool.query('SELECT id, role FROM users WHERE email = ?', [EMAIL]);

  if (rows.length > 0) {
    // Atualiza senha e garante role super_admin
    await pool.query(
      'UPDATE users SET password = ?, role = ? WHERE email = ?',
      [hash, 'super_admin', EMAIL]
    );
    console.log(`✅ Usuário atualizado: ${EMAIL} | role: super_admin | senha: ${SENHA}`);
  } else {
    // Cria o usuário
    await pool.query(
      'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      ['Admin Pipocalizando', EMAIL, hash, 'super_admin', '(00) 00000-0000']
    );
    console.log(`✅ Usuário criado: ${EMAIL} | role: super_admin | senha: ${SENHA}`);
  }

  await pool.end();
  console.log('🎬 Pronto! Faça login com:', EMAIL, '/ senha:', SENHA);
}

main().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
