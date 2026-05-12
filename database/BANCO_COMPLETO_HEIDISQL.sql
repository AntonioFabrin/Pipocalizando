-- ============================================================
-- PIPOCALIZANDO - BANCO COMPLETO
-- Cole tudo isso no HeidiSQL e execute (F9 ou botao "Executar")
-- ============================================================

USE pipocalizando;

SET FOREIGN_KEY_CHECKS = 0;

-- ══════════════════════════════════════════════════════════
-- 1. USUARIOS
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('super_admin','manager','seller','customer') NOT NULL DEFAULT 'customer',
  phone      VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Corrige ENUM se a tabela ja existia com role 'admin'
ALTER TABLE users
  MODIFY COLUMN role ENUM('super_admin','manager','seller','customer') NOT NULL DEFAULT 'customer';

UPDATE users SET role = 'super_admin' WHERE role = 'admin';

-- ══════════════════════════════════════════════════════════
-- 2. CATEGORIAS DE PRODUTO
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO categories (name, description) VALUES
  ('Pipoca',  'Todos os sabores de pipoca'),
  ('Bebidas', 'Refrigerantes, sucos e agua'),
  ('Combos',  'Combos especiais pipoca + bebida'),
  ('Doces',   'Pipoca doce e guloseimas');

-- ══════════════════════════════════════════════════════════
-- 3. PRODUTOS
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  description TEXT,
  price       DECIMAL(10,2) NOT NULL,
  stock       INT NOT NULL DEFAULT 0,
  category_id INT,
  image_url   VARCHAR(255),
  is_active   TINYINT(1) DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

INSERT IGNORE INTO products (name, description, price, stock, category_id) VALUES
  ('Pipoca Salgada P',  'Pipoca salgada tamanho pequeno',         5.00, 100, 1),
  ('Pipoca Salgada M',  'Pipoca salgada tamanho medio',           8.00, 100, 1),
  ('Pipoca Salgada G',  'Pipoca salgada tamanho grande',         12.00, 100, 1),
  ('Pipoca Doce P',     'Pipoca doce tamanho pequeno',            6.00, 100, 4),
  ('Pipoca Caramelo M', 'Pipoca com caramelo tamanho medio',     10.00,  80, 4),
  ('Refrigerante Lata', 'Refrigerante lata 350ml',                5.00, 200, 2),
  ('Suco Natural',      'Suco natural 300ml',                     7.00,  50, 2),
  ('Combo Classico',    'Pipoca M + Refrigerante',               15.00,  50, 3),
  ('Combo Premium',     'Pipoca G + 2 Refrigerantes',            22.00,  30, 3);

-- ══════════════════════════════════════════════════════════
-- 4. PEDIDOS
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS orders (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  seller_id   INT,
  session_id  INT,
  status      ENUM('pending','confirmed','preparing','ready','delivered','cancelled') DEFAULT 'pending',
  total       DECIMAL(10,2) NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (seller_id)   REFERENCES users(id) ON DELETE SET NULL
);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS session_id INT NULL AFTER seller_id;

-- ══════════════════════════════════════════════════════════
-- 5. ITENS DO PEDIDO
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS order_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT NOT NULL,
  product_id  INT NOT NULL,
  quantity    INT NOT NULL,
  unit_price  DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ══════════════════════════════════════════════════════════
