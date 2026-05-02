-- Tabela de filmes
USE pipocalizando;

CREATE TABLE IF NOT EXISTS movies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  genre VARCHAR(100),
  duration_minutes INT,
  director VARCHAR(150),
  cast_info TEXT,
  rating VARCHAR(10),
  poster_url VARCHAR(500),
  banner_url VARCHAR(500),
  session_date DATE,
  session_time TIME,
  room VARCHAR(50),
  price DECIMAL(10,2) DEFAULT 0.00,
  on_display_until DATE,
  premiere_date DATE,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE movies
  ADD COLUMN IF NOT EXISTS on_display_until DATE AFTER price,
  ADD COLUMN IF NOT EXISTS premiere_date DATE AFTER on_display_until;

DELETE FROM movies WHERE id > 0;

INSERT INTO movies (title, description, genre, duration_minutes, director, cast_info, rating, poster_url, session_date, session_time, room, price, premiere_date, on_display_until) VALUES

-- ═══════════════════════════════
-- EM CARTAZ
-- ═══════════════════════════════

('Abismo Estelar',
'Após uma anomalia cósmica engolir sua nave, a astronauta Lara Vidal precisa navegar por uma dimensão desconhecida antes que o tempo acabe para a Terra. Uma jornada épica entre o amor e o infinito.',
'Ficção Científica', 138, 'Marina Fontes',
'Clara Mendes, Roberto Salgado, Tiago Vaz, Lucia Primo',
'12+', 'Image-not-found',
CURDATE(), '19:00:00', 'Sala 1', 0.00,
DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 25 DAY)),

('O Último Carnaval',
'Em 1987, um grupo de amigos vive o carnaval mais intenso de suas vidas — sem saber que seria o último antes de uma tragédia mudar tudo para sempre.',
'Drama / Romance', 112, 'Carlos Drummond Jr.',
'Fernanda Lima, Paulo Salave, Beatriz Costa, Renato Meireles',
'14+', 'Image-not-found',
CURDATE(), '21:30:00', 'Sala 2', 0.00,
DATE_SUB(CURDATE(), INTERVAL 12 DAY), DATE_ADD(CURDATE(), INTERVAL 8 DAY)),

('Turma do Foguete',
'Cinco crianças constroem um foguete de papelão no quintal e, de forma inexplicável, viajam de verdade para a Lua. Uma aventura cheia de risadas e descobertas.',
'Animação / Aventura', 95, 'Sofia Andrade',
'Vozes: Luca Ferreira, Ana Luz, Pedro Mota, Camila Dias',
'Livre', 'Image-not-found',
CURDATE(), '15:00:00', 'Sala 3', 0.00,
DATE_SUB(CURDATE(), INTERVAL 3 DAY), DATE_ADD(CURDATE(), INTERVAL 30 DAY)),

('Sombra Vermelha',
'Um detetive obcecado investiga crimes que seguem o roteiro de um livro publicado 50 anos atrás — e o autor está morto. Mas alguém continua escrevendo.',
'Suspense / Thriller', 124, 'Henrique Braga',
'Marcos Novaes, Juliana Reis, Antonio Faro, Sandra Melo',
'16+', 'Image-not-found',
CURDATE(), '22:00:00', 'Sala 1', 0.00,
DATE_SUB(CURDATE(), INTERVAL 8 DAY), DATE_ADD(CURDATE(), INTERVAL 6 DAY)),

('Festa no Caos',
'Três irmãos desastrosos tentam organizar o casamento dos pais de surpresa em menos de 48 horas. Tudo pode — e vai — dar completamente errado.',
'Comédia', 102, 'Luciana Farias',
'Bruno Lima, Carol Santos, Vinícius Paz, Tânia Braga',
'12+', 'Image-not-found',
CURDATE(), '17:00:00', 'Sala 2', 0.00,
DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_ADD(CURDATE(), INTERVAL 20 DAY)),

('Nas Profundezas',
'Uma equipe de pesquisadores descobre uma civilização subaquática desconhecida. Mas ao fazer contato, percebem que nem tudo que está nas profundezas quer ser encontrado.',
'Terror / Ficção Científica', 117, 'André Castelo',
'Patrícia Nunes, Diego Alves, Sônia Rocha, Fábio Torres',
'16+', 'Image-not-found',
CURDATE(), '23:00:00', 'Sala 4', 0.00,
DATE_SUB(CURDATE(), INTERVAL 1 DAY), DATE_ADD(CURDATE(), INTERVAL 15 DAY)),

