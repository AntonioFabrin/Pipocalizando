-- Atualiza o ENUM de roles na tabela users
ALTER TABLE users 
MODIFY COLUMN role ENUM('super_admin', 'manager', 'seller', 'customer') NOT NULL DEFAULT 'customer';

-- Atualiza o usuário admin existente para super_admin
UPDATE users SET role = 'super_admin' WHERE role = 'admin';
