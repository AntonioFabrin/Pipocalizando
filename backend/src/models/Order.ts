import pool from '../config/db';
import { Order, OrderItem } from '../types';

export const findAll = async (): Promise<Order[]> => {
  const [rows]: any = await pool.query(`
    SELECT o.*, t.ticket_code, u.name as customer_name, p.status as payment_status
    FROM orders o
    LEFT JOIN tickets t ON t.order_id = o.id
    LEFT JOIN users u ON u.id = o.customer_id
    LEFT JOIN payments p ON p.order_id = o.id
    ORDER BY o.created_at DESC
  `);
  return rows;
};

export const findById = async (id: number): Promise<Order | null> => {
  const [rows]: any = await pool.query(`
    SELECT o.*, t.ticket_code, u.name as customer_name, p.status as payment_status
    FROM orders o
    LEFT JOIN tickets t ON t.order_id = o.id
    LEFT JOIN users u ON u.id = o.customer_id
    LEFT JOIN payments p ON p.order_id = o.id
    WHERE o.id = ?
  `, [id]);
  return rows.length > 0 ? rows[0] : null;
};

export const findByCustomer = async (customerId: number): Promise<Order[]> => {
  const [rows]: any = await pool.query(`
    SELECT o.*, t.ticket_code, p.status as payment_status
    FROM orders o
    LEFT JOIN tickets t ON t.order_id = o.id
    LEFT JOIN payments p ON p.order_id = o.id
    WHERE o.customer_id = ?
    ORDER BY o.created_at DESC
  `, [customerId]);
  return rows;
};

export const findBySeller = async (sellerId: number): Promise<Order[]> => {
  const [rows]: any = await pool.query(`
    SELECT o.*, t.ticket_code, u.name as customer_name, p.status as payment_status
    FROM orders o
    LEFT JOIN tickets t ON t.order_id = o.id
    LEFT JOIN users u ON u.id = o.customer_id
    LEFT JOIN payments p ON p.order_id = o.id
    WHERE o.seller_id = ?
    ORDER BY o.created_at DESC
  `, [sellerId]);
  return rows;
};

export const findOrderItems = async (orderId: number): Promise<OrderItem[]> => {
  const [rows]: any = await pool.query(`
    SELECT oi.*, p.name as product_name
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ?
  `, [orderId]);
  return rows;
};

export const updateStatus = async (id: number, status: Order['status']): Promise<boolean> => {
  const [result]: any = await pool.query(
    'UPDATE orders SET status = ? WHERE id = ?', [status, id]
  );
  return result.affectedRows > 0;
};
