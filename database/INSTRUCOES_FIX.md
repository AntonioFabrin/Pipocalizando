# 🎬 Pipocalizando — Guia de Correção e Setup

## ⚡ EXECUTE NA ORDEM ABAIXO

---

## PASSO 1 — Corrigir o banco de dados (HeidiSQL)

1. Abra o **HeidiSQL**
2. Conecte ao banco `pipocalizando`
3. Abra o arquivo `database/FIX_COMPLETO.sql`
4. Pressione **F9** para executar tudo
5. Verifique que o `DESCRIBE movies` no final mostra as colunas:
   - `category_id`, `room_id`, `trailer_url`, `status`, `on_display_until`, `premiere_date`

---

## PASSO 2 — Criar/resetar o usuário admin com senha real

Execute no terminal dentro da pasta do projeto:

```bash
cd C:\Users\Antonio\Desktop\Pipocalizando\backend
node ..\database\criar_admin.js
```

Isso cria ou atualiza:
- **Email:** admin@pipocalizando.com
- **Senha:** admin123
- **Role:** super_admin

> Para trocar a senha, edite a variável `SENHA` no arquivo `database/criar_admin.js` antes de rodar.

---

## PASSO 3 — Reiniciar o backend

```bash
cd C:\Users\Antonio\Desktop\Pipocalizando\backend
npm run dev
```

Aguarde a mensagem:
```
✅ MySQL conectado com sucesso!
🚀 Servidor rodando em http://localhost:3333
```

---

## PASSO 4 — Testar no Insomnia

### Login (para obter token):
- **Método:** POST
- **URL:** `http://localhost:3333/api/auth/login`
- **Body JSON:**
```json
{
  "email": "admin@pipocalizando.com",
  "password": "admin123"
}
```
Copie o `token` da resposta.

---

### Criar filme:
- **Método:** POST
- **URL:** `http://localhost:3333/api/movies`
- **Header:** `Authorization: Bearer SEU_TOKEN_AQUI`
- **Body JSON:**
```json
{
  "title": "Meu Primeiro Filme",
  "description": "Sinopse do filme de teste",
  "genre": "Ação",
  "duration_minutes": 120,
  "director": "Diretor Teste",
  "cast_info": "Ator 1, Atriz 2",
  "rating": "12+",
  "category_id": 1,
  "room_id": 1,
  "room": "Sala 1",
  "price": 25.00,
  "session_date": "2026-06-01",
  "session_time": "19:00",
  "premiere_date": "2026-06-01",
  "on_display_until": "2026-06-30",
  "status": "now_playing"
}
```

**Resposta esperada:**
```json
{ "message": "Filme criado!", "id": 1 }
```

Se retornar `500` com `"detail": "..."` agora você vê o erro real no terminal do backend.

---

## O que foi corrigido

| Arquivo | Problema | Correção |
|---|---|---|
| `backend/src/controllers/movieController.ts` | `catch` silenciava o erro SQL real | Todos os `catch` agora logam `err.message` e retornam `detail` |
| `backend/src/controllers/movieController.ts` | `trailer_url` presente no payload do front mas nunca inserido no banco | Adicionado ao `INSERT` e `UPDATE` |
| `backend/src/controllers/movieController.ts` | `ORDER BY session_date` quebrava quando `session_date = NULL` | Corrigido com `ISNULL(m.session_date) ASC` |
| `backend/src/controllers/authController.ts` | Erros internos suprimidos | Todos os `catch` agora logam o erro real |
| `backend/src/controllers/orderController.ts` | Erros internos suprimidos | Todos os `catch` agora logam o erro real |
| `database/FIX_COMPLETO.sql` | Colunas `category_id`, `room_id`, `status`, `trailer_url` podem estar faltando na tabela `movies` | Script `ADD COLUMN IF NOT EXISTS` para cada coluna |
| `database/FIX_COMPLETO.sql` | Role `'admin'` não existe no sistema (usa `'super_admin'`) | `UPDATE users SET role = 'super_admin' WHERE role = 'admin'` |
| `database/criar_admin.js` | Sem forma de criar admin com senha hasheada | Script Node para criar/resetar o admin |

---

## Roles do sistema

| Role | Pode criar filmes | Pode gerenciar pedidos | Pode gerenciar usuários |
|---|---|---|---|
| `super_admin` | ✅ | ✅ | ✅ |
| `manager` | ✅ | ✅ | ✅ (exceto super_admin) |
| `seller` | ✅ | ✅ (próprios) | ❌ |
| `customer` | ❌ | ❌ | ❌ |
