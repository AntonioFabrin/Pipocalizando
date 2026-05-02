USE pipocalizando;

-- ══════════════════════════════════════════
-- CATEGORIAS DE FILMES (gêneros gerenciáveis)
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS movie_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  emoji VARCHAR(10) DEFAULT '🎬',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO movie_categories (name, description, emoji) VALUES
  ('Ação',                  'Filmes com muita adrenalina e aventura',         '💥'),
  ('Animação',              'Filmes animados para toda a família',             '🎨'),
  ('Aventura',              'Jornadas épicas e descobertas',                   '🗺️'),
  ('Comédia',               'Filmes para rir muito',                           '😂'),
  ('Comédia Romântica',     'Amor e muito humor',                              '❤️'),
  ('Drama',                 'Histórias intensas e emocionantes',               '🎭'),
  ('Ficção Científica',     'Tecnologia, espaço e futuros alternativos',       '🚀'),
  ('Musical',               'Música, dança e emoção',                          '🎵'),
  ('Romance',               'Histórias de amor',                               '💕'),
  ('Suspense',              'Tensão e mistério do início ao fim',              '🔍'),
  ('Terror',                'Para quem gosta de levar um susto',               '👻'),
  ('Thriller',              'Adrenalina psicológica',                          '🔪'),
  ('Thriller Político',     'Poder, corrupção e intrigas',                     '🏛️'),
  ('Esporte',               'Superação e espírito esportivo',                  '⚽'),
  ('Infantil',              'Diversão garantida para os pequenos',             '🧒'),
  ('Documentário',          'Histórias reais e fascinantes',                   '🎥');

-- ══════════════════════════════════════════
-- SALAS DE CINEMA
-- ══════════════════════════════════════════
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
  ('Sala 1', 120, 'standard', 0, 1),
  ('Sala 2', 100, 'standard', 0, 1),
  ('Sala 3',  80, '3d',       1, 1),
  ('Sala 4', 150, 'vip',      0, 1),
  ('Sala Kids', 60, 'kids',   0, 1);

-- ══════════════════════════════════════════
-- ATUALIZAR TABELA movies
-- adiciona category_id, room_id e status
-- ══════════════════════════════════════════
ALTER TABLE movies
  ADD COLUMN IF NOT EXISTS category_id INT AFTER description,
  ADD COLUMN IF NOT EXISTS room_id INT AFTER room,
  ADD COLUMN IF NOT EXISTS status ENUM('coming_soon','now_playing','ended') DEFAULT 'now_playing' AFTER is_active,
  ADD CONSTRAINT IF NOT EXISTS fk_movie_category FOREIGN KEY (category_id) REFERENCES movie_categories(id) ON DELETE SET NULL,
  ADD CONSTRAINT IF NOT EXISTS fk_movie_room FOREIGN KEY (room_id) REFERENCES movie_rooms(id) ON DELETE SET NULL;

-- ══════════════════════════════════════════
-- SESSÕES (um filme pode ter vários horários)
-- ══════════════════════════════════════════
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
  FOREIGN KEY (room_id) REFERENCES movie_rooms(id) ON DELETE CASCADE
);

-- ══════════════════════════════════════════
-- ATUALIZAR filmes com category_id e room_id
-- ══════════════════════════════════════════
UPDATE movies SET
  category_id = (SELECT id FROM movie_categories WHERE name = 'Ficção Científica' LIMIT 1),
  room_id     = (SELECT id FROM movie_rooms WHERE name = 'Sala 1' LIMIT 1),
  status      = 'now_playing'
WHERE title = 'Abismo Estelar';

UPDATE movies SET
  category_id = (SELECT id FROM movie_categories WHERE name = 'Drama' LIMIT 1),
  room_id     = (SELECT id FROM movie_rooms WHERE name = 'Sala 2' LIMIT 1),
  status      = 'now_playing'
WHERE title = 'O Último Carnaval';

UPDATE movies SET
  category_id = (SELECT id FROM movie_categories WHERE name = 'Animação' LIMIT 1),
  room_id     = (SELECT id FROM movie_rooms WHERE name = 'Sala Kids' LIMIT 1),
  status      = 'now_playing'
WHERE title = 'Turma do Foguete';

UPDATE movies SET
  category_id = (SELECT id FROM movie_categories WHERE name = 'Suspense' LIMIT 1),
  room_id     = (SELECT id FROM movie_rooms WHERE name = 'Sala 1' LIMIT 1),
  status      = 'now_playing'
WHERE title = 'Sombra Vermelha';

UPDATE movies SET
  category_id = (SELECT id FROM movie_categories WHERE name = 'Comédia' LIMIT 1),
  room_id     = (SELECT id FROM movie_rooms WHERE name = 'Sala 2' LIMIT 1),
  status      = 'now_playing'
WHERE title = 'Festa no Caos';

UPDATE movies SET
  category_id = (SELECT id FROM movie_categories WHERE name = 'Terror' LIMIT 1),
  room_id     = (SELECT id FROM movie_rooms WHERE name = 'Sala 4' LIMIT 1),
  status      = 'now_playing'
WHERE title = 'Nas Profundezas';

UPDATE movies SET
  category_id = (SELECT id FROM movie_categories WHERE name = 'Esporte' LIMIT 1),
  room_id     = (SELECT id FROM movie_rooms WHERE name = 'Sala 3' LIMIT 1),
  status      = 'now_playing'
WHERE title = 'A Última Partida';

UPDATE movies SET
  category_id = (SELECT id FROM movie_categories WHERE name = 'Ficção Científica' LIMIT 1),
  room_id     = (SELECT id FROM movie_rooms WHERE name = 'Sala 1' LIMIT 1),
  status      = 'now_playing'
