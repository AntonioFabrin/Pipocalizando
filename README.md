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

## Roles
| Role | Descrição |
|------|-----------|
| super_admin | Dono do sistema |
| manager | Gerente de cinema |
| seller | Vendedor do balcão |
| customer | Cliente |
