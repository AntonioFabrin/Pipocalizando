/**
 * Pipocalizando - end-to-end movie creation debug for PostgreSQL/Supabase.
 *
 * Run from the backend folder:
 *   node ..\database\debug_criar_filme.js
 *
 * Checks the database directly, then optionally checks the local HTTP API if
 * the backend is running on http://localhost:3333.
 */

const http = require('http');
const path = require('path');
const { createRequire } = require('module');

const backendRequire = createRequire(path.join(__dirname, '../backend/package.json'));
const postgres = backendRequire('postgres');
backendRequire('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const BASE_HOST = 'localhost';
const BASE_PORT = 3333;
const EMAIL = process.env.ADMIN_EMAIL || 'admin@pipocalizando.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!connectionString) {
  console.error('DATABASE_URL or DIRECT_URL is missing in backend/.env');
  process.exit(1);
}

const sql = postgres(connectionString, {
  ssl: /localhost|127\.0\.0\.1|::1/i.test(connectionString) ? false : 'require',
  max: 1,
  idle_timeout: 20,
  prepare: false,
});

const requiredMovieColumns = [
  'id',
  'title',
  'description',
  'category_id',
  'genre',
  'duration_minutes',
  'director',
  'cast_info',
  'rating',
  'poster_url',
  'trailer_url',
  'session_date',
  'session_time',
  'room',
  'room_id',
  'price',
  'premiere_date',
  'on_display_until',
  'status',
  'is_active',
];

const ok = (message) => console.log(`[OK] ${message}`);
const warn = (message) => console.warn(`[WARN] ${message}`);
const fail = (message) => console.error(`[FAIL] ${message}`);
const section = (title) => {
  console.log('\n' + title);
  console.log('-'.repeat(title.length));
};

function request(method, urlPath, body, cookie) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: BASE_HOST,
        port: BASE_PORT,
        path: urlPath,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
          ...(cookie ? { Cookie: cookie } : {}),
        },
      },
      (res) => {
        let rawBody = '';
        res.on('data', (chunk) => {
          rawBody += chunk;
        });
        res.on('end', () => {
          let parsedBody = rawBody;
          try {
            parsedBody = rawBody ? JSON.parse(rawBody) : null;
          } catch {}

          resolve({
            status: res.statusCode,
            data: parsedBody,
            setCookie: res.headers['set-cookie'] || [],
          });
        });
      },
    );

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function cookieHeaderFromSetCookie(setCookie) {
  return setCookie.map((cookie) => cookie.split(';')[0]).join('; ');
}

