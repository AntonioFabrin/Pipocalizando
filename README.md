# Pipocalizando

<p align="center">
  <strong>Sistema web de cinema e bomboniere feito com React, Node.js, TypeScript e PostgreSQL (Supabase).</strong>
</p>

<p align="center">
  Uma plataforma para compra de ingressos, reserva de assentos, pedidos da bomboniere e operacao administrativa.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Build-Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
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
- `backend`: API em Node.js + TypeScript + Express + PostgreSQL
- `database`: scripts SQL e seeds de referencia do projeto
- `docker`: ambiente completo com Docker Compose para subir frontend e backend

> Nota: o banco oficial do projeto e somente Supabase/PostgreSQL. Scripts e dependencias antigas de MySQL foram removidos.

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
O `docker compose` já sobe:

- o backend apontando para o Supabase via `DATABASE_URL`
- o frontend com proxy para `/api` e `/uploads`

Para parar os containers:

```bash
npm run docker:down
```

Na primeira subida, o backend se conecta ao Supabase. Se voce trocar a URL do banco, reinicie o container para aplicar a mudanca.

### 1. Banco de dados

Abra o projeto no Supabase e execute `database/schema.sql` no SQL Editor.

Para dados iniciais, execute tambem `database/seed.sql`.

Se estiver reaproveitando um banco antigo, rode depois:

- `database/migration_session_and_reset.sql`
- `database/migration_tickets_seats.sql`
- `database/migration_seat_reservations.sql`
- `database/migration_mercado_pago_payments.sql`
- `database/update_roles.sql`

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

### Deploy do backend na Vercel

O backend pode ser publicado como um projeto separado na Vercel usando a pasta `backend` como Root Directory.

No painel da Vercel:

- importe o repositorio pelo GitHub
- em Root Directory, selecione `backend`
- mantenha o framework como Express/Node.js, ou deixe a autodeteccao
- configure as variaveis de ambiente do arquivo `backend/.env.example`
- faca o deploy

Variaveis minimas para producao:

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_SECRET=uma-chave-forte
CORS_ORIGIN=https://seu-frontend.vercel.app
FRONTEND_URL=https://seu-frontend.vercel.app
```

Depois do deploy, teste:

```bash
curl https://sua-api.vercel.app/
curl https://sua-api.vercel.app/api/categories
```

Observacao: uploads locais em `backend/uploads` nao sao persistentes na Vercel. Para imagens em producao, use Supabase Storage, Vercel Blob ou outro storage externo.

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

Para recriar o admin, use `database/criar_admin.js`.

- e-mail: `admin@pipocalizando.com`
- senha: `admin123`

---

# Pipocalizando

<p align="center">
  <strong>Web-based cinema and snack bar system built with React, Node.js, TypeScript and PostgreSQL (Supabase).</strong>
</p>

<p align="center">
  A platform for ticket purchases, seat reservation, snack bar orders, and administrative operations.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Build-Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
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
- `backend`: Node.js + TypeScript + Express + PostgreSQL API
- `database`: SQL scripts and Supabase seed data

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
To stop the containers:

```bash
npm run docker:down
```

### 1. Database

Open the Supabase project and run `database/schema.sql` in the SQL Editor.

For initial data, also run `database/seed.sql`.

If you are upgrading an existing database, run:

- `database/migration_session_and_reset.sql`
- `database/migration_tickets_seats.sql`
- `database/migration_seat_reservations.sql`
- `database/migration_mercado_pago_payments.sql`
- `database/update_roles.sql`

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

To recreate the admin user, run `database/criar_admin.js`.

- email: `admin@pipocalizando.com`
- password: `admin123`
