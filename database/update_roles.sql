-- Normalize legacy admin role values for PostgreSQL
UPDATE users
SET role = 'super_admin'
WHERE role = 'admin';

ALTER TABLE users
  ALTER COLUMN role SET DEFAULT 'customer';

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('super_admin', 'manager', 'seller', 'customer'));