-- 6. TICKETS
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS tickets (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT NOT NULL UNIQUE,
  ticket_code VARCHAR(50) NOT NULL UNIQUE,
  issued_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_used     TINYINT(1) DEFAULT 0,
  used_at     TIMESTAMP NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ══════════════════════════════════════════════════════════
-- 7. PAGAMENTOS
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS payments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT NOT NULL,
  method     ENUM('cash','credit_card','debit_card','pix') NOT NULL,
  status     ENUM('pending','approved','rejected','refunded') DEFAULT 'pending',
  amount     DECIMAL(10,2) NOT NULL,
  paid_at    TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- ══════════════════════════════════════════════════════════
-- 8. RECUPERACAO DE SENHA
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  token      VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used       TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ══════════════════════════════════════════════════════════
-- 9. CATEGORIAS DE FILMES
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS movie_categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  emoji       VARCHAR(10) DEFAULT '🎬',
  is_active   TINYINT(1) DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO movie_categories (name, description, emoji) VALUES
  ('Acao',              'Filmes com adrenalina e aventura',   '💥'),
  ('Animacao',          'Filmes animados para a familia',     '🎨'),
  ('Aventura',          'Jornadas epicas e descobertas',      '🗺️'),
  ('Comedia',           'Filmes para rir muito',              '😂'),
  ('Comedia Romantica', 'Amor e muito humor',                 '❤️'),
  ('Drama',             'Historias intensas e emocionantes',  '🎭'),
  ('Ficcao Cientifica', 'Tecnologia, espaco e futuros',       '🚀'),
  ('Musical',           'Musica, danca e emocao',             '🎵'),
  ('Romance',           'Historias de amor',                  '💕'),
  ('Suspense',          'Tensao e misterio',                  '🔍'),
  ('Terror',            'Para quem gosta de um susto',        '👻'),
  ('Thriller',          'Adrenalina psicologica',             '🔪'),
  ('Thriller Politico', 'Poder, corrupcao e intrigas',        '🏛️'),
  ('Esporte',           'Superacao e espirito esportivo',     '⚽'),
  ('Infantil',          'Diversao para os pequenos',          '🧒'),
  ('Documentario',      'Historias reais e fascinantes',      '🎥');

-- ══════════════════════════════════════════════════════════
-- 10. SALAS DE CINEMA
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS movie_rooms (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(50) NOT NULL,
  capacity          INT DEFAULT 100,
  type              ENUM('standard','vip','3d','imax','kids') DEFAULT 'standard',
  has_3d            TINYINT(1) DEFAULT 0,
  has_accessibility TINYINT(1) DEFAULT 1,
  is_active         TINYINT(1) DEFAULT 1,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO movie_rooms (id, name, capacity, type, has_3d, has_accessibility) VALUES
  (1, 'Sala 1',    120, 'standard', 0, 1),
  (2, 'Sala 2',    100, 'standard', 0, 1),
  (3, 'Sala 3',     80, '3d',       1, 1),
  (4, 'Sala 4',    150, 'vip',      0, 1),
  (5, 'Sala Kids',  60, 'kids',     0, 1);

-- ══════════════════════════════════════════════════════════
-- 11. FILMES (com TODAS as colunas que o backend usa)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS movies (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  title            VARCHAR(200) NOT NULL,
  description      TEXT,
  category_id      INT,
  genre            VARCHAR(100),
  duration_minutes INT,
  director         VARCHAR(150),
  cast_info        TEXT,
  rating           VARCHAR(10),
  poster_url       VARCHAR(500),
  banner_url       VARCHAR(500),
  session_date     DATE,
  session_time     TIME,
  room             VARCHAR(50),
  room_id          INT,
  price            DECIMAL(10,2) DEFAULT 0.00,
  premiere_date    DATE,
  on_display_until DATE,
  trailer_url      VARCHAR(500),
  status           ENUM('coming_soon','now_playing','ended') DEFAULT 'now_playing',
  is_active        TINYINT(1) DEFAULT 1,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES movie_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (room_id)     REFERENCES movie_rooms(id)      ON DELETE SET NULL
);

-- Adiciona colunas que podem estar faltando se a tabela ja existia
ALTER TABLE movies ADD COLUMN IF NOT EXISTS category_id      INT AFTER description;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS room_id          INT AFTER room;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS premiere_date    DATE AFTER price;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS on_display_until DATE AFTER premiere_date;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS trailer_url      VARCHAR(500) AFTER on_display_until;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS status           ENUM('coming_soon','now_playing','ended') DEFAULT 'now_playing' AFTER is_active;

-- ══════════════════════════════════════════════════════════
-- 12. SESSOES DE FILMES
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS movie_sessions (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  movie_id        INT NOT NULL,
  room_id         INT NOT NULL,
  session_date    DATE NOT NULL,
  session_time    TIME NOT NULL,
  available_seats INT DEFAULT 100,
  language        ENUM('dublado','legendado','original') DEFAULT 'dublado',
  is_active       TINYINT(1) DEFAULT 1,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id)  REFERENCES movie_rooms(id) ON DELETE CASCADE
);

-- FK de orders -> movie_sessions (adiciona so se nao existir)
ALTER TABLE orders ADD CONSTRAINT fk_orders_session
  FOREIGN KEY (session_id) REFERENCES movie_sessions(id) ON DELETE SET NULL;

SET FOREIGN_KEY_CHECKS = 1;

-- ══════════════════════════════════════════════════════════
-- 13. FILMES DE DEMONSTRACAO
-- ══════════════════════════════════════════════════════════

-- Limpa filmes antigos (se quiser comecar do zero, descomente a linha abaixo)
-- DELETE FROM movies;

INSERT INTO movies (title, description, category_id, genre, duration_minutes, director, cast_info, rating, poster_url, session_date, session_time, room, room_id, price, premiere_date, on_display_until, status) VALUES

-- EM CARTAZ
('Abismo Estelar',
 'Apos uma anomalia cosmica engolir sua nave, a astronauta Lara Vidal precisa navegar por uma dimensao desconhecida antes que o tempo acabe para a Terra. Uma jornada epica entre o amor e o infinito.',
 (SELECT id FROM movie_categories WHERE name='Ficcao Cientifica' LIMIT 1),
 'Ficcao Cientifica', 138, 'Marina Fontes',
 'Clara Mendes, Roberto Salgado, Tiago Vaz, Lucia Primo',
 '12+', NULL,
 CURDATE(), '19:00:00', 'Sala 1', 1, 22.00,
 DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 25 DAY), 'now_playing'),

