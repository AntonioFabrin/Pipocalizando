-- ================================================================
-- PIPOCALIZANDO — FIX COMPLETO DO BANCO
-- Execute este arquivo inteiro no HeidiSQL (F9)
-- Seguro para rodar mesmo que as tabelas já existam
-- ================================================================

USE pipocalizando;
SET FOREIGN_KEY_CHECKS = 0;

-- ================================================================
-- 1. CORRIGE ENUM DE ROLES (admin → super_admin)
-- ================================================================
ALTER TABLE users
  MODIFY COLUMN role ENUM('super_admin','manager','seller','customer')
  NOT NULL DEFAULT 'customer';

-- Converte qualquer usuário 'admin' antigo para super_admin
UPDATE users SET role = 'super_admin' WHERE role = 'admin';

-- ================================================================
-- 2. GARANTE QUE movie_categories EXISTE
-- ================================================================
CREATE TABLE IF NOT EXISTS movie_categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  emoji       VARCHAR(10)  DEFAULT '🎬',
  is_active   TINYINT(1)   DEFAULT 1,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO movie_categories (name, description, emoji) VALUES
  ('Ação',              'Filmes com adrenalina e aventura',   '💥'),
  ('Animação',          'Filmes animados para a família',     '🎨'),
  ('Aventura',          'Jornadas épicas e descobertas',      '🗺️'),
  ('Comédia',           'Filmes para rir muito',              '😂'),
  ('Comédia Romântica', 'Amor e muito humor',                 '❤️'),
  ('Drama',             'Histórias intensas e emocionantes',  '🎭'),
  ('Ficção Científica', 'Tecnologia, espaço e futuros',       '🚀'),
  ('Musical',           'Música, dança e emoção',             '🎵'),
  ('Romance',           'Histórias de amor',                  '💕'),
  ('Suspense',          'Tensão e mistério',                  '🔍'),
  ('Terror',            'Para quem gosta de um susto',        '👻'),
  ('Thriller',          'Adrenalina psicológica',             '🔪'),
  ('Thriller Político', 'Poder, corrupção e intrigas',        '🏛️'),
  ('Esporte',           'Superação e espírito esportivo',     '⚽'),
  ('Infantil',          'Diversão para os pequenos',          '🧒'),
  ('Documentário',      'Histórias reais e fascinantes',      '🎥');

-- ================================================================
-- 3. GARANTE QUE movie_rooms EXISTE
-- ================================================================
CREATE TABLE IF NOT EXISTS movie_rooms (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(50) NOT NULL,
  capacity          INT         DEFAULT 100,
  type              ENUM('standard','vip','3d','imax','kids') DEFAULT 'standard',
  has_3d            TINYINT(1)  DEFAULT 0,
  has_accessibility TINYINT(1)  DEFAULT 1,
  is_active         TINYINT(1)  DEFAULT 1,
  created_at        TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO movie_rooms (id, name, capacity, type, has_3d, has_accessibility) VALUES
  (1, 'Sala 1',    120, 'standard', 0, 1),
  (2, 'Sala 2',    100, 'standard', 0, 1),
  (3, 'Sala 3',     80, '3d',       1, 1),
  (4, 'Sala 4',    150, 'vip',      0, 1),
  (5, 'Sala Kids',  60, 'kids',     0, 1);

-- ================================================================
-- 4. GARANTE QUE movies TEM TODAS AS COLUNAS NECESSÁRIAS
-- ================================================================

-- Cria a tabela se não existir (com estrutura completa)
CREATE TABLE IF NOT EXISTS movies (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  title            VARCHAR(200) NOT NULL,
  description      TEXT,
  category_id      INT,
  genre            VARCHAR(100),
  duration_minutes INT,
  director         VARCHAR(150),
  cast_info        TEXT,
  rating           VARCHAR(10),
  poster_url       VARCHAR(500),
  banner_url       VARCHAR(500),
  trailer_url      VARCHAR(500),
  session_date     DATE,
  session_time     TIME,
  room             VARCHAR(50),
  room_id          INT,
  price            DECIMAL(10,2) DEFAULT 0.00,
  premiere_date    DATE,
  on_display_until DATE,
  status           ENUM('coming_soon','now_playing','ended') DEFAULT 'now_playing',
  is_active        TINYINT(1)   DEFAULT 1,
  created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Adiciona colunas que podem estar faltando se a tabela já existia
ALTER TABLE movies ADD COLUMN IF NOT EXISTS category_id      INT           AFTER description;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS room_id          INT           AFTER room;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS trailer_url      VARCHAR(500)  AFTER banner_url;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS premiere_date    DATE          AFTER price;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS on_display_until DATE          AFTER premiere_date;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS status
  ENUM('coming_soon','now_playing','ended') DEFAULT 'now_playing'
  AFTER on_display_until;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS banner_url       VARCHAR(500)  AFTER poster_url;

-- Adiciona FKs (ignora se já existirem)
ALTER TABLE movies
  ADD CONSTRAINT IF NOT EXISTS fk_movie_category
    FOREIGN KEY (category_id) REFERENCES movie_categories(id) ON DELETE SET NULL,
  ADD CONSTRAINT IF NOT EXISTS fk_movie_room
    FOREIGN KEY (room_id)     REFERENCES movie_rooms(id)      ON DELETE SET NULL;

-- ================================================================
-- 5. GARANTE QUE movie_sessions EXISTE
-- ================================================================
CREATE TABLE IF NOT EXISTS movie_sessions (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  movie_id        INT NOT NULL,
  room_id         INT NOT NULL,
  session_date    DATE NOT NULL,
  session_time    TIME NOT NULL,
  available_seats INT         DEFAULT 100,
  language        ENUM('dublado','legendado','original') DEFAULT 'dublado',
  is_active       TINYINT(1)  DEFAULT 1,
  created_at      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (movie_id) REFERENCES movies(id)      ON DELETE CASCADE,
  FOREIGN KEY (room_id)  REFERENCES movie_rooms(id)  ON DELETE CASCADE
);

-- ================================================================
-- 6. GARANTE orders.session_id
-- ================================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS session_id INT NULL AFTER seller_id;

-- Adiciona FK de orders → movie_sessions (ignora se já existir)
ALTER TABLE orders
  ADD CONSTRAINT IF NOT EXISTS fk_orders_session
    FOREIGN KEY (session_id) REFERENCES movie_sessions(id) ON DELETE SET NULL;

-- ================================================================
-- 7. CRIA USUÁRIO SUPER_ADMIN SE NÃO EXISTIR
--    Senha padrão: admin123
--    Troque após o primeiro login!
-- ================================================================
INSERT IGNORE INTO users (name, email, password, role, phone) VALUES
  (
    'Admin Pipocalizando',
    'admin@pipocalizando.com',
    '$2b$10$YourHashedPasswordHere',   -- placeholder; rode o script abaixo para criar com hash real
    'super_admin',
    '(00) 00000-0000'
  );

-- ================================================================
-- 8. VERIFICAÇÃO FINAL — mostra estrutura atual da tabela movies
-- ================================================================
DESCRIBE movies;

SELECT
  m.id,
  m.title,
  m.status,
  m.rating,
  m.price,
  mc.name  AS categoria,
  mr.name  AS sala
FROM movies m
LEFT JOIN movie_categories mc ON m.category_id = mc.id
LEFT JOIN movie_rooms      mr ON m.room_id     = mr.id
ORDER BY m.created_at DESC
LIMIT 20;

SET FOREIGN_KEY_CHECKS = 1;
