import { Request, Response } from 'express';
import pool from '../config/db';

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error });
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows]: any = await pool.query(
      'SELECT * FROM categories WHERE id = ?', [req.params.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ message: 'Categoria não encontrada.' });
      return;
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error });
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    if (!name) {
      res.status(400).json({ message: 'Nome é obrigatório.' });
      return;
    }
    const [result]: any = await pool.query(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description || null]
    );
    res.status(201).json({ message: 'Categoria criada!', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    if (!name) {
      res.status(400).json({ message: 'Nome é obrigatório.' });
      return;
    }
    const [result]: any = await pool.query(
      'UPDATE categories SET name=?, description=? WHERE id=?',
      [name, description || null, req.params.id]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Categoria não encontrada.' });
      return;
    }
    res.json({ message: 'Categoria atualizada!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error });
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const [result]: any = await pool.query(
      'DELETE FROM categories WHERE id = ?', [req.params.id]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Categoria não encontrada.' });
      return;
    }
    res.json({ message: 'Categoria removida!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error });
  }
};