('A Última Partida',
'Um técnico de futebol aposentado é chamado de volta para salvar um clube falido em sua cidade natal. Mas o verdadeiro jogo acontece fora do campo.',
'Drama / Esporte', 108, 'Roberto Cavalcante',
'Alexandre Pinto, Mariana Sousa, Gilberto Neto, Paula Vieira',
'10+', 'Image-not-found',
CURDATE(), '19:30:00', 'Sala 3', 0.00,
DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_ADD(CURDATE(), INTERVAL 12 DAY)),

('Código Laranja',
'Quando um vírus digital começa a infectar memórias humanas, uma hacker precisa entrar na mente de seu próprio pai para salvá-lo antes que ele desapareça para sempre.',
'Ficção Científica / Ação', 131, 'Rafael Cunha',
'Bianca Souza, Diego Alves, Priscila Nunes, Caio Mendes',
'14+', 'Image-not-found',
CURDATE(), '20:30:00', 'Sala 1', 0.00,
DATE_SUB(CURDATE(), INTERVAL 6 DAY), DATE_ADD(CURDATE(), INTERVAL 18 DAY)),

('Luz de Agosto',
'Em uma pequena cidade do interior, uma fotógrafa descobre cartas antigas que revelam um romance proibido durante a ditadura. Uma história de amor que o tempo não apagou.',
'Drama / Romance', 105, 'Isabela Martins',
'Letícia Couto, Marcos Brito, Vera Santos, Hugo Lacerda',
'12+', 'Image-not-found',
CURDATE(), '16:00:00', 'Sala 2', 0.00,
DATE_SUB(CURDATE(), INTERVAL 4 DAY), DATE_ADD(CURDATE(), INTERVAL 22 DAY)),

('Guardiões do Amanhã',
'Quatro adolescentes com habilidades sobrenaturais precisam se unir para impedir que uma corporação secreta apague o futuro da humanidade.',
'Ação / Fantasia', 143, 'Thiago Carvalho',
'Nicolas Ramos, Julia Costa, Pedro Henrique, Aline Matos',
'12+', 'Image-not-found',
CURDATE(), '21:00:00', 'Sala 4', 0.00,
DATE_SUB(CURDATE(), INTERVAL 7 DAY), DATE_ADD(CURDATE(), INTERVAL 28 DAY)),

-- ═══════════════════════════════
-- EM BREVE
-- ═══════════════════════════════

('Vento do Norte',
'Uma jovem esquimó parte em uma jornada épica pelo Ártico para encontrar sua irmã desaparecida, guiada apenas pelas lendas ancestrais de seu povo.',
'Aventura / Drama', 118, 'Aline Torres',
'Nayara Pena, Gustavo Rios, Helena Matos, Samuel Cruz',
'10+', 'Image-not-found',
DATE_ADD(CURDATE(), INTERVAL 5 DAY), '19:30:00', 'Sala 2', 0.00,
DATE_ADD(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 40 DAY)),

('O Espelho Partido',
'Uma psicóloga começa a perceber que seus pacientes descrevem os mesmos pesadelos com detalhes idênticos. A resposta está dentro de sua própria mente.',
'Terror / Suspense', 114, 'Camila Duarte',
'Renata Lopes, Fábio Gomes, Carla Neves, Rodrigo Pires',
'16+', 'Image-not-found',
DATE_ADD(CURDATE(), INTERVAL 7 DAY), '22:30:00', 'Sala 1', 0.00,
DATE_ADD(CURDATE(), INTERVAL 7 DAY), DATE_ADD(CURDATE(), INTERVAL 45 DAY)),

('Dois Lados do Rio',
'Duas famílias rivais às margens do mesmo rio descobrem que seus filhos estão apaixonados. Uma comédia romântica sobre preconceito, tradição e pipoca.',
'Comédia Romântica', 98, 'Eduardo Prado',
'Giovanna Melo, Lucas Teixeira, Maria José, Antônio Carlos',
'Livre', 'Image-not-found',
DATE_ADD(CURDATE(), INTERVAL 10 DAY), '18:00:00', 'Sala 3', 0.00,
DATE_ADD(CURDATE(), INTERVAL 10 DAY), DATE_ADD(CURDATE(), INTERVAL 50 DAY)),

