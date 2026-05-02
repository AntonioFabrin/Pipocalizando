import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { testConnection } from './config/db';

console.log('🔵 [1] Iniciando servidor...');

dotenv.config();

console.log('🔵 [2] dotenv carregado');
console.log('🔵 [3] PORT =', process.env.PORT);
console.log('🔵 [4] DB_HOST =', process.env.DB_HOST);
console.log('🔵 [5] DB_USER =', process.env.DB_USER);
console.log('🔵 [6] DB_NAME =', process.env.DB_NAME);
console.log('🔵 [7] DB_PORT =', process.env.DB_PORT);

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
  res.json({ message: '🍿 Pipocalizando API rodando!' });
});

app.use('/api', routes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: `Rota ${req.method} ${req.path} não encontrada.` });
});

const start = async () => {
  console.log('🔵 [8] Tentando conectar no MySQL...');
  try {
    await testConnection();
    console.log('🔵 [9] MySQL OK! Subindo na porta', PORT);
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Erro no start():', err);
  }
};

start();
