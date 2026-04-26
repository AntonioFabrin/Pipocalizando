import pool from '../config/db';
import { Ticket } from '../types';

export const findAll = async (): Promise<Ticket[]> => {
  const [rows]: any = await pool.query(`
    SELECT t.*, o.total, o.status as order_status, u.name as customer_name
    FROM tickets t
    JOIN orders o ON o.id = t.order_id
    JOIN users u ON u.id = o.customer_id
    ORDER BY t.issued_at DESC
  `);
  return rows;
};

export const findByCode = async (ticketCode: string): Promise<Ticket | null> => {
  const [rows]: any = await pool.query(`
    SELECT t.*, o.total, o.status as order_status, u.name as customer_name
    FROM tickets t
    JOIN orders o ON o.id = t.order_id
    JOIN users u ON u.id = o.customer_id
    WHERE t.ticket_code = ?
  `, [ticketCode]);
  return rows.length > 0 ? rows[0] : null;
};

export const findByOrder = async (orderId: number): Promise<Ticket | null> => {
  const [rows]: any = await pool.query(
    'SELECT * FROM tickets WHERE order_id = ?', [orderId]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const markAsUsed = async (ticketCode: string): Promise<boolean> => {
  const [result]: any = await pool.query(
    'UPDATE tickets SET is_used = 1, used_at = NOW() WHERE ticket_code = ?',
    [ticketCode]
  );
  return result.affectedRows > 0;
};

export const createTicket = async (orderId: number, ticketCode: string): Promise<number> => {
  const [result]: any = await pool.query(
    'INSERT INTO tickets (order_id, ticket_code) VALUES (?, ?)',
    [orderId, ticketCode]
  );
  return result.insertId;
};
