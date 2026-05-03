-- Migration: adiciona session_id na tabela orders
-- Execute este arquivo no seu banco MySQL

ALTER TABLE orders
  ADD COLUMN session_id INT NULL AFTER seller_id,
  ADD CONSTRAINT fk_orders_session
    FOREIGN KEY (session_id) REFERENCES movie_sessions(id) ON DELETE SET NULL;

-- Tabela para tokens de recuperação de senha
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  token       VARCHAR(6) NOT NULL,
  expires_at  TIMESTAMP NOT NULL,
  used        TINYINT(1) DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
