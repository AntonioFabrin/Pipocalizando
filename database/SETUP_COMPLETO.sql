-- ============================================================
-- PIPOCALIZANDO - SETUP COMPLETO (rodar este arquivo no MySQL)
-- Se algum ALTER dar erro de "Duplicate column" ou "already exists", ignore.
-- ============================================================

USE pipocalizando;

-- ── 1. Corrige ENUM de roles
ALTER TABLE users
  MODIFY COLUMN role ENUM('super_admin', 'manager', 'seller', 'customer') NOT NULL DEFAULT 'customer';

UPDATE users SET role = 'super_admin' WHERE role = 'admin';

-- ── 2. Garante colunas na tabela movies
CREATE TABLE IF NOT EXISTS movies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  genre VARCHAR(100),
  duration_minutes INT,
  director VARCHAR(150),
  cast_info TEXT,
  rating VARCHAR(10),
  poster_url VARCHAR(500),
  banner_url VARCHAR(500),
  session_date DATE,
  session_time TIME,
  room VARCHAR(50),
  price DECIMAL(10,2) DEFAULT 0.00,
  on_display_until DATE,
  premiere_date DATE,
  trailer_url VARCHAR(500),
  is_active TINYINT(1) DEFAULT 1,
  status ENUM('coming_soon','now_playing','ended') DEFAULT 'now_playing',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE movies
  ADD COLUMN IF NOT EXISTS on_display_until DATE,
  ADD COLUMN IF NOT EXISTS premiere_date DATE,
  ADD COLUMN IF NOT EXISTS trailer_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS status ENUM('coming_soon','now_playing','ended') DEFAULT 'now_playing',
  ADD COLUMN IF NOT EXISTS category_id INT,
  ADD COLUMN IF NOT EXISTS room_id INT;

-- ── 3. Categorias de filmes
CREATE TABLE IF NOT EXISTS movie_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  emoji VARCHAR(10) DEFAULT '🎬',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO movie_categories (name, description, emoji) VALUES
  ('Acao',              'Filmes com adrenalina',      '💥'),
  ('Animacao',          'Filmes animados',             '🎨'),
  ('Aventura',          'Jornadas epicas',             '🗺️'),
  ('Comedia',           'Filmes para rir',             '😂'),
  ('Comedia Romantica', 'Amor e humor',                '❤️'),
  ('Drama',             'Historias intensas',          '🎭'),
  ('Ficcao Cientifica', 'Tecnologia e espaco',         '🚀'),
  ('Musical',           'Musica e emocao',             '🎵'),
  ('Romance',           'Historias de amor',           '💕'),
  ('Suspense',          'Tensao e misterio',           '🔍'),
  ('Terror',            'Para levar um susto',         '👻'),
  ('Thriller',          'Adrenalina psicologica',      '🔪'),
  ('Thriller Politico', 'Poder e intrigas',            '🏛️'),
  ('Esporte',           'Superacao esportiva',         '⚽'),
  ('Infantil',          'Diversao para os pequenos',   '🧒'),
  ('Documentario',      'Historias reais',             '🎥');

-- ── 4. Salas de cinema
CREATE TABLE IF NOT EXISTS movie_rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  capacity INT DEFAULT 100,
  type ENUM('standard', 'vip', '3d', 'imax', 'kids') DEFAULT 'standard',
  has_3d TINYINT(1) DEFAULT 0,
  has_accessibility TINYINT(1) DEFAULT 1,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO movie_rooms (name, capacity, type, has_3d, has_accessibility) VALUES
  ('Sala 1',    120, 'standard', 0, 1),
  ('Sala 2',    100, 'standard', 0, 1),
  ('Sala 3',     80, '3d',       1, 1),
  ('Sala 4',    150, 'vip',      0, 1),
  ('Sala Kids',  60, 'kids',     0, 1);

-- FK na movies (ignora se ja existir via IF NOT EXISTS nao disponivel em FK, use SET FOREIGN_KEY_CHECKS=0 se precisar re-rodar)
ALTER TABLE movies
  ADD CONSTRAINT fk_movie_category FOREIGN KEY (category_id) REFERENCES movie_categories(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_movie_room     FOREIGN KEY (room_id)     REFERENCES movie_rooms(id)      ON DELETE SET NULL;

-- ── 5. Sessoes de filmes
CREATE TABLE IF NOT EXISTS movie_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  movie_id INT NOT NULL,
  room_id INT NOT NULL,
  session_date DATE NOT NULL,
  session_time TIME NOT NULL,
  available_seats INT DEFAULT 100,
  language ENUM('dublado','legendado','original') DEFAULT 'dublado',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id)  REFERENCES movie_rooms(id) ON DELETE CASCADE
);

-- ── 6. Coluna session_id nos pedidos
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS session_id INT NULL AFTER seller_id,
  ADD CONSTRAINT fk_orders_session
    FOREIGN KEY (session_id) REFERENCES movie_sessions(id) ON DELETE SET NULL;

-- ── 7. Recuperacao de senha
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  token      VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used       TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── 8. Verifica
SELECT 'OK - roles' AS status, role, COUNT(*) AS total FROM users GROUP BY role;
SELECT 'OK - salas' AS status, id, name, type FROM movie_rooms;
