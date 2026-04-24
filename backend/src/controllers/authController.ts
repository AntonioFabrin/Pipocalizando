import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password || !phone) {
      res.status(400).json({ message: 'Nome, email, senha e telefone são obrigatórios.' });
      return;
    }

    const [existing]: any = await pool.query(
      'SELECT id FROM users WHERE email = ?', [email]
    );
    if (existing.length > 0) {
      res.status(400).json({ message: 'Email já cadastrado.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Sem token = sempre customer, não importa o que vier no body
    const safeRole = role || 'customer';

    const [result]: any = await pool.query(
      'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, safeRole, phone]
    );

    res.status(201).json({
      message: 'Usuário criado!',
      user: {
        id: result.insertId,
        name,
        email,
        role: safeRole,
        phone
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: 'Email e senha são obrigatórios.' });
      return;
    }
    const [rows]: any = await pool.query(
      'SELECT * FROM users WHERE email = ?', [email]
    );
    if (rows.length === 0) {
      res.status(401).json({ message: 'Credenciais inválidas.' });
      return;
    }
    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Credenciais inválidas.' });
      return;
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'pipocalizando_secret',
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const [rows]: any = await pool.query(
      'SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?', [userId]
    );
    if (rows.length === 0) {
      res.status(404).json({ message: 'Usuário não encontrado.' });
      return;
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error });
  }
};
