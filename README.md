# Pipocalizando

<p align="center">
  <strong>Sistema web de cinema e bomboniere feito com React, Node.js, TypeScript e MySQL.</strong>
</p>

<p align="center">
  Uma plataforma para compra de ingressos, reserva de assentos, pedidos da bomboniere e operacao administrativa.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Build-Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Database-MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
</p>

## Preview

O Pipocalizando foi pensado para simular a jornada completa de um cinema:

- cliente se cadastra e faz login
- escolhe uma sessao e reserva assentos por 20 minutos
- conclui o pagamento e recebe o ticket
- compra produtos da bomboniere
- equipe acompanha pedidos, pagamentos e estoque no painel

## Screenshots

As capturas abaixo podem ser preenchidas com imagens reais do projeto em uma pasta como `docs/screenshots/`.

| Tela | Descricao |
|------|-----------|
| Homepage | Apresentacao principal da aplicacao |
| Sessao e assentos | Escolha de sessao e reserva temporaria |
| Checkout | Finalizacao da compra e pagamento |
| Admin | Painel para operacao e gestao |

## Tecnologias

- `frontend`: aplicacao web em React + Vite
- `backend`: API em Node.js + TypeScript + Express + MySQL
- `database`: scripts SQL e seeds para o ambiente local
- `docker`: ambiente completo com Docker Compose para subir frontend, backend e MySQL

## Funcionalidades

- login e cadastro de cliente
- reserva temporaria de assentos
- compra de ingressos com confirmacao apos aprovacao do pagamento
- cancelamento de pedido com reversao do fluxo no backend
- baixa de estoque em compras confirmadas
- cadastro e edicao de produtos
- painel administrativo com pedidos, produtos, filmes e usuarios
- separacao de perfis entre `super_admin`, `manager`, `seller` e `customer`

## Como rodar

### Via Docker

Se você quiser subir tudo já padronizado, use:

```bash
docker compose up --build
```

Ou, pela raiz do projeto:

```bash
npm run docker:up
```

Depois disso:

- frontend em `http://localhost:3000`
- backend em `http://localhost:3333`
- MySQL em `localhost:3307`

O `docker compose` já sobe:

- o banco MySQL com schema, seeds e migrações principais
- o backend apontando para o banco do container
- o frontend com proxy para `/api` e `/uploads`

Para parar os containers:

```bash
npm run docker:down
```

Na primeira subida, o MySQL inicializa o volume com os dados do projeto. Se você quiser recriar tudo do zero, precisará remover o volume do Docker antes de subir novamente.

### 1. Banco de dados

Importe o schema principal:

```bash
mysql -u root -p < database/schema.sql
```

Se quiser aplicar as melhorias de ingressos e assentos em um banco existente:

```bash
mysql -u root -p < database/migration_tickets_seats.sql
mysql -u root -p < database/migration_seat_reservations.sql
mysql -u root -p < database/migration_mercado_pago_payments.sql
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run build
npm start
```

Para rodar os testes basicos:

```bash
npm test
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

## Estrutura

```text
Pipocalizando/
|-- backend/   API REST e regras de negocio
|-- frontend/  Web app para clientes e admin
`-- database/  Scripts SQL e seeds
```

## Perfis

| Role | Uso |
|------|-----|
| `super_admin` | Dono do sistema, acesso total |
| `manager` | Operacao e gestao do cinema |
| `seller` | Atendimento e fluxo operacional |
| `customer` | Compra de ingressos e produtos |

## Demo

Se o banco estiver com os seeds da demo, o projeto costuma usar:

- e-mail: `admin@pipocalizando.com`
- senha: `admin123`

Consulte `database/criar_admin.js` se precisar recriar o usuario administrativo.

---

# Pipocalizando

<p align="center">
  <strong>Web-based cinema and snack bar system built with React, Node.js, TypeScript and MySQL.</strong>
</p>

<p align="center">
  A platform for ticket purchases, seat reservation, snack bar orders, and administrative operations.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Build-Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Database-MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
</p>

## Preview

Pipocalizando is designed to simulate the full journey of a cinema customer:

- sign up and log in
- choose a session and reserve seats for 20 minutes
- complete payment and receive the ticket
- buy snack bar products
- let the team monitor orders, payments and stock from the admin panel

## Screenshots

The sections below can be filled with real project images stored in a folder such as `docs/screenshots/`.

| Screen | Description |
|--------|-------------|
| Homepage | Main application introduction |
| Session and seats | Session selection and temporary seat reservation |
| Checkout | Purchase finalization and payment |
| Admin | Operations and management dashboard |

## Technologies

- `frontend`: React + Vite web application
- `backend`: Node.js + TypeScript + Express + MySQL API
- `database`: SQL scripts and local seed data

## Features

- customer sign up and login
- temporary seat reservation
- ticket purchase with confirmation after payment approval
- order cancellation with backend flow reversal
- stock decrement on confirmed purchases
- product management
- admin panel for orders, products, movies and users
- role separation between `super_admin`, `manager`, `seller` and `customer`

## Run Locally

### Docker

This is the recommended way to run the project locally.

```bash
docker compose up --build
```

Or from the repository root:

```bash
npm run docker:up
```

After that:

- frontend at `http://localhost:3000`
- backend at `http://localhost:3333`
- MySQL at `localhost:3307`

To stop the containers:

```bash
npm run docker:down
```

### 1. Database

Import the main schema:

```bash
mysql -u root -p < database/schema.sql
```

To apply ticket and seat improvements to an existing database:

```bash
mysql -u root -p < database/migration_tickets_seats.sql
mysql -u root -p < database/migration_seat_reservations.sql
mysql -u root -p < database/migration_mercado_pago_payments.sql
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run build
npm start
```

To run the basic tests:

```bash
npm test
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```text
Pipocalizando/
|-- backend/   REST API and business rules
|-- frontend/  Customer and admin web app
`-- database/  SQL scripts and seed data
```

## Roles

| Role | Purpose |
|------|---------|
| `super_admin` | System owner with full access |
| `manager` | Cinema operations and management |
| `seller` | Front desk and operational flow |
| `customer` | Ticket and product purchases |

## Demo

If the database has demo seeds, the project usually uses:

- email: `admin@pipocalizando.com`
- password: `admin123`

Check `database/criar_admin.js` if you need to recreate the admin user.