('O Ultimo Carnaval',
 'Em 1987, um grupo de amigos vive o carnaval mais intenso de suas vidas — sem saber que seria o ultimo antes de uma tragedia mudar tudo para sempre.',
 (SELECT id FROM movie_categories WHERE name='Drama' LIMIT 1),
 'Drama', 112, 'Carlos Drummond Jr.',
 'Fernanda Lima, Paulo Salave, Beatriz Costa, Renato Meireles',
 '14+', NULL,
 CURDATE(), '21:30:00', 'Sala 2', 2, 22.00,
 DATE_SUB(CURDATE(), INTERVAL 12 DAY), DATE_ADD(CURDATE(), INTERVAL 8 DAY), 'now_playing'),

('Turma do Foguete',
 'Cinco criancas constroem um foguete de papelao no quintal e, de forma inexplicavel, viajam de verdade para a Lua. Uma aventura cheia de risadas e descobertas.',
 (SELECT id FROM movie_categories WHERE name='Animacao' LIMIT 1),
 'Animacao', 95, 'Sofia Andrade',
 'Vozes: Luca Ferreira, Ana Luz, Pedro Mota, Camila Dias',
 'Livre', NULL,
 CURDATE(), '15:00:00', 'Sala Kids', 5, 18.00,
 DATE_SUB(CURDATE(), INTERVAL 3 DAY), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'now_playing'),

('Sombra Vermelha',
 'Um detetive obcecado investiga crimes que seguem o roteiro de um livro publicado 50 anos atras — e o autor esta morto. Mas alguem continua escrevendo.',
 (SELECT id FROM movie_categories WHERE name='Suspense' LIMIT 1),
 'Suspense', 124, 'Henrique Braga',
 'Marcos Novaes, Juliana Reis, Antonio Faro, Sandra Melo',
 '16+', NULL,
 CURDATE(), '22:00:00', 'Sala 1', 1, 22.00,
 DATE_SUB(CURDATE(), INTERVAL 8 DAY), DATE_ADD(CURDATE(), INTERVAL 6 DAY), 'now_playing'),

