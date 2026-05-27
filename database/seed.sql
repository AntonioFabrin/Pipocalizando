-- ============================================================
-- Pipocalizando - PostgreSQL seed data
-- Assumes the schema from database/schema.sql already exists.
-- ============================================================

INSERT INTO categories (name, description)
VALUES
  ('Pipoca', 'Todos os sabores de pipoca'),
  ('Bebidas', 'Refrigerantes, sucos e agua'),
  ('Combos', 'Combos especiais pipoca + bebida'),
  ('Doces', 'Pipoca doce e guloseimas')
ON CONFLICT (name) DO NOTHING;

INSERT INTO movie_categories (name, description, emoji)
VALUES
  ('Acao', 'Filmes de acao e aventura', '💥'),
  ('Animacao', 'Filmes animados para a familia', '🎨'),
  ('Aventura', 'Jornadas epicas e descobertas', '🗺️'),
  ('Comedia', 'Filmes para rir muito', '😂'),
  ('Comedia Romantica', 'Amor e muito humor', '❤️'),
  ('Drama', 'Historias intensas e emocionantes', '🎭'),
  ('Ficcao Cientifica', 'Tecnologia, espaco e futuros', '🚀'),
  ('Musical', 'Musica, danca e emocao', '🎵'),
  ('Romance', 'Historias de amor', '💕'),
  ('Suspense', 'Tensao e misterio', '🔍'),
  ('Terror', 'Para quem gosta de um susto', '👻'),
  ('Thriller', 'Adrenalina psicologica', '🔪'),
  ('Thriller Politico', 'Poder, corrupcao e intrigas', '🏛️'),
  ('Esporte', 'Superacao e espirito esportivo', '⚽'),
  ('Infantil', 'Diversao para os pequenos', '🧒'),
  ('Documentario', 'Historias reais e fascinantes', '🎥')
ON CONFLICT (name) DO NOTHING;

INSERT INTO movie_rooms (id, name, capacity, type, has_3d, has_accessibility)
VALUES
  (1, 'Sala 1', 120, 'standard', FALSE, TRUE),
  (2, 'Sala 2', 100, 'standard', FALSE, TRUE),
  (3, 'Sala 3', 80, '3d', TRUE, TRUE),
  (4, 'Sala 4', 150, 'vip', FALSE, TRUE),
  (5, 'Sala Kids', 60, 'kids', FALSE, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (name, email, password, role, phone)
VALUES
  ('Admin Pipocalizando', 'admin@pipocalizando.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin', '(00) 00000-0000'),
  ('Vendedor Demo', 'vendedor@pipocalizando.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'seller', '(00) 00000-0002')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  phone = EXCLUDED.phone,
  updated_at = NOW();

INSERT INTO products (name, description, price, stock, category_id, is_active)
VALUES
  ('Pipoca Salgada P', 'Pipoca salgada tamanho pequeno', 5.00, 150, 1, TRUE),
  ('Pipoca Salgada M', 'Pipoca salgada tamanho medio', 8.00, 150, 1, TRUE),
  ('Pipoca Salgada G', 'Pipoca salgada tamanho grande', 12.00, 150, 1, TRUE),
  ('Pipoca Doce P', 'Pipoca doce tamanho pequeno', 6.00, 100, 4, TRUE),
  ('Pipoca Caramelo M', 'Pipoca com caramelo tamanho medio', 10.00, 80, 4, TRUE),
  ('Refrigerante Lata', 'Refrigerante lata 350ml', 5.00, 300, 2, TRUE),
  ('Suco Natural', 'Suco natural 300ml', 7.00, 80, 2, TRUE),
  ('Combo Classico', 'Pipoca M + Refrigerante', 15.00, 100, 3, TRUE),
  ('Combo Premium', 'Pipoca G + 2 Refrigerantes', 22.00, 80, 3, TRUE)
ON CONFLICT (name) DO NOTHING;
