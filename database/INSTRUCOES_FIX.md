# Pipocalizando - Setup do banco no Supabase

Este projeto usa somente PostgreSQL/Supabase. Nao use scripts MySQL/HeidiSQL para preparar o banco.

## Ordem recomendada

1. Abra o projeto `Pipocalizando` no Supabase.
2. No SQL Editor, execute `database/schema.sql`.
3. Para dados iniciais, execute `database/seed.sql`.
4. Se estiver reaproveitando um banco antigo, execute depois:
   - `database/migration_session_and_reset.sql`
   - `database/migration_tickets_seats.sql`
   - `database/migration_seat_reservations.sql`
   - `database/migration_mercado_pago_payments.sql`
   - `database/update_roles.sql`
5. No backend, configure:
   - `DATABASE_URL`
   - `DIRECT_URL`
6. Para criar ou resetar o admin, rode:

```bash
cd C:\Users\Antonio\Desktop\Pipocalizando\backend
node ..\database\criar_admin.js
```

## Admin padrao

- Email: `admin@pipocalizando.com`
- Senha: `admin123`
- Role: `super_admin`

## Reiniciar o backend

```bash
cd C:\Users\Antonio\Desktop\Pipocalizando\backend
npm run dev
```

Voce deve ver a mensagem de conexao com PostgreSQL e o servidor subindo normalmente.

## Testes rapidos

Para validar a conexao PostgreSQL:

```bash
cd C:\Users\Antonio\Desktop\Pipocalizando\backend
npm run db:debug
```

Para validar a criacao de filme direto no banco:

```bash
cd C:\Users\Antonio\Desktop\Pipocalizando\backend
node debug_movie.js
```

Para validar banco e API local:

```bash
cd C:\Users\Antonio\Desktop\Pipocalizando\backend
node ..\database\debug_criar_filme.js
```

Tambem faca login com o admin acima e valide se:

- filmes carregam
- pedidos abrem
- reserva de assentos funciona
- pagamentos continuam criando registros em `payments`

## Arquivos principais

| Arquivo | Uso |
|---|---|
| `database/schema.sql` | Schema completo do Supabase |
| `database/seed.sql` | Dados iniciais do Supabase |
| `database/migration_session_and_reset.sql` | Tokens de sessao e reset de senha |
| `database/migration_tickets_seats.sql` | Ajustes de tickets por assento |
| `database/migration_seat_reservations.sql` | Reservas temporarias |
| `database/migration_mercado_pago_payments.sql` | Colunas extras do Mercado Pago |
| `database/update_roles.sql` | Normalizacao de roles antigas |
| `database/criar_admin.js` | Cria ou reseta o admin |