('Festa no Caos',
 'Tres irmaos desastrosos tentam organizar o casamento dos pais de surpresa em menos de 48 horas. Tudo pode — e vai — dar completamente errado.',
 (SELECT id FROM movie_categories WHERE name='Comedia' LIMIT 1),
 'Comedia', 102, 'Luciana Farias',
 'Bruno Lima, Carol Santos, Vinicius Paz, Tania Braga',
 '12+', NULL,
 CURDATE(), '17:00:00', 'Sala 2', 2, 20.00,
 DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_ADD(CURDATE(), INTERVAL 20 DAY), 'now_playing'),

('Nas Profundezas',
 'Uma equipe de pesquisadores descobre uma civilizacao subaquatica desconhecida. Mas ao fazer contato, percebem que nem tudo que esta nas profundezas quer ser encontrado.',
 (SELECT id FROM movie_categories WHERE name='Terror' LIMIT 1),
 'Terror', 117, 'Andre Castelo',
 'Patricia Nunes, Diego Alves, Sonia Rocha, Fabio Torres',
 '16+', NULL,
 CURDATE(), '23:00:00', 'Sala 4', 4, 22.00,
 DATE_SUB(CURDATE(), INTERVAL 1 DAY), DATE_ADD(CURDATE(), INTERVAL 15 DAY), 'now_playing'),

('A Ultima Partida',
 'Um tecnico de futebol aposentado e chamado de volta para salvar um clube falido em sua cidade natal. Mas o verdadeiro jogo acontece fora do campo.',
 (SELECT id FROM movie_categories WHERE name='Esporte' LIMIT 1),
 'Esporte', 108, 'Roberto Cavalcante',
 'Alexandre Pinto, Mariana Sousa, Gilberto Neto, Paula Vieira',
 '10+', NULL,
 CURDATE(), '19:30:00', 'Sala 3', 3, 20.00,
 DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_ADD(CURDATE(), INTERVAL 12 DAY), 'now_playing'),

('Guardiaos do Amanha',
 'Quatro adolescentes com habilidades sobrenaturais precisam se unir para impedir que uma corporacao secreta apague o futuro da humanidade.',
 (SELECT id FROM movie_categories WHERE name='Acao' LIMIT 1),
 'Acao', 143, 'Thiago Carvalho',
 'Nicolas Ramos, Julia Costa, Pedro Henrique, Aline Matos',
 '12+', NULL,
 CURDATE(), '21:00:00', 'Sala 4', 4, 25.00,
 DATE_SUB(CURDATE(), INTERVAL 7 DAY), DATE_ADD(CURDATE(), INTERVAL 28 DAY), 'now_playing'),

('Luz de Agosto',
 'Em uma pequena cidade do interior, uma fotografa descobre cartas antigas que revelam um romance proibido durante a ditadura. Uma historia de amor que o tempo nao apagou.',
 (SELECT id FROM movie_categories WHERE name='Romance' LIMIT 1),
 'Romance', 105, 'Isabela Martins',
 'Leticia Couto, Marcos Brito, Vera Santos, Hugo Lacerda',
 '12+', NULL,
 CURDATE(), '16:00:00', 'Sala 2', 2, 20.00,
 DATE_SUB(CURDATE(), INTERVAL 4 DAY), DATE_ADD(CURDATE(), INTERVAL 22 DAY), 'now_playing'),

('Codigo Laranja',
 'Quando um virus digital comeca a infectar memorias humanas, uma hacker precisa entrar na mente de seu proprio pai para salva-lo antes que ele desapareca para sempre.',
 (SELECT id FROM movie_categories WHERE name='Ficcao Cientifica' LIMIT 1),
 'Ficcao Cientifica', 131, 'Rafael Cunha',
 'Bianca Souza, Diego Alves, Priscila Nunes, Caio Mendes',
 '14+', NULL,
 CURDATE(), '20:30:00', 'Sala 1', 1, 22.00,
 DATE_SUB(CURDATE(), INTERVAL 6 DAY), DATE_ADD(CURDATE(), INTERVAL 18 DAY), 'now_playing'),

