-- ============================================
-- PIPOCALIZANDO - Schema MySQL
-- Fresh database setup aligned with the API code.
-- ============================================

CREATE DATABASE IF NOT EXISTS pipocalizando;
USE pipocalizando;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'manager', 'seller', 'customer') NOT NULL DEFAULT 'customer',
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  category_id INT,
  image_url VARCHAR(500),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS movie_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  emoji VARCHAR(20) DEFAULT '🎬',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movie_rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  capacity INT DEFAULT 100,
  type ENUM('standard', 'imax', 'vip', 'kids') DEFAULT 'standard',
  has_3d TINYINT(1) DEFAULT 0,
  has_accessibility TINYINT(1) DEFAULT 1,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category_id INT,
  genre VARCHAR(100),
  duration_minutes INT,
  director VARCHAR(150),
  cast_info TEXT,
  rating VARCHAR(20),
  poster_url VARCHAR(500),
  trailer_url VARCHAR(500),
  session_date DATE,
  session_time TIME,
  room VARCHAR(100),
  room_id INT,
  price DECIMAL(10, 2) DEFAULT 0,
  premiere_date DATE,
  on_display_until DATE,
  status ENUM('coming_soon', 'now_playing', 'ended') DEFAULT 'now_playing',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES movie_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (room_id) REFERENCES movie_rooms(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS movie_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  movie_id INT NOT NULL,
  room_id INT NOT NULL,
  session_date DATE NOT NULL,
  session_time TIME NOT NULL,
  available_seats INT DEFAULT 100,
  language ENUM('dublado', 'legendado', 'original') DEFAULT 'dublado',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES movie_rooms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  seller_id INT,
  session_id INT,
  status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
  total DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (session_id) REFERENCES movie_sessions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  ticket_code VARCHAR(50) NOT NULL UNIQUE,
  seat_label VARCHAR(10),
  movie_id INT,
  session_id INT,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_used TINYINT(1) DEFAULT 0,
  used_at TIMESTAMP NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE SET NULL,
  FOREIGN KEY (session_id) REFERENCES movie_sessions(id) ON DELETE SET NULL,
  UNIQUE KEY uq_tickets_session_seat (session_id, seat_label),
  INDEX idx_tickets_order (order_id),
  INDEX idx_tickets_session (session_id)
);

CREATE TABLE IF NOT EXISTS seat_reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  movie_id INT NOT NULL,
  user_id INT NOT NULL,
  seat_label VARCHAR(10) NOT NULL,
  reservation_token VARCHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES movie_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_seat_reservation (session_id, seat_label),
  INDEX idx_seat_reservations_expiry (expires_at),
  INDEX idx_seat_reservations_user_session (user_id, session_id)
);

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  method ENUM('cash', 'credit_card', 'debit_card', 'pix') NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'refunded') DEFAULT 'pending',
  status_detail VARCHAR(100),
  provider VARCHAR(50),
  provider_payment_id VARCHAR(100),
  external_reference VARCHAR(100),
  checkout_url VARCHAR(500),
  qr_code TEXT,
  qr_code_base64 MEDIUMTEXT,
  expires_at DATETIME NULL,
  raw_response JSON,
  amount DECIMAL(10, 2) NOT NULL,
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_payments_provider_payment_id (provider_payment_id),
  INDEX idx_payments_external_reference (external_reference),
  INDEX idx_payments_status_expires_at (status, expires_at)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_password_reset_user (user_id),
  INDEX idx_password_reset_token (token)
);

INSERT IGNORE INTO categories (name, description) VALUES
  ('Pipoca', 'Todos os sabores de pipoca'),
  ('Bebidas', 'Refrigerantes, sucos e agua'),
  ('Combos', 'Combos especiais pipoca + bebida'),
  ('Doces', 'Pipoca doce e guloseimas');

INSERT IGNORE INTO movie_categories (name, description, emoji) VALUES
  ('Acao', 'Filmes de acao e aventura', '🎬'),
  ('Comedia', 'Filmes de comedia', '😂'),
  ('Drama', 'Filmes dramaticos', '🎭'),
  ('Infantil', 'Filmes para toda a familia', '🌟');

INSERT IGNORE INTO movie_rooms (name, capacity, type, has_3d, has_accessibility) VALUES
  ('Sala 1', 100, 'standard', 0, 1),
  ('Sala 2', 100, 'standard', 1, 1),
  ('Sala VIP', 80, 'vip', 0, 1);

-- Default seeded password is "password". Change it immediately or run database/criar_admin.js.
INSERT IGNORE INTO users (name, email, password, role, phone) VALUES
  ('Admin Pipocalizando', 'admin@pipocalizando.com',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'super_admin', '(00) 00000-0000'),
  ('Vendedor 1', 'vendedor@pipocalizando.com',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'seller', '(00) 00000-0001');

INSERT IGNORE INTO products (name, description, price, stock, category_id) VALUES
  ('Pipoca Salgada P', 'Pipoca salgada tamanho pequeno', 5.00, 100, 1),
  ('Pipoca Salgada M', 'Pipoca salgada tamanho medio', 8.00, 100, 1),
  ('Pipoca Salgada G', 'Pipoca salgada tamanho grande', 12.00, 100, 1),
  ('Pipoca Doce P', 'Pipoca doce tamanho pequeno', 6.00, 100, 4),
  ('Pipoca Caramelo M', 'Pipoca com caramelo tamanho medio', 10.00, 80, 4),
  ('Refrigerante Lata', 'Refrigerante lata 350ml', 5.00, 200, 2),
  ('Suco Natural', 'Suco natural 300ml', 7.00, 50, 2),
  ('Combo Classico', 'Pipoca M + Refrigerante', 15.00, 50, 3),
  ('Combo Premium', 'Pipoca G + 2 Refrigerantes', 22.00, 30, 3);
