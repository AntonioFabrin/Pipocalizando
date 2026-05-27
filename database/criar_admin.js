/**
 * Pipocalizando - Create or reset the super_admin user on PostgreSQL/Supabase.
 * Run from the backend folder:
 *   node ..\database\criar_admin.js
 */

const path = require('path');
const { createRequire } = require('module');

const backendRequire = createRequire(path.join(__dirname, '../backend/package.json'));
const bcrypt = backendRequire('bcryptjs');
const postgres = backendRequire('postgres');
backendRequire('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const args = process.argv.slice(2);
const emailArg = args.find((arg) => arg.startsWith('--email='));
const passwordArg = args.find((arg) => arg.startsWith('--password='));

const EMAIL = process.env.ADMIN_EMAIL || (emailArg ? emailArg.split('=')[1] : 'admin@pipocalizando.com');
const SENHA = process.env.ADMIN_PASSWORD || (passwordArg ? passwordArg.split('=')[1] : 'admin123');
const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL nao definido no .env.');
}

const sql = postgres(connectionString, {
  ssl: /localhost|127\.0\.0\.1|::1/i.test(connectionString) ? false : 'require',
  max: 1,
  idle_timeout: 20,
});

async function main() {
  const hash = await bcrypt.hash(SENHA, 10);

  const existing = await sql`
    SELECT id, role
    FROM users
    WHERE email = ${EMAIL}
  `;

  if (existing.length > 0) {
    await sql`
      UPDATE users
      SET password = ${hash},
          role = 'super_admin',
          name = 'Admin Pipocalizando',
          phone = '(00) 00000-0000',
          updated_at = NOW()
      WHERE email = ${EMAIL}
    `;
    console.log(`Usuario atualizado: ${EMAIL} | role: super_admin | senha: ${SENHA}`);
  } else {
    await sql`
      INSERT INTO users (name, email, password, role, phone)
      VALUES ('Admin Pipocalizando', ${EMAIL}, ${hash}, 'super_admin', '(00) 00000-0000')
    `;
    console.log(`Usuario criado: ${EMAIL} | role: super_admin | senha: ${SENHA}`);
  }

  await sql.end({ timeout: 5 });
  console.log(`Pronto! Faça login com: ${EMAIL} / senha: ${SENHA}`);
}

main().catch(async (err) => {
  console.error('Erro:', err.message);
  try {
    await sql.end({ timeout: 5 });
  } catch {}
  process.exit(1);
});