-- EM BREVE
('Vento do Norte',
 'Uma jovem esquimo parte em uma jornada epica pelo Artico para encontrar sua irma desaparecida, guiada apenas pelas lendas ancestrais de seu povo.',
 (SELECT id FROM movie_categories WHERE name='Aventura' LIMIT 1),
 'Aventura', 118, 'Aline Torres',
 'Nayara Pena, Gustavo Rios, Helena Matos, Samuel Cruz',
 '10+', NULL,
 DATE_ADD(CURDATE(), INTERVAL 5 DAY), '19:30:00', 'Sala 2', 2, 22.00,
 DATE_ADD(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 40 DAY), 'coming_soon'),

('O Espelho Partido',
 'Uma psicologa comeca a perceber que seus pacientes descrevem os mesmos pesadelos com detalhes identicos. A resposta esta dentro de sua propria mente.',
 (SELECT id FROM movie_categories WHERE name='Terror' LIMIT 1),
 'Terror', 114, 'Camila Duarte',
 'Renata Lopes, Fabio Gomes, Carla Neves, Rodrigo Pires',
 '16+', NULL,
 DATE_ADD(CURDATE(), INTERVAL 7 DAY), '22:30:00', 'Sala 1', 1, 22.00,
 DATE_ADD(CURDATE(), INTERVAL 7 DAY), DATE_ADD(CURDATE(), INTERVAL 45 DAY), 'coming_soon'),

('Dois Lados do Rio',
 'Duas familias rivais as margens do mesmo rio descobrem que seus filhos estao apaixonados. Uma comedia romantica sobre preconceito, tradicao e pipoca.',
 (SELECT id FROM movie_categories WHERE name='Comedia Romantica' LIMIT 1),
 'Comedia Romantica', 98, 'Eduardo Prado',
 'Giovanna Melo, Lucas Teixeira, Maria Jose, Antonio Carlos',
 'Livre', NULL,
 DATE_ADD(CURDATE(), INTERVAL 10 DAY), '18:00:00', 'Sala 3', 3, 20.00,
 DATE_ADD(CURDATE(), INTERVAL 10 DAY), DATE_ADD(CURDATE(), INTERVAL 50 DAY), 'coming_soon'),

('Memoria Zero',
 'Um agente secreto acorda sem nenhuma lembranca de quem e. Enquanto foge de assassinos, descobre que ele mesmo programou seu proprio esquecimento — e ha um motivo.',
 (SELECT id FROM movie_categories WHERE name='Thriller' LIMIT 1),
 'Thriller', 127, 'Paulo Silveira',
 'Rodrigo Almeida, Ana Beatriz, Cesar Lima, Tatiana Fonseca',
 '14+', NULL,
 DATE_ADD(CURDATE(), INTERVAL 14 DAY), '21:00:00', 'Sala 1', 1, 22.00,
 DATE_ADD(CURDATE(), INTERVAL 14 DAY), DATE_ADD(CURDATE(), INTERVAL 55 DAY), 'coming_soon'),

('A Floresta Que Respira',
 'Um grupo de botanicos descobre que a maior floresta do mundo possui consciencia coletiva. E ela esta cansada de ser ignorada.',
 (SELECT id FROM movie_categories WHERE name='Ficcao Cientifica' LIMIT 1),
 'Ficcao Cientifica', 122, 'Natalia Vasconcelos',
 'Fernanda Mota, Claudio Bento, Rute Alves, Davi Rocha',
 '12+', NULL,
 DATE_ADD(CURDATE(), INTERVAL 18 DAY), '19:00:00', 'Sala 2', 2, 22.00,
 DATE_ADD(CURDATE(), INTERVAL 18 DAY), DATE_ADD(CURDATE(), INTERVAL 60 DAY), 'coming_soon'),

('Ritmo na Alma',
 'Uma jovem do interior chega ao Rio com uma mala velha e um sonho: ser bailarina. O que encontra e caos, samba e o amor mais improvavel de sua vida.',
 (SELECT id FROM movie_categories WHERE name='Musical' LIMIT 1),
 'Musical', 110, 'Beatriz Farias',
 'Yasmin Costa, Gabriel Moura, Lena Batista, Toninho Sax',
 'Livre', NULL,
 DATE_ADD(CURDATE(), INTERVAL 21 DAY), '17:30:00', 'Sala 3', 3, 20.00,
 DATE_ADD(CURDATE(), INTERVAL 21 DAY), DATE_ADD(CURDATE(), INTERVAL 65 DAY), 'coming_soon'),

