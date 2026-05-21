import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import routes from './routes';
import { testConnection } from './config/db';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET não definido no .env!');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3333;
const corsOrigin = process.env.NODE_ENV === 'production'
  ? process.env.CORS_ORIGIN
  : true;

app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Servir arquivos de upload estaticamente ──────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: '🍿 Pipocalizando API rodando!', version: '1.1.0' });
});

app.use('/api', routes);

// Rota não encontrada
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: `Rota ${req.method} ${req.path} não encontrada.` });
});

// Middleware global de erros
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ [ERROR]', err?.message || err);
  res.status(err.status || 500).json({ message: err.message || 'Erro interno do servidor.' });
});

const start = async () => {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Falha ao iniciar servidor:', err);
    process.exit(1);
  }
};

start();
