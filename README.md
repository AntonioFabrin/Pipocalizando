# Pipocalizando

Sistema de cinema e bomboniere com:

- compra de ingressos com escolha de assento
- reserva temporaria de assentos
- fluxo de pagamento com aprovacao/cancelamento no backend
- carrinho de produtos da bomboniere com baixa de estoque
- painel administrativo para operacao e gestao
- frontend web oficial com experiencias separadas por perfil

## O que o projeto faz

O Pipocalizando junta tres camadas:

- `backend`: API em Node.js + TypeScript + Express + MySQL
- `frontend`: interface web oficial em React + Vite

O objetivo e simular a jornada completa de um cinema:

- cliente se cadastra e faz login
- escolhe uma sessao e reserva assentos por 20 minutos
- conclui o pagamento e recebe o ticket
- compra produtos da bomboniere
- equipe acompanha pedidos, pagamentos e estoque no painel

## Features principais

- login e cadastro de cliente
- reserva temporaria de assentos
- compra de ingressos com confirmacao automatica apos aprovacao do pagamento
- cancelamento de pedido com reversao do fluxo no backend
- baixa de estoque em compras confirmadas
- cadastro e edicao de produtos
- painel administrativo com pedidos, produtos, filmes e usuarios
- separacao de perfis entre `super_admin`, `manager`, `seller` e `customer`

## Como rodar

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
