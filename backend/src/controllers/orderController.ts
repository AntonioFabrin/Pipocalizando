import { Request, Response } from 'express';
import pool from '../config/db';
import { v4 as uuidv4 } from 'uuid';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { items, notes, payment_method } = req.body;
    const customer_id = (req as any).user.id;
    const seller_id = (req as any).user.role === 'seller' ? customer_id : null;

    let total = 0;
    for (const item of items) {
      const [rows]: any = await conn.query(
        'SELECT price, stock FROM products WHERE id = ? AND is_active = 1', [item.product_id]
      );
      if (rows.length === 0) {
        await conn.rollback();
        res.status(400).json({ message: `Produto ${item.product_id} não encontrado.` });
        return;
      }
      if (rows[0].stock < item.quantity) {
        await conn.rollback();
        res.status(400).json({ message: `Estoque insuficiente para produto ${item.product_id}.` });
        return;
      }
      total += rows[0].price * item.quantity;
      item.unit_price = rows[0].price;
    }

    const [orderResult]: any = await conn.query(
      'INSERT INTO orders (customer_id, seller_id, total, notes, status) VALUES (?, ?, ?, ?, ?)',
      [customer_id, seller_id, total, notes || null, 'pending']
    );
    const order_id = orderResult.insertId;

    for (const item of items) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [order_id, item.product_id, item.quantity, item.unit_price]
      );
      await conn.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    await conn.query(
      'INSERT INTO payments (order_id, method, amount, status) VALUES (?, ?, ?, ?)',
      [order_id, payment_method || 'cash', total, 'pending']
    );

    const ticket_code = `POP-${uuidv4().split('-')[0].toUpperCase()}`;
    await conn.query(
      'INSERT INTO tickets (order_id, ticket_code) VALUES (?, ?)',
      [order_id, ticket_code]
    );

    await conn.commit();
    res.status(201).json({ message: 'Pedido criado!', order_id, ticket_code, total });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ message: 'Erro interno', error });
  } finally {
    conn.release();
  }
};

export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    let query = `
      SELECT o.*, t.ticket_code, u.name as customer_name, p.status as payment_status
      FROM orders o
      LEFT JOIN tickets t ON t.order_id = o.id
      LEFT JOIN users u ON u.id = o.customer_id
      LEFT JOIN payments p ON p.order_id = o.id
    `;
    const params: any[] = [];
    if (user.role === 'customer') {
      query += ' WHERE o.customer_id = ?';
      params.push(user.id);
    } else if (user.role === 'seller') {
      query += ' WHERE o.seller_id = ?';
      params.push(user.id);
    }
    query += ' ORDER BY o.created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error });
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const [result]: any = await pool.query(
      'UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Pedido não encontrado.' });
      return;
    }
    res.json({ message: 'Status atualizado!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error });
  }
};

export const validateTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticket_code } = req.params;
    const [rows]: any = await pool.query(
      `SELECT t.*, o.total, o.status, u.name as customer_name
       FROM tickets t
       JOIN orders o ON o.id = t.order_id
       JOIN users u ON u.id = o.customer_id
       WHERE t.ticket_code = ?`,
      [ticket_code]
    );
    if (rows.length === 0) {
      res.status(404).json({ message: 'Ticket não encontrado.' });
      return;
    }
    const ticket = rows[0];
    if (ticket.is_used) {
      res.status(400).json({ message: 'Ticket já utilizado.', ticket });
      return;
    }
    await pool.query(
      'UPDATE tickets SET is_used = 1, used_at = NOW() WHERE ticket_code = ?',
      [ticket_code]
    );
    res.json({ message: 'Ticket validado com sucesso!', ticket });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error });
  }
};
