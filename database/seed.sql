-- ============================================
-- PIPOCALIZANDO - Seed completo
-- Execute no HeidiSQL no banco pipocalizando
-- ============================================
USE pipocalizando;

-- ── Categorias ──────────────────────────────
INSERT INTO categories (name, description) VALUES
  ('Pipoca',  'Todos os sabores de pipoca'),
  ('Bebidas', 'Refrigerantes, sucos e água'),
  ('Combos',  'Combos especiais pipoca + bebida'),
  ('Doces',   'Pipoca doce e guloseimas')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ── Produtos ────────────────────────────────
-- (Apaga os antigos com senha inválida e recria)
DELETE FROM products WHERE id > 0;

INSERT INTO products (name, description, price, stock, category_id) VALUES
  -- Pipoca salgada
  ('Pipoca Salgada P',       'Pipoca salgada manteiga - tamanho pequeno (50g)',      5.00,  150, 1),
  ('Pipoca Salgada M',       'Pipoca salgada manteiga - tamanho médio (100g)',       8.00,  150, 1),
  ('Pipoca Salgada G',       'Pipoca salgada manteiga - tamanho grande (180g)',     12.00,  150, 1),
  ('Pipoca Cheddar M',       'Pipoca com cheddar derretido - tamanho médio',        11.00,   80, 1),
  ('Pipoca Bacon G',         'Pipoca crocante com bacon bits - tamanho grande',     14.00,   60, 1),
  -- Pipoca doce
  ('Pipoca Doce P',          'Pipoca doce clássica - tamanho pequeno',               6.00,  100, 4),
  ('Pipoca Doce M',          'Pipoca doce clássica - tamanho médio',                 9.00,  100, 4),
  ('Pipoca Caramelo M',      'Pipoca coberta com caramelo - tamanho médio',         11.00,   80, 4),
  ('Pipoca Chocolate G',     'Pipoca com cobertura de chocolate ao leite',          15.00,   50, 4),
  ('Pipoca Churros M',       'Pipoca sabor churros com canela e açúcar',            12.00,   70, 4),
  -- Bebidas
  ('Refrigerante Lata',      'Refrigerante lata 350ml - Coca, Pepsi ou Guaraná',    5.00,  300, 2),
  ('Refrigerante 600ml',     'Refrigerante garrafa 600ml',                           7.00,  200, 2),
  ('Suco de Laranja',        'Suco natural de laranja 300ml',                        7.00,   80, 2),
  ('Suco de Uva',            'Suco de uva integral 300ml',                           7.00,   80, 2),
  ('Água Mineral',           'Água mineral sem gás 500ml',                           3.00,  400, 2),
  ('Água com Gás',           'Água mineral com gás 500ml',                           4.00,  200, 2),
  ('Chocolate Quente',       'Chocolate quente cremoso 300ml',                       9.00,   60, 2),
  -- Combos
  ('Combo Clássico',         'Pipoca Salgada M + Refrigerante Lata',               12.00,  100, 3),
  ('Combo Premium',          'Pipoca Salgada G + 2 Refrigerantes Lata',            20.00,   80, 3),
  ('Combo Família',          'Pipoca G + Pipoca M + 2 Refrigerantes + 1 Água',     30.00,   40, 3),
  ('Combo Doce',             'Pipoca Caramelo M + Chocolate Quente',               18.00,   50, 3),
  ('Combo Casal',            'Pipoca Cheddar M + 2 Refrigerantes 600ml',           24.00,   60, 3);

-- ── Usuários (senha: Admin@1234 e Vendedor@1234) ──
-- Hash bcrypt gerado externamente para não depender do backend
-- Para criar usuários reais, use o endpoint POST /api/auth/register

-- Verifica se já existe admin, se não existir insere
INSERT IGNORE INTO users (name, email, password, role, phone) VALUES
  ('Administrador', 'admin@pipocalizando.com',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- senha: password
   'super_admin', '(43) 99999-0001'),
  ('Vendedor Demo', 'vendedor@pipocalizando.com',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- senha: password
   'seller', '(43) 99999-0002');

-- ── Confere o resultado ──────────────────────
SELECT 'Categorias:' as info, COUNT(*) as total FROM categories
UNION ALL
SELECT 'Produtos:', COUNT(*) FROM products WHERE is_active = 1
UNION ALL
SELECT 'Usuários:', COUNT(*) FROM users;
