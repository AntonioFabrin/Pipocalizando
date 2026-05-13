# Pipocalizando 🍿

Sistema de vendas para cinema com ticket digital.

## Tecnologias
- **Backend:** Node.js + TypeScript + Express + MySQL
- **Mobile:** React Native + Expo + TypeScript

## Estrutura
```
Pipocalizando/
├── backend/     → API REST
├── mobile/      → App React Native
└── database/    → Schema MySQL
```

## Como rodar

### Backend
```bash
cd backend
npm install
cp .env.example .env  # configure sua senha do MySQL
npx tsc
node dist/server.js
```

### Mobile
```bash
cd mobile
npm install
npx expo start
```

### Banco de dados
```bash
mysql -u root -p < database/schema.sql
```

Se o banco ja existir e voce estiver apenas atualizando os ingressos com assentos:
```bash
mysql -u root -p < database/migration_tickets_seats.sql
```

Para ativar reservas temporarias de assentos por 20 minutos em bancos existentes:
```bash
mysql -u root -p < database/migration_seat_reservations.sql
```

## Roles
| Role | Descrição |
|------|-----------|
| super_admin | Dono do sistema |
| manager | Gerente de cinema |
| seller | Vendedor do balcão |
| customer | Cliente |
