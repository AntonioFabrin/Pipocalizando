/**
 * Pipocalizando - Create or reset a user on PostgreSQL/Supabase.
 * Run from the backend folder:
 *   node ..\database\criar_usuario.js --email=vendedor@pipocalizando.com --password=vendedor123 --role=seller --name="Vendedor"
 */

const path = require('path');
const { createRequire } = require('module');

const backendRequire = createRequire(path.join(__dirname, '../backend/package.json'));
const bcrypt = backendRequire('bcryptjs');
const postgres = backendRequire('postgres');
backendRequire('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const arg = args.find((item) => item.startsWith(`--${name}=`));
  return arg ? arg.slice(name.length + 3) : fallback;
};

const EMAIL = getArg('email');
const SENHA = getArg('password');
const ROLE = getArg('role', 'customer');
const NAME = getArg('name', 'Usuario Pipocalizando');
const PHONE = getArg('phone', '(00) 00000-0000');
const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
const allowedRoles = new Set(['super_admin', 'manager', 'seller', 'customer']);

if (!EMAIL || !SENHA) {
  throw new Error('Informe --email e --password.');
}

if (!allowedRoles.has(ROLE)) {
  throw new Error(`Role invalida: ${ROLE}. Use super_admin, manager, seller ou customer.`);
}

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
    SELECT id
    FROM users
    WHERE email = ${EMAIL}
  `;

  if (existing.length > 0) {
    await sql`
      UPDATE users
      SET password = ${hash},
          role = ${ROLE},
          name = ${NAME},
          phone = ${PHONE},
          updated_at = NOW()
      WHERE email = ${EMAIL}
    `;
    console.log(`Usuario atualizado: ${EMAIL} | role: ${ROLE} | senha: ${SENHA}`);
  } else {
    await sql`
      INSERT INTO users (name, email, password, role, phone)
      VALUES (${NAME}, ${EMAIL}, ${hash}, ${ROLE}, ${PHONE})
    `;
    console.log(`Usuario criado: ${EMAIL} | role: ${ROLE} | senha: ${SENHA}`);
  }

  await sql.end({ timeout: 5 });
  console.log(`Pronto! Faca login com: ${EMAIL} / senha: ${SENHA}`);
}

main().catch(async (err) => {
  console.error('Erro:', err.message);
  try {
    await sql.end({ timeout: 5 });
  } catch {}
  process.exit(1);
});
