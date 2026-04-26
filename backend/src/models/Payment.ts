import pool from '../config/db';
import { Payment } from '../types';

export const findAll = async (): Promise<Payment[]> => {
  const [rows]: any = await pool.query(`
    SELECT p.*, o.total as order_total, u.name as customer_name
    FROM payments p
    JOIN orders o ON o.id = p.order_id
    JOIN users u ON u.id = o.customer_id
    ORDER BY p.created_at DESC
  `);
  return rows;
};

export const findById = async (id: number): Promise<Payment | null> => {
  const [rows]: any = await pool.query(`
    SELECT p.*, o.total as order_total, u.name as customer_name
    FROM payments p
    JOIN orders o ON o.id = p.order_id
    JOIN users u ON u.id = o.customer_id
    WHERE p.id = ?
  `, [id]);
  return rows.length > 0 ? rows[0] : null;
};

export const findByOrder = async (orderId: number): Promise<Payment | null> => {
  const [rows]: any = await pool.query(
    'SELECT * FROM payments WHERE order_id = ?', [orderId]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const createPayment = async (data: Omit<Payment, 'id' | 'created_at'>): Promise<number> => {
  const [result]: any = await pool.query(
    'INSERT INTO payments (order_id, method, amount, status) VALUES (?, ?, ?, ?)',
    [data.order_id, data.method, data.amount, data.status || 'pending']
  );
  return result.insertId;
};

export const approvePayment = async (id: number): Promise<boolean> => {
  const [result]: any = await pool.query(
    `UPDATE payments SET status = 'approved', paid_at = NOW() WHERE id = ?`, [id]
  );
  return result.affectedRows > 0;
};

export const rejectPayment = async (id: number): Promise<boolean> => {
  const [result]: any = await pool.query(
    `UPDATE payments SET status = 'rejected' WHERE id = ?`, [id]
  );
  return result.affectedRows > 0;
};
