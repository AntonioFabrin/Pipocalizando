/**
 * Pipocalizando - PostgreSQL movie creation debug.
 *
 * Run from the backend folder:
 *   node debug_movie.js
 *
 * This script checks the Supabase/PostgreSQL schema used by the API and tries a
 * real insert/delete cycle in the movies table.
 */

require('dotenv').config();
const postgres = require('postgres');

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

async function main() {
  console.log('\nPipocalizando PostgreSQL movie debug');
  console.log('='.repeat(48));

  try {
    const [connection] = await sql`
      SELECT current_user, current_database()
    `;
    ok(`Connected as ${connection.current_user} on ${connection.current_database}`);
  } catch (error) {
    fail(`Could not connect to PostgreSQL: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  try {
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
      fail(`Missing movies columns: ${missing.join(', ')}`);
      console.log('Run database/schema.sql and the PostgreSQL migration files in database/.');
      process.exitCode = 1;
      return;
    }

    ok(`movies table has all required columns (${columnNames.length} total)`);
  } catch (error) {
    fail(`Could not inspect movies table: ${error.message}`);
    console.log('Run database/schema.sql in the Supabase SQL editor.');
    process.exitCode = 1;
    return;
  }

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

  const [admin] = await sql`
    SELECT id, name, email, role
    FROM users
    WHERE email = 'admin@pipocalizando.com'
  `;

  if (!admin) {
    warn('Admin user was not found. Run node ..\\database\\criar_admin.js.');
  } else if (!['super_admin', 'manager', 'seller'].includes(admin.role)) {
    warn(`Admin role "${admin.role}" cannot create movies.`);
  } else {
    ok(`Admin user exists with role ${admin.role}`);
  }

  let testMovieId = null;

  try {
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
        '__POSTGRES_DEBUG_MOVIE__',
        'Temporary movie created by backend/debug_movie.js',
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
        25.00,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        'now_playing'
      )
      RETURNING id
    `;

    testMovieId = movie.id;
    ok(`Insert worked. Generated movie id: ${testMovieId}`);
  } catch (error) {
    fail(`Movie insert failed: ${error.message}`);
    process.exitCode = 1;
    return;
  } finally {
    if (testMovieId) {
      await sql`
        DELETE FROM movies
        WHERE id = ${testMovieId}
      `;
      ok(`Removed temporary movie id ${testMovieId}`);
    }
  }

  ok('PostgreSQL movie debug completed successfully');
}

main()
  .catch((error) => {
    fail(`Unexpected debug failure: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end({ timeout: 5 }).catch(() => undefined);
  });