('Memória Zero',
'Um agente secreto acorda sem nenhuma lembrança de quem é. Enquanto foge de assassinos, descobre que ele mesmo programou seu próprio esquecimento — e há um motivo.',
'Ação / Thriller', 127, 'Paulo Silveira',
'Rodrigo Almeida, Ana Beatriz, César Lima, Tatiana Fonseca',
'14+', 'Image-not-found',
DATE_ADD(CURDATE(), INTERVAL 14 DAY), '21:00:00', 'Sala 1', 0.00,
DATE_ADD(CURDATE(), INTERVAL 14 DAY), DATE_ADD(CURDATE(), INTERVAL 55 DAY)),

('A Floresta Que Respira',
'Um grupo de botânicos descobre que a maior floresta do mundo possui consciência coletiva. E ela está cansada de ser ignorada.',
'Ficção Científica / Drama', 122, 'Natália Vasconcelos',
'Fernanda Mota, Claudio Bento, Rute Alves, Davi Rocha',
'12+', 'Image-not-found',
DATE_ADD(CURDATE(), INTERVAL 18 DAY), '19:00:00', 'Sala 2', 0.00,
DATE_ADD(CURDATE(), INTERVAL 18 DAY), DATE_ADD(CURDATE(), INTERVAL 60 DAY)),

('Ritmo na Alma',
'Uma jovem do interior chega ao Rio com uma mala velha e um sonho: ser bailarina. O que encontra é caos, samba e o amor mais improvável de sua vida.',
'Musical / Romance', 110, 'Beatriz Farias',
'Yasmin Costa, Gabriel Moura, Lena Batista, Toninho Sax',
'Livre', 'Image-not-found',
DATE_ADD(CURDATE(), INTERVAL 21 DAY), '17:30:00', 'Sala 3', 0.00,
DATE_ADD(CURDATE(), INTERVAL 21 DAY), DATE_ADD(CURDATE(), INTERVAL 65 DAY)),

('O Candidato',
'Um político honesto descobre que as eleições foram fraudadas por inteligência artificial. Sua única arma: a verdade. Seu maior inimigo: o próprio partido.',
'Thriller Político', 133, 'Marcelo Andrade',
'Sérgio Navarro, Denise Oliveira, Bruno Campos, Ivana Cruz',
'14+', 'Image-not-found',
DATE_ADD(CURDATE(), INTERVAL 28 DAY), '20:00:00', 'Sala 4', 0.00,
DATE_ADD(CURDATE(), INTERVAL 28 DAY), DATE_ADD(CURDATE(), INTERVAL 70 DAY));

-- Confirma
SELECT title, genre, session_date, session_time, premiere_date, on_display_until FROM movies ORDER BY session_date;

CREATE TABLE IF NOT EXISTS movies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  genre VARCHAR(100),
  duration_minutes INT,
  director VARCHAR(150),
  cast_info TEXT,
  rating VARCHAR(10),
  poster_url VARCHAR(500),
  banner_url VARCHAR(500),
  session_date DATE,
  session_time TIME,
  room VARCHAR(50),
  price DECIMAL(10,2) DEFAULT 0.00,
  on_display_until DATE,
  premiere_date DATE,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Adiciona colunas se já existir a tabela sem elas
ALTER TABLE movies
  ADD COLUMN IF NOT EXISTS on_display_until DATE AFTER price,
  ADD COLUMN IF NOT EXISTS premiere_date DATE AFTER on_display_until;

-- Limpa e recria com dados fictícios ricos
DELETE FROM movies WHERE id > 0;

