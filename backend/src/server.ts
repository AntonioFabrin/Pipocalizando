import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { testConnection } from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota raiz
app.get('/', (req: Request, res: Response) => {
  res.json({ message: '🍿 Pipocalizando API rodando!' });
});

// Rotas da API
app.use('/api', routes);

// Rota não encontrada
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: `Rota ${req.method} ${req.path} não encontrada.` });
});

const start = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  });
};

start();
