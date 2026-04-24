-- ============================================
-- PIPOCALIZANDO - Schema MySQL
-- Sistema de Vendas / Seller Ticker
-- ============================================

CREATE DATABASE IF NOT EXISTS pipocalizando;
USE pipocalizando;

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'seller', 'customer') NOT NULL DEFAULT 'customer',
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  category_id INT,
  image_url VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Tabela de Pedidos
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  seller_id INT,
  status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
  total DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabela de Itens do Pedido (subtotal removido como coluna gerada)
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Tabela de Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL UNIQUE,
  ticket_code VARCHAR(50) NOT NULL UNIQUE,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_used TINYINT(1) DEFAULT 0,
  used_at TIMESTAMP NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Tabela de Pagamentos
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  method ENUM('cash', 'credit_card', 'debit_card', 'pix') NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'refunded') DEFAULT 'pending',
  amount DECIMAL(10, 2) NOT NULL,
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- ============================================
-- Dados iniciais (seed)
-- ============================================

INSERT IGNORE INTO categories (name, description) VALUES
  ('Pipoca', 'Todos os sabores de pipoca'),
  ('Bebidas', 'Refrigerantes, sucos e água'),
  ('Combos', 'Combos especiais pipoca + bebida'),
  ('Doces', 'Pipoca doce e guloseimas');

INSERT IGNORE INTO users (name, email, password, role) VALUES
  ('Admin Pipocalizando', 'admin@pipocalizando.com', '$2b$10$hashedpassword', 'admin'),
  ('Vendedor 1', 'vendedor@pipocalizando.com', '$2b$10$hashedpassword', 'seller');

INSERT IGNORE INTO products (name, description, price, stock, category_id) VALUES
  ('Pipoca Salgada P', 'Pipoca salgada tamanho pequeno', 5.00, 100, 1),
  ('Pipoca Salgada M', 'Pipoca salgada tamanho médio', 8.00, 100, 1),
  ('Pipoca Salgada G', 'Pipoca salgada tamanho grande', 12.00, 100, 1),
  ('Pipoca Doce P', 'Pipoca doce tamanho pequeno', 6.00, 100, 4),
  ('Pipoca Caramelo M', 'Pipoca com caramelo tamanho médio', 10.00, 80, 4),
  ('Refrigerante Lata', 'Refrigerante lata 350ml', 5.00, 200, 2),
  ('Suco Natural', 'Suco natural 300ml', 7.00, 50, 2),
  ('Combo Clássico', 'Pipoca M + Refrigerante', 15.00, 50, 3),
  ('Combo Premium', 'Pipoca G + 2 Refrigerantes', 22.00, 30, 3);
