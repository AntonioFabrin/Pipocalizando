import { Request, Response } from 'express';
import pool from '../config/db';

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, o.total as order_total, u.name as customer_name
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      JOIN users u ON u.id = o.customer_id
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error });
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows]: any = await pool.query(`
      SELECT p.*, o.total as order_total, u.name as customer_name
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      JOIN users u ON u.id = o.customer_id
      WHERE p.id = ?
    `, [req.params.id]);
    if (rows.length === 0) {
      res.status(404).json({ message: 'Pagamento não encontrado.' });
      return;
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error });
  }
};

export const approve = async (req: Request, res: Response): Promise<void> => {
  try {
    const [result]: any = await pool.query(
      `UPDATE payments SET status = 'approved', paid_at = NOW() WHERE id = ?`,
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Pagamento não encontrado.' });
      return;
    }
    await pool.query(
      `UPDATE orders SET status = 'confirmed' WHERE id = (SELECT order_id FROM payments WHERE id = ?)`,
      [req.params.id]
    );
    res.json({ message: 'Pagamento aprovado!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error });
  }
};

export const reject = async (req: Request, res: Response): Promise<void> => {
  try {
    const [result]: any = await pool.query(
      `UPDATE payments SET status = 'rejected' WHERE id = ?`,
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Pagamento não encontrado.' });
      return;
    }
    res.json({ message: 'Pagamento rejeitado.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error });
  }
};
