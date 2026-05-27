-- ============================================================
-- Pipocalizando - PostgreSQL schema for Supabase
-- Run this in the Supabase SQL editor or psql.
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'customer'
    CHECK (role IN ('super_admin', 'manager', 'seller', 'customer')),
  phone VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS movie_categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  emoji VARCHAR(20) DEFAULT '🎬',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS movie_rooms (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  capacity INT NOT NULL DEFAULT 100,
  type VARCHAR(20) NOT NULL DEFAULT 'standard'
    CHECK (type IN ('standard', 'vip', '3d', 'imax', 'kids')),
  has_3d BOOLEAN NOT NULL DEFAULT FALSE,
  has_accessibility BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  image_url VARCHAR(500),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS movies (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category_id BIGINT REFERENCES movie_categories(id) ON DELETE SET NULL,
  genre VARCHAR(100),
  duration_minutes INT,
  director VARCHAR(150),
  cast_info TEXT,
  rating VARCHAR(20),
  poster_url VARCHAR(500),
  banner_url VARCHAR(500),
  trailer_url VARCHAR(500),
  session_date DATE,
  session_time TIME,
  room VARCHAR(100),
  room_id BIGINT REFERENCES movie_rooms(id) ON DELETE SET NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  premiere_date DATE,
  on_display_until DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'now_playing'
    CHECK (status IN ('coming_soon', 'now_playing', 'ended')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_movies_updated_at ON movies;
CREATE TRIGGER trg_movies_updated_at
BEFORE UPDATE ON movies
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS movie_sessions (
  id BIGSERIAL PRIMARY KEY,
  movie_id BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  room_id BIGINT NOT NULL REFERENCES movie_rooms(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  session_time TIME NOT NULL,
  available_seats INT NOT NULL DEFAULT 100,
  language VARCHAR(20) NOT NULL DEFAULT 'dublado'
    CHECK (language IN ('dublado', 'legendado', 'original')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES users(id),
  seller_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  session_id BIGINT REFERENCES movie_sessions(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  total NUMERIC(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS tickets (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  ticket_code VARCHAR(50) NOT NULL UNIQUE,
  seat_label VARCHAR(10),
  movie_id BIGINT REFERENCES movies(id) ON DELETE SET NULL,
  session_id BIGINT REFERENCES movie_sessions(id) ON DELETE SET NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tickets_session_seat
  ON tickets (session_id, seat_label);
CREATE INDEX IF NOT EXISTS idx_tickets_order
  ON tickets (order_id);
CREATE INDEX IF NOT EXISTS idx_tickets_session
  ON tickets (session_id);

CREATE TABLE IF NOT EXISTS seat_reservations (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT NOT NULL REFERENCES movie_sessions(id) ON DELETE CASCADE,
  movie_id BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seat_label VARCHAR(10) NOT NULL,
  reservation_token VARCHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_seat_reservation UNIQUE (session_id, seat_label)
);

CREATE INDEX IF NOT EXISTS idx_seat_reservations_expiry
  ON seat_reservations (expires_at);
CREATE INDEX IF NOT EXISTS idx_seat_reservations_user_session
  ON seat_reservations (user_id, session_id);

CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method VARCHAR(20) NOT NULL
    CHECK (method IN ('cash', 'credit_card', 'debit_card', 'pix')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'refunded')),
  status_detail VARCHAR(100),
  provider VARCHAR(50),
  provider_payment_id VARCHAR(100),
  external_reference VARCHAR(100),
  checkout_url VARCHAR(500),
  qr_code TEXT,
  qr_code_base64 TEXT,
  expires_at TIMESTAMPTZ,
  raw_response JSONB,
  amount NUMERIC(10, 2) NOT NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id
  ON payments (provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_external_reference
  ON payments (external_reference);
CREATE INDEX IF NOT EXISTS idx_payments_status_expires_at
  ON payments (status, expires_at);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_user
  ON password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_token
  ON password_reset_tokens (token);

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

INSERT INTO products (name, description, price, stock, category_id, image_url, is_active)
VALUES
  ('Pipoca Salgada P', 'Pipoca salgada tamanho pequeno', 5.00, 150, 1, NULL, TRUE),
  ('Pipoca Salgada M', 'Pipoca salgada tamanho medio', 8.00, 150, 1, NULL, TRUE),
  ('Pipoca Salgada G', 'Pipoca salgada tamanho grande', 12.00, 150, 1, NULL, TRUE),
  ('Pipoca Doce P', 'Pipoca doce tamanho pequeno', 6.00, 100, 4, NULL, TRUE),
  ('Pipoca Caramelo M', 'Pipoca com caramelo tamanho medio', 10.00, 80, 4, NULL, TRUE),
  ('Refrigerante Lata', 'Refrigerante lata 350ml', 5.00, 300, 2, NULL, TRUE),
  ('Suco Natural', 'Suco natural 300ml', 7.00, 80, 2, NULL, TRUE),
  ('Combo Classico', 'Pipoca M + Refrigerante', 15.00, 100, 3, NULL, TRUE),
  ('Combo Premium', 'Pipoca G + 2 Refrigerantes', 22.00, 80, 3, NULL, TRUE)
ON CONFLICT (name) DO NOTHING;

COMMIT;
