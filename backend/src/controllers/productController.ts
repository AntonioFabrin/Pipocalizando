import { Request, Response } from 'express';
import pool from '../config/db';
import { Product } from '../types';
import { isValidProductDraft } from '../utils/flowRules';

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = 1`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error });
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows]: any = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ message: 'Produto nao encontrado.' });
      return;
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error });
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, price, stock, category_id, image_url }: Product = req.body;
    if (!isValidProductDraft({ name, price })) {
      res.status(400).json({ message: 'Nome e preco sao obrigatorios e o preco precisa ser maior que zero.' });
      return;
    }

    const [result]: any = await pool.query(
      'INSERT INTO products (name, description, price, stock, category_id, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description || null, price, stock || 0, category_id || null, image_url || null]
    );
    res.status(201).json({ message: 'Produto criado!', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, price, stock, category_id, image_url, is_active }: Product = req.body;
    if (!isValidProductDraft({ name, price })) {
      res.status(400).json({ message: 'Nome e preco sao obrigatorios e o preco precisa ser maior que zero.' });
      return;
    }

    const [result]: any = await pool.query(
      'UPDATE products SET name=?, description=?, price=?, stock=?, category_id=?, image_url=?, is_active=? WHERE id=?',
      [name, description || null, price, stock || 0, category_id || null, image_url || null, is_active ?? 1, req.params.id]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Produto nao encontrado.' });
      return;
    }
    res.json({ message: 'Produto atualizado!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error });
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const [result]: any = await pool.query(
      'UPDATE products SET is_active = 0 WHERE id = ?', [req.params.id]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Produto nao encontrado.' });
      return;
    }
    res.json({ message: 'Produto desativado.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error });
  }
};
