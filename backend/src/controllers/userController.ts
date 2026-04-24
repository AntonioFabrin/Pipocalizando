import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/db';

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, phone, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error });
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows]: any = await pool.query(
      'SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?',
      [req.params.id]
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

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, phone } = req.body;
    const requestingUser = (req as any).user;

    if (!name || !email || !password || !phone) {
      res.status(400).json({ message: 'Nome, email, senha e telefone são obrigatórios.' });
      return;
    }

    // Regras de quem pode criar qual role
    // super_admin pode criar: manager, seller, customer
    // manager pode criar: seller, customer
    // Ninguém pode criar super_admin
    const allowedRoles: Record<string, string[]> = {
      super_admin: ['manager', 'seller', 'customer'],
      manager: ['seller', 'customer'],
    };

    const allowed = allowedRoles[requestingUser.role] || [];
    const targetRole = role || 'customer';

    if (!allowed.includes(targetRole)) {
      res.status(403).json({ 
        message: `Você não tem permissão para criar usuários com o role "${targetRole}".` 
      });
      return;
    }

    const [existing]: any = await pool.query(
      'SELECT id FROM users WHERE email = ?', [email]
    );
    if (existing.length > 0) {
      res.status(400).json({ message: 'Este email já está cadastrado.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result]: any = await pool.query(
      'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, targetRole, phone]
    );

    res.status(201).json({
      message: 'Usuário criado com sucesso!',
      user: { id: result.insertId, name, email, role: targetRole, phone }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, role } = req.body;
    const requestingUser = (req as any).user;

    if (!name || !email || !phone) {
      res.status(400).json({ message: 'Nome, email e telefone são obrigatórios.' });
      return;
    }

    const [existing]: any = await pool.query(
      'SELECT id, role FROM users WHERE id = ?', [req.params.id]
    );
    if (existing.length === 0) {
      res.status(404).json({ message: 'Usuário não encontrado.' });
      return;
    }

    // Não pode alterar um super_admin (a não ser ele mesmo)
    if (existing[0].role === 'super_admin' && requestingUser.id !== Number(req.params.id)) {
      res.status(403).json({ message: 'Não é permitido alterar o super_admin.' });
      return;
    }

    const [emailCheck]: any = await pool.query(
      'SELECT id FROM users WHERE email = ? AND id != ?', [email, req.params.id]
    );
    if (emailCheck.length > 0) {
      res.status(400).json({ message: 'Email já em uso por outro usuário.' });
      return;
    }

    let hashedPassword = null;
    if (password) hashedPassword = await bcrypt.hash(password, 10);

    // Só super_admin e manager podem mudar role
    const allowedRoles: Record<string, string[]> = {
      super_admin: ['manager', 'seller', 'customer'],
      manager: ['seller', 'customer'],
    };
    const allowed = allowedRoles[requestingUser.role] || [];
    const roleToSet = role && allowed.includes(role) ? role : existing[0].role;

    if (hashedPassword) {
      await pool.query(
        'UPDATE users SET name=?, email=?, password=?, phone=?, role=? WHERE id=?',
        [name, email, hashedPassword, phone, roleToSet, req.params.id]
      );
    } else {
      await pool.query(
        'UPDATE users SET name=?, email=?, phone=?, role=? WHERE id=?',
        [name, email, phone, roleToSet, req.params.id]
      );
    }

    res.json({ message: 'Usuário atualizado com sucesso!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error });
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestingUser = (req as any).user;

    if (String(requestingUser.id) === String(req.params.id)) {
      res.status(400).json({ message: 'Você não pode deletar sua própria conta.' });
      return;
    }

    const [existing]: any = await pool.query(
      'SELECT role FROM users WHERE id = ?', [req.params.id]
    );
    if (existing.length === 0) {
      res.status(404).json({ message: 'Usuário não encontrado.' });
      return;
    }

    // Ninguém pode deletar um super_admin
    if (existing[0].role === 'super_admin') {
      res.status(403).json({ message: 'Não é permitido deletar o super_admin.' });
      return;
    }

    // Manager só pode deletar seller e customer
    if (requestingUser.role === 'manager' && !['seller', 'customer'].includes(existing[0].role)) {
      res.status(403).json({ message: 'Você não tem permissão para deletar este usuário.' });
      return;
    }

    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'Usuário removido com sucesso!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error });
  }
};