async function checkDatabase() {
  section('1. PostgreSQL connection');

  const [connection] = await sql`
    SELECT current_user, current_database()
  `;
  ok(`Connected as ${connection.current_user} on ${connection.current_database}`);

  section('2. movies schema');

  const columns = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'movies'
    ORDER BY ordinal_position
  `;
  const columnNames = columns.map((column) => column.column_name);
  const missing = requiredMovieColumns.filter((column) => !columnNames.includes(column));

  if (missing.length > 0) {
    throw new Error(`Missing movies columns: ${missing.join(', ')}`);
  }

  ok(`movies table has all required columns (${columnNames.length} total)`);

  section('3. seed data');

  const [{ count: categoryCount }] = await sql`
    SELECT COUNT(*)::int AS count
    FROM movie_categories
    WHERE is_active = TRUE
  `;
  const [{ count: roomCount }] = await sql`
    SELECT COUNT(*)::int AS count
    FROM movie_rooms
    WHERE is_active = TRUE
  `;

  if (categoryCount === 0) {
    warn('No active movie categories found. Run database/seed.sql.');
  } else {
    ok(`${categoryCount} active movie categories found`);
  }

  if (roomCount === 0) {
    warn('No active movie rooms found. Run database/seed.sql.');
  } else {
    ok(`${roomCount} active movie rooms found`);
  }

  section('4. admin user');

  const [admin] = await sql`
    SELECT id, name, email, role
    FROM users
    WHERE email = ${EMAIL}
  `;

  if (!admin) {
    warn(`Admin ${EMAIL} was not found. Run node ..\\database\\criar_admin.js.`);
  } else if (!['super_admin', 'manager', 'seller'].includes(admin.role)) {
    warn(`Admin role "${admin.role}" cannot create movies.`);
  } else {
    ok(`Admin ${EMAIL} exists with role ${admin.role}`);
  }

  section('5. direct movie insert');

  const [movie] = await sql`
    INSERT INTO movies (
      title,
      description,
      category_id,
      genre,
      duration_minutes,
      director,
      cast_info,
      rating,
      poster_url,
      trailer_url,
      session_date,
      session_time,
      room,
      room_id,
      price,
      premiere_date,
      on_display_until,
      status
    )
    VALUES (
      '__POSTGRES_DEBUG_DIRECT__',
      'Temporary movie created by database/debug_criar_filme.js',
      NULL,
      'Debug',
      90,
      'Debug Director',
      'Debug Cast',
      '12+',
      NULL,
      NULL,
      CURRENT_DATE + INTERVAL '7 days',
      '19:00',
      'Sala 1',
      NULL,
      20.00,
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '30 days',
      'now_playing'
    )
    RETURNING id
  `;

  ok(`Direct insert worked. Generated movie id: ${movie.id}`);

  await sql`
    DELETE FROM movies
    WHERE id = ${movie.id}
  `;
  ok(`Removed direct insert test movie id ${movie.id}`);
}

async function checkHttpApi() {
  section('6. HTTP API');

  let ping;
  try {
    ping = await request('GET', '/', null, null);
  } catch {
    warn(`Backend is not responding on http://${BASE_HOST}:${BASE_PORT}. Skipping HTTP checks.`);
    console.log('Start it with: cd backend && npm run dev');
    return;
  }

  if (ping.status !== 200) {
    warn(`Backend responded with status ${ping.status}. Skipping HTTP checks.`);
    return;
  }

  ok('Backend root endpoint is responding');

  const login = await request('POST', '/api/auth/login', { email: EMAIL, password: PASSWORD }, null);
  if (login.status !== 200) {
    warn(`Login failed with status ${login.status}: ${JSON.stringify(login.data)}`);
    console.log('If needed, reset the admin with: node ..\\database\\criar_admin.js');
    return;
  }

  const cookie = cookieHeaderFromSetCookie(login.setCookie);
  if (!cookie) {
    warn('Login succeeded, but no auth cookie was returned. Skipping authenticated movie creation.');
    return;
  }

  ok(`Login succeeded for ${EMAIL}`);

  const create = await request(
    'POST',
    '/api/movies',
    {
      title: 'Filme de Debug HTTP',
      description: 'Temporary movie created by database/debug_criar_filme.js',
      genre: 'Debug',
      duration_minutes: 90,
      director: 'Debugger',
      cast_info: 'Debug Actor',
      rating: '12+',
      poster_url: null,
      trailer_url: null,
      session_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      session_time: '19:00',
      room: 'Sala 1',
      room_id: null,
      category_id: null,
      price: 20.0,
      premiere_date: new Date().toISOString().slice(0, 10),
      on_display_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: 'now_playing',
    },
    cookie,
  );

  if (create.status !== 201) {
    warn(`Movie creation API returned ${create.status}: ${JSON.stringify(create.data)}`);
    return;
  }

  ok(`Movie creation API worked. Generated id: ${create.data.id}`);

  await sql`
    DELETE FROM movies
    WHERE title = 'Filme de Debug HTTP'
  `;
  ok('Removed HTTP test movie');
}

async function main() {
  console.log('\nPipocalizando PostgreSQL end-to-end movie debug');
  console.log('='.repeat(56));

  await checkDatabase();
  await checkHttpApi();

  section('Done');
  ok('Debug finished');
}

main()
  .catch((error) => {
    fail(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end({ timeout: 5 }).catch(() => undefined);
  });