INSERT INTO movies (title, description, genre, duration_minutes, director, cast_info, rating, poster_url, session_date, session_time, room, price, premiere_date, on_display_until) VALUES

  -- Em cartaz
  (
    'Abismo Estelar',
    'Após uma anomalia cósmica engolir sua nave, a astronauta Lara precisa navegar por uma dimensão desconhecida antes que o tempo acabe para a Terra.',
    'Ficção Científica', 138, 'Marina Fontes',
    'Clara Mendes, Roberto Salgado, Tiago Vaz',
    '12+', 'Image-not-found',
    CURDATE(), '19:00:00', 'Sala 1', 0.00,
    DATE_SUB(CURDATE(), INTERVAL 7 DAY),
    DATE_ADD(CURDATE(), INTERVAL 21 DAY)
  ),
  (
    'O Último Carnaval',
    'Em 1987, um grupo de amigos vive o carnaval mais intenso de suas vidas — sem saber que seria o último antes de uma tragédia mudar tudo.',
    'Drama / Romance', 112, 'Carlos Drummond Jr.',
    'Fernanda Lima, Paulo Salave, Beatriz Costa',
    '14+', 'Image-not-found',
    CURDATE(), '21:30:00', 'Sala 2', 0.00,
    DATE_SUB(CURDATE(), INTERVAL 14 DAY),
    DATE_ADD(CURDATE(), INTERVAL 14 DAY)
  ),
  (
    'Turma do Foguete',
    'Cinco crianças constroem um foguete de papelão no quintal e, de alguma forma inexplicável, acabam viajando de verdade para a Lua.',
    'Animação / Aventura', 95, 'Sofia Andrade',
    'Vozes: Luca Ferreira, Ana Luz, Pedro Mota',
    'Livre', 'Image-not-found',
    CURDATE(), '15:00:00', 'Sala 3', 0.00,
    DATE_SUB(CURDATE(), INTERVAL 3 DAY),
    DATE_ADD(CURDATE(), INTERVAL 28 DAY)
  ),
  (
    'Sombra Vermelha',
    'Um detetive obcecado investiga uma série de crimes que parecem seguir o roteiro de um livro publicado 50 anos atrás — e o autor está morto.',
    'Suspense / Thriller', 124, 'Henrique Braga',
    'Marcos Novaes, Juliana Reis, Antonio Faro',
    '16+', 'Image-not-found',
    CURDATE(), '22:00:00', 'Sala 1', 0.00,
    DATE_SUB(CURDATE(), INTERVAL 5 DAY),
    DATE_ADD(CURDATE(), INTERVAL 10 DAY)
  ),

  -- Em breve (próximas estreias)
  (
    'Vento do Norte',
    'Uma jovem esquimó parte em uma jornada épica pelo Ártico para encontrar sua irmã desaparecida, guiada apenas pelas lendas de seu povo.',
    'Aventura / Drama', 118, 'Aline Torres',
    'Nayara Pena, Gustavo Rios, Helena Matos',
    '10+', 'Image-not-found',
    DATE_ADD(CURDATE(), INTERVAL 7 DAY), '19:30:00', 'Sala 2', 0.00,
    DATE_ADD(CURDATE(), INTERVAL 7 DAY),
    DATE_ADD(CURDATE(), INTERVAL 42 DAY)
  ),
  (
    'Código Laranja',
    'Quando um vírus digital começa a infectar memórias humanas, uma hacker precisa entrar na mente de seu próprio pai para salvá-lo.',
    'Ficção Científica / Ação', 131, 'Rafael Cunha',
    'Bianca Souza, Diego Alves, Priscila Nunes',
    '14+', 'Image-not-found',
    DATE_ADD(CURDATE(), INTERVAL 14 DAY), '20:00:00', 'Sala 1', 0.00,
    DATE_ADD(CURDATE(), INTERVAL 14 DAY),
    DATE_ADD(CURDATE(), INTERVAL 56 DAY)
  ),
  (
    'Festa no Caos',
    'Três irmãos desastrosos tentam organizar o casamento dos pais de surpresa em menos de 48 horas. Tudo pode — e vai — dar errado.',
    'Comédia', 102, 'Luciana Farias',
    'Bruno Lima, Carol Santos, Vinícius Paz',
    '12+', 'Image-not-found',
    DATE_ADD(CURDATE(), INTERVAL 21 DAY), '18:00:00', 'Sala 3', 0.00,
    DATE_ADD(CURDATE(), INTERVAL 21 DAY),
    DATE_ADD(CURDATE(), INTERVAL 49 DAY)
  );
