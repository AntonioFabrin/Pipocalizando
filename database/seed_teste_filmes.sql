USE pipocalizando;

-- ══════════════════════════════════════════════════════════
-- SEED DE TESTE — Filmes em cartaz com sessões
-- Execute este arquivo no seu MySQL/HeidiSQL
-- ══════════════════════════════════════════════════════════

-- Garante que as categorias e salas padrão existem
INSERT IGNORE INTO movie_categories (name, description, emoji) VALUES
  ('Ação',           'Filmes com muita adrenalina e aventura',   '💥'),
  ('Ficção Científica', 'Tecnologia, espaço e futuros',          '🚀'),
  ('Animação',       'Filmes animados para toda a família',       '🎨'),
  ('Terror',         'Para quem gosta de levar um susto',         '👻'),
  ('Comédia',        'Filmes para rir muito',                     '😂');

INSERT IGNORE INTO movie_rooms (name, capacity, type, has_3d, has_accessibility) VALUES
  ('Sala 1',    120, 'standard', 0, 1),
  ('Sala 2',    100, 'standard', 0, 1),
  ('Sala VIP',   60, 'vip',      0, 1),
  ('Sala 3D',    80, '3d',       1, 1),
  ('Sala Kids',  60, 'kids',     0, 1);

-- ── Filme 1: Ação ────────────────────────────────────────
INSERT INTO movies (
  title, description, genre, duration_minutes,
  director, cast_info, rating, poster_url,
  session_date, session_time, room,
  price, premiere_date, on_display_until,
  status, is_active, category_id, room_id
) VALUES (
  'Código Infinito',
  'Um ex-agente secreto é forçado a voltar à ativa quando descobre que uma IA rogue está prestes a desencadear um ataque global. Com o tempo correndo contra ele, precisa infiltrar o quartel-general inimigo antes que seja tarde demais.',
  'Ação / Ficção Científica',
  128,
  'Marcos Duarte',
  'Ricardo Alves, Fernanda Costa, João Mendes',
  '14+',
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop',
  CURDATE(),
  '19:30:00',
  'Sala VIP',
  28.00,
  DATE_SUB(CURDATE(), INTERVAL 7 DAY),
  DATE_ADD(CURDATE(), INTERVAL 14 DAY),
  'now_playing',
  1,
  (SELECT id FROM movie_categories WHERE name = 'Ação' LIMIT 1),
  (SELECT id FROM movie_rooms WHERE name = 'Sala VIP' LIMIT 1)
);

-- Sessões extras do Filme 1
INSERT INTO movie_sessions (movie_id, room_id, session_date, session_time, available_seats, language)
SELECT
  m.id,
  (SELECT id FROM movie_rooms WHERE name = 'Sala VIP' LIMIT 1),
  dt.session_date,
  dt.session_time,
  60,
  dt.lang
FROM movies m
JOIN (
  SELECT CURDATE() AS session_date, '14:00:00' AS session_time, 'dublado' AS lang
  UNION ALL SELECT CURDATE(), '19:30:00', 'dublado'
  UNION ALL SELECT CURDATE(), '22:00:00', 'legendado'
  UNION ALL SELECT DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00', 'dublado'
  UNION ALL SELECT DATE_ADD(CURDATE(), INTERVAL 1 DAY), '19:30:00', 'dublado'
  UNION ALL SELECT DATE_ADD(CURDATE(), INTERVAL 2 DAY), '19:30:00', 'legendado'
) dt
WHERE m.title = 'Código Infinito';

-- ── Filme 2: Animação ────────────────────────────────────
INSERT INTO movies (
  title, description, genre, duration_minutes,
  director, cast_info, rating, poster_url,
  session_date, session_time, room,
  price, premiere_date, on_display_until,
  status, is_active, category_id, room_id
) VALUES (
  'Planeta dos Sonhos',
  'Lila, uma garotinha de 8 anos, descobre um portal mágico no fundo do seu quintal que leva a um mundo onde os sonhos ganham vida. Mas para voltar para casa, ela precisará enfrentar o maior medo de todos: perder alguém que ama.',
  'Animação / Infantil',
  95,
  'Ana Paula Rocha',
  'Vozes de: Vitória Lima, Pedro Nunes, Carla Dias',
  'Livre',
  'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=400&h=600&fit=crop',
  CURDATE(),
  '10:00:00',
  'Sala Kids',
  22.00,
  DATE_SUB(CURDATE(), INTERVAL 3 DAY),
  DATE_ADD(CURDATE(), INTERVAL 21 DAY),
  'now_playing',
  1,
  (SELECT id FROM movie_categories WHERE name = 'Animação' LIMIT 1),
  (SELECT id FROM movie_rooms WHERE name = 'Sala Kids' LIMIT 1)
);

INSERT INTO movie_sessions (movie_id, room_id, session_date, session_time, available_seats, language)
SELECT
  m.id,
  (SELECT id FROM movie_rooms WHERE name = 'Sala Kids' LIMIT 1),
  dt.session_date,
  dt.session_time,
  60,
  'dublado'