WHERE title = 'Código Laranja';

UPDATE movies SET
  category_id = (SELECT id FROM movie_categories WHERE name = 'Romance' LIMIT 1),
  room_id     = (SELECT id FROM movie_rooms WHERE name = 'Sala 2' LIMIT 1),
  status      = 'now_playing'
WHERE title = 'Luz de Agosto';

UPDATE movies SET
  category_id = (SELECT id FROM movie_categories WHERE name = 'Ação' LIMIT 1),
  room_id     = (SELECT id FROM movie_rooms WHERE name = 'Sala 4' LIMIT 1),
  status      = 'now_playing'
WHERE title = 'Guardiões do Amanhã';

UPDATE movies SET
  category_id = (SELECT id FROM movie_categories WHERE name = 'Aventura' LIMIT 1),
  room_id     = (SELECT id FROM movie_rooms WHERE name = 'Sala 2' LIMIT 1),
  status      = 'coming_soon'
WHERE title = 'Vento do Norte';

UPDATE movies SET
  category_id = (SELECT id FROM movie_categories WHERE name = 'Terror' LIMIT 1),
  room_id     = (SELECT id FROM movie_rooms WHERE name = 'Sala 1' LIMIT 1),
  status      = 'coming_soon'
WHERE title = 'O Espelho Partido';

UPDATE movies SET
  category_id = (SELECT id FROM movie_categories WHERE name = 'Comédia Romântica' LIMIT 1),
  room_id     = (SELECT id FROM movie_rooms WHERE name = 'Sala 3' LIMIT 1),
  status      = 'coming_soon'
WHERE title = 'Dois Lados do Rio';

UPDATE movies SET
  category_id = (SELECT id FROM movie_categories WHERE name = 'Thriller' LIMIT 1),
  room_id     = (SELECT id FROM movie_rooms WHERE name = 'Sala 1' LIMIT 1),
  status      = 'coming_soon'
WHERE title = 'Memória Zero';

UPDATE movies SET
  category_id = (SELECT id FROM movie_categories WHERE name = 'Ficção Científica' LIMIT 1),
  room_id     = (SELECT id FROM movie_rooms WHERE name = 'Sala 2' LIMIT 1),
  status      = 'coming_soon'
WHERE title = 'A Floresta Que Respira';

UPDATE movies SET
  category_id = (SELECT id FROM movie_categories WHERE name = 'Musical' LIMIT 1),
  room_id     = (SELECT id FROM movie_rooms WHERE name = 'Sala 3' LIMIT 1),
  status      = 'coming_soon'
WHERE title = 'Ritmo na Alma';

UPDATE movies SET
  category_id = (SELECT id FROM movie_categories WHERE name = 'Thriller Político' LIMIT 1),
  room_id     = (SELECT id FROM movie_rooms WHERE name = 'Sala 4' LIMIT 1),
  status      = 'coming_soon'
WHERE title = 'O Candidato';

-- ══════════════════════════════════════════
-- SESSÕES dos filmes em cartaz
-- ══════════════════════════════════════════
INSERT INTO movie_sessions (movie_id, room_id, session_date, session_time, language) VALUES
  -- Abismo Estelar - Sala 1
  ((SELECT id FROM movies WHERE title='Abismo Estelar'), 1, CURDATE(), '14:00:00', 'dublado'),
  ((SELECT id FROM movies WHERE title='Abismo Estelar'), 1, CURDATE(), '19:00:00', 'legendado'),
  ((SELECT id FROM movies WHERE title='Abismo Estelar'), 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '19:00:00', 'dublado'),

  -- Sombra Vermelha - Sala 1
  ((SELECT id FROM movies WHERE title='Sombra Vermelha'), 1, CURDATE(), '22:00:00', 'legendado'),
  ((SELECT id FROM movies WHERE title='Sombra Vermelha'), 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '22:00:00', 'legendado'),

  -- Turma do Foguete - Sala Kids
  ((SELECT id FROM movies WHERE title='Turma do Foguete'), 5, CURDATE(), '10:00:00', 'dublado'),
  ((SELECT id FROM movies WHERE title='Turma do Foguete'), 5, CURDATE(), '15:00:00', 'dublado'),
  ((SELECT id FROM movies WHERE title='Turma do Foguete'), 5, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', 'dublado'),

  -- O Último Carnaval - Sala 2
  ((SELECT id FROM movies WHERE title='O Último Carnaval'), 2, CURDATE(), '21:30:00', 'dublado'),
  ((SELECT id FROM movies WHERE title='O Último Carnaval'), 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '21:30:00', 'dublado'),

  -- Festa no Caos - Sala 2
  ((SELECT id FROM movies WHERE title='Festa no Caos'), 2, CURDATE(), '17:00:00', 'dublado'),
  ((SELECT id FROM movies WHERE title='Festa no Caos'), 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '17:00:00', 'dublado'),

  -- Guardiões do Amanhã - Sala 4
  ((SELECT id FROM movies WHERE title='Guardiões do Amanhã'), 4, CURDATE(), '21:00:00', 'dublado'),
  ((SELECT id FROM movies WHERE title='Guardiões do Amanhã'), 4, CURDATE(), '18:00:00', 'legendado');

-- ══════════════════════════════════════════
-- CONFIRMA
-- ══════════════════════════════════════════
SELECT
  m.title,
  mc.name AS categoria,
  mc.emoji,
  mr.name AS sala,
  mr.type AS tipo_sala,
  m.rating AS classificacao,
  m.status
FROM movies m
LEFT JOIN movie_categories mc ON m.category_id = mc.id
LEFT JOIN movie_rooms mr ON m.room_id = mr.id
ORDER BY m.status DESC, m.session_date;
