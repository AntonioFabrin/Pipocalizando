import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db';
import crypto from 'crypto';
import { normalizeRole } from '../utils/roles';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não definido no .env!');
}

const setAuthCookie = (res: Response, token: string) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('access_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

const clearAuthCookie = (res: Response) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      res.status(400).json({ message: 'Nome, email, senha e telefone são obrigatórios.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ message: 'A senha deve ter ao menos 6 caracteres.' });
      return;
    }

    const [existing]: any = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      res.status(400).json({ message: 'Email já cadastrado.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result]: any = await pool.query(
      'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'customer', phone]
    );

    const token = jwt.sign(
      { id: result.insertId, email, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    setAuthCookie(res, token);

    res.status(201).json({
      message: 'Usuário criado!',
      user: { id: result.insertId, name, email, role: 'customer', phone }
    });
  } catch (error: any) {
    console.error('❌ [register]', error?.message || error);
    res.status(500).json({ message: 'Erro interno', detail: error?.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: 'Email e senha são obrigatórios.' });
      return;
    }
    const [rows]: any = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
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
    const role = normalizeRole(user.role);
    const token = jwt.sign(
      { id: user.id, email: user.email, role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    setAuthCookie(res, token);
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role, phone: user.phone }
    });
  } catch (error: any) {
    console.error('❌ [login]', error?.message || error);
    res.status(500).json({ message: 'Erro interno', detail: error?.message });
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
  } catch (error: any) {
    console.error('❌ [getProfile]', error?.message || error);
    res.status(500).json({ message: 'Erro interno', detail: error?.message });
  }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  clearAuthCookie(res);
  res.json({ message: 'Logout realizado.' });
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: 'Email é obrigatório.' });
      return;
    }
    const [rows]: any = await pool.query('SELECT id, name FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      res.json({ message: 'Se o email estiver cadastrado, você receberá o código em breve.' });
      return;
    }
    const user = rows[0];
    const token = String(crypto.randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await pool.query('UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0', [user.id]);
    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, token, expiresAt]
    );
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[RESET] Email: ${email} | Codigo: ${token}`);
    }
    res.json({ message: 'Se o email estiver cadastrado, você receberá o código em breve.' });
  } catch (error: any) {
    console.error('❌ [forgotPassword]', error?.message || error);
    res.status(500).json({ message: 'Erro interno', detail: error?.message });
  }
};

export const verifyResetCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      res.status(400).json({ message: 'Email e código são obrigatórios.' });
      return;
    }
    const [rows]: any = await pool.query(
      `SELECT prt.id FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE u.email = ? AND prt.token = ? AND prt.used = 0 AND prt.expires_at > NOW()`,
      [email, code]
    );
    if (rows.length === 0) {
      res.status(400).json({ message: 'Código inválido ou expirado.' });
      return;
    }
    res.json({ message: 'Código válido.' });
  } catch (error: any) {
    console.error('❌ [verifyResetCode]', error?.message || error);
    res.status(500).json({ message: 'Erro interno', detail: error?.message });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code, new_password } = req.body;
    if (!email || !code || !new_password) {
      res.status(400).json({ message: 'Email, código e nova senha são obrigatórios.' });
      return;
    }
    if (new_password.length < 6) {
      res.status(400).json({ message: 'A senha deve ter ao menos 6 caracteres.' });
      return;
    }
    const [rows]: any = await pool.query(
      `SELECT prt.id, u.id as user_id FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE u.email = ? AND prt.token = ? AND prt.used = 0 AND prt.expires_at > NOW()`,
      [email, code]
    );
    if (rows.length === 0) {
      res.status(400).json({ message: 'Código inválido ou expirado.' });
      return;
    }
    const { id: tokenId, user_id } = rows[0];
    const hashedPassword = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user_id]);
    await pool.query('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', [tokenId]);
    res.json({ message: 'Senha redefinida com sucesso!' });
  } catch (error: any) {
    console.error('❌ [resetPassword]', error?.message || error);
    res.status(500).json({ message: 'Erro interno', detail: error?.message });
  }
};
