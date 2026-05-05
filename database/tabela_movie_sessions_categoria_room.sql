CREATE TABLE IF NOT EXISTS movie_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  emoji VARCHAR(10) DEFAULT '🎬',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movie_rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  capacity INT DEFAULT 100,
  type ENUM('standard','vip','3d','imax','kids') DEFAULT 'standard',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO movie_rooms (name, capacity, type) VALUES
  ('Sala 1', 120, 'standard'),
  ('Sala 2', 100, 'standard'),
  ('Sala 3',  80, '3d'),
  ('Sala 4', 150, 'vip'),
  ('Sala Kids', 60, 'kids');

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

ALTER TABLE orders
  ADD COLUMN session_id INT NULL AFTER seller_id,
  ADD CONSTRAINT fk_orders_session
    FOREIGN KEY (session_id) REFERENCES movie_sessions(id) ON DELETE SET NULL;