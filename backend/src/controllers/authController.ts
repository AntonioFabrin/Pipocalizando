import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db';
import crypto from 'crypto';

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

// ── Recuperação de senha ─────────────────────────────────────────────────────

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: 'Email é obrigatório.' });
      return;
    }

    const [rows]: any = await pool.query(
      'SELECT id, name FROM users WHERE email = ?', [email]
    );
    // Sempre retorna 200 para não vazar se o email existe
    if (rows.length === 0) {
      res.json({ message: 'Se o email estiver cadastrado, você receberá o código em breve.' });
      return;
    }

    const user = rows[0];
    // Gera código numérico de 6 dígitos
    const token = String(crypto.randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Invalida tokens anteriores do usuário
    await pool.query(
      'UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0',
      [user.id]
    );

    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, token, expiresAt]
    );

    // TODO: integrar com serviço de email (Nodemailer, SendGrid, etc.)
    // Por ora loga no console para desenvolvimento
    console.log(`[RESET PASSWORD] Email: ${email} | Código: ${token} | Expira: ${expiresAt.toISOString()}`);

    res.json({ message: 'Se o email estiver cadastrado, você receberá o código em breve.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error });
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
      `SELECT prt.id
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE u.email = ?
         AND prt.token = ?
         AND prt.used = 0
         AND prt.expires_at > NOW()`,
      [email, code]
    );

    if (rows.length === 0) {
      res.status(400).json({ message: 'Código inválido ou expirado.' });
      return;
    }

    res.json({ message: 'Código válido.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error });
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
      `SELECT prt.id, u.id as user_id
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE u.email = ?
         AND prt.token = ?
         AND prt.used = 0
         AND prt.expires_at > NOW()`,
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
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error });
  }
};