FROM movies m
JOIN (
  SELECT CURDATE() AS session_date, '10:00:00' AS session_time
  UNION ALL SELECT CURDATE(), '13:00:00'
  UNION ALL SELECT CURDATE(), '15:30:00'
  UNION ALL SELECT DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00'
  UNION ALL SELECT DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00'
) dt
WHERE m.title = 'Planeta dos Sonhos';

-- ── Filme 3: Terror ─────────────────────────────────────
INSERT INTO movies (
  title, description, genre, duration_minutes,
  director, cast_info, rating, poster_url,
  session_date, session_time, room,
  price, premiere_date, on_display_until,
  status, is_active, category_id, room_id
) VALUES (
  'A Casa do Fim',
  'Uma família se muda para uma mansão isolada no interior e começa a ouvir vozes nas paredes. O que parecia ser imaginação logo se transforma em uma batalha pela sobrevivência contra uma presença que existe ali há séculos.',
  'Terror / Suspense',
  110,
  'Bruno Carvalho',
  'Letícia Faria, Thiago Melo, Sandra Vasconcelos',
  '16+',
  'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400&h=600&fit=crop',
  CURDATE(),
  '22:00:00',
  'Sala 2',
  25.00,
  DATE_SUB(CURDATE(), INTERVAL 10 DAY),
  DATE_ADD(CURDATE(), INTERVAL 5 DAY),
  'now_playing',
  1,
  (SELECT id FROM movie_categories WHERE name = 'Terror' LIMIT 1),
  (SELECT id FROM movie_rooms WHERE name = 'Sala 2' LIMIT 1)
);

INSERT INTO movie_sessions (movie_id, room_id, session_date, session_time, available_seats, language)
SELECT
  m.id,
  (SELECT id FROM movie_rooms WHERE name = 'Sala 2' LIMIT 1),
  dt.session_date,
  dt.session_time,
  100,
  dt.lang
FROM movies m
JOIN (
  SELECT CURDATE() AS session_date, '20:00:00' AS session_time, 'dublado' AS lang
  UNION ALL SELECT CURDATE(), '22:30:00', 'legendado'
  UNION ALL SELECT DATE_ADD(CURDATE(), INTERVAL 1 DAY), '22:00:00', 'dublado'
) dt
WHERE m.title = 'A Casa do Fim';

-- ── Filme 4: Comédia ─────────────────────────────────────
INSERT INTO movies (
  title, description, genre, duration_minutes,
  director, cast_info, rating, poster_url,
  session_date, session_time, room,
  price, premiere_date, on_display_until,
  status, is_active, category_id, room_id
) VALUES (
  'Vizinhos do Caos',
  'Dois vizinhos completamente opostos — um músico barulhento e um contador obcecado com silêncio — são forçados a dividir a mesma cobertura por uma semana após um acidente hidráulico. O que poderia dar errado?',
  'Comédia',
  100,
  'Cláudia Ferreira',
  'Davi Santos, Isabela Carmo, Nelson Filho',
  '12+',
  'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=600&fit=crop',
  CURDATE(),
  '17:00:00',
  'Sala 1',
  20.00,
  DATE_SUB(CURDATE(), INTERVAL 5 DAY),
  DATE_ADD(CURDATE(), INTERVAL 18 DAY),
  'now_playing',
  1,
  (SELECT id FROM movie_categories WHERE name = 'Comédia' LIMIT 1),
  (SELECT id FROM movie_rooms WHERE name = 'Sala 1' LIMIT 1)
);

INSERT INTO movie_sessions (movie_id, room_id, session_date, session_time, available_seats, language)
SELECT
  m.id,
  (SELECT id FROM movie_rooms WHERE name = 'Sala 1' LIMIT 1),
  dt.session_date,
  dt.session_time,
  120,
  'dublado'
FROM movies m
JOIN (
  SELECT CURDATE() AS session_date, '15:00:00' AS session_time
  UNION ALL SELECT CURDATE(), '17:30:00'
  UNION ALL SELECT CURDATE(), '20:00:00'
  UNION ALL SELECT DATE_ADD(CURDATE(), INTERVAL 1 DAY), '17:30:00'
  UNION ALL SELECT DATE_ADD(CURDATE(), INTERVAL 1 DAY), '20:00:00'
) dt
WHERE m.title = 'Vizinhos do Caos';

-- ══════════════════════════════════════════════════════════
-- CONFIRMA O QUE FOI INSERIDO
-- ══════════════════════════════════════════════════════════
SELECT
  m.id,
  m.title,
  mc.emoji,
  mc.name AS categoria,
  mr.name AS sala,
  m.rating AS classificacao,
  m.price AS preco,
  m.on_display_until AS em_cartaz_ate,
  m.status,
  COUNT(ms.id) AS total_sessoes
FROM movies m
LEFT JOIN movie_categories mc ON m.category_id = mc.id
LEFT JOIN movie_rooms mr ON m.room_id = mr.id
LEFT JOIN movie_sessions ms ON ms.movie_id = m.id AND ms.is_active = 1
WHERE m.is_active = 1 AND m.status = 'now_playing'
GROUP BY m.id, m.title, mc.emoji, mc.name, mr.name, m.rating, m.price, m.on_display_until, m.status
ORDER BY m.id DESC;