('O Candidato',
 'Um politico honesto descobre que as eleicoes foram fraudadas por inteligencia artificial. Sua unica arma: a verdade. Seu maior inimigo: o proprio partido.',
 (SELECT id FROM movie_categories WHERE name='Thriller Politico' LIMIT 1),
 'Thriller Politico', 133, 'Marcelo Andrade',
 'Sergio Navarro, Denise Oliveira, Bruno Campos, Ivana Cruz',
 '14+', NULL,
 DATE_ADD(CURDATE(), INTERVAL 28 DAY), '20:00:00', 'Sala 4', 4, 22.00,
 DATE_ADD(CURDATE(), INTERVAL 28 DAY), DATE_ADD(CURDATE(), INTERVAL 70 DAY), 'coming_soon');

-- ══════════════════════════════════════════════════════════
-- 14. SESSOES DOS FILMES (tabela movie_sessions)
-- ══════════════════════════════════════════════════════════
INSERT INTO movie_sessions (movie_id, room_id, session_date, session_time, language) VALUES
  ((SELECT id FROM movies WHERE title='Abismo Estelar'    LIMIT 1), 1, CURDATE(),                              '14:00:00', 'dublado'),
  ((SELECT id FROM movies WHERE title='Abismo Estelar'    LIMIT 1), 1, CURDATE(),                              '19:00:00', 'legendado'),
  ((SELECT id FROM movies WHERE title='Abismo Estelar'    LIMIT 1), 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY),    '19:00:00', 'dublado'),
  ((SELECT id FROM movies WHERE title='Turma do Foguete'  LIMIT 1), 5, CURDATE(),                              '10:00:00', 'dublado'),
  ((SELECT id FROM movies WHERE title='Turma do Foguete'  LIMIT 1), 5, CURDATE(),                              '15:00:00', 'dublado'),
  ((SELECT id FROM movies WHERE title='Sombra Vermelha'   LIMIT 1), 1, CURDATE(),                              '22:00:00', 'legendado'),
  ((SELECT id FROM movies WHERE title='O Ultimo Carnaval' LIMIT 1), 2, CURDATE(),                              '21:30:00', 'dublado'),
  ((SELECT id FROM movies WHERE title='Festa no Caos'     LIMIT 1), 2, CURDATE(),                              '17:00:00', 'dublado'),
  ((SELECT id FROM movies WHERE title='Guardiaos do Amanha' LIMIT 1), 4, CURDATE(),                            '21:00:00', 'dublado'),
  ((SELECT id FROM movies WHERE title='Guardiaos do Amanha' LIMIT 1), 4, CURDATE(),                            '18:00:00', 'legendado'),
  ((SELECT id FROM movies WHERE title='Nas Profundezas'   LIMIT 1), 4, CURDATE(),                              '23:00:00', 'legendado'),
  ((SELECT id FROM movies WHERE title='A Ultima Partida'  LIMIT 1), 3, CURDATE(),                              '19:30:00', 'dublado'),
  ((SELECT id FROM movies WHERE title='Luz de Agosto'     LIMIT 1), 2, CURDATE(),                              '16:00:00', 'dublado'),
  ((SELECT id FROM movies WHERE title='Codigo Laranja'    LIMIT 1), 1, CURDATE(),                              '20:30:00', 'dublado'),
  ((SELECT id FROM movies WHERE title='Codigo Laranja'    LIMIT 1), 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY),    '20:30:00', 'legendado');

-- ══════════════════════════════════════════════════════════
-- 15. CONFIRMACAO FINAL
-- ══════════════════════════════════════════════════════════
SELECT
  m.id,
  m.title,
  m.status,
  m.session_date,
  m.session_time,
  m.room,
  m.price,
  mc.name  AS categoria,
  mc.emoji AS emoji
FROM movies m
LEFT JOIN movie_categories mc ON m.category_id = mc.id
ORDER BY m.status DESC, m.session_date;
