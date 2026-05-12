import { Request, Response } from 'express';
import pool from '../config/db';
import { v4 as uuidv4 } from 'uuid';

const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
const PAYMENT_METHODS = ['cash', 'credit_card', 'debit_card', 'pix'];

type NormalizedItem = {
  product_id: number;
  quantity: number;
  unit_price?: number;
};

const normalizeItems = (items: any[]): NormalizedItem[] | null => {
  const byProduct = new Map<number, number>();

  for (const item of items) {
    const productId = Number(item?.product_id);
    const quantity = Number(item?.quantity);

    if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
      return null;
    }

    byProduct.set(productId, (byProduct.get(productId) || 0) + quantity);
  }

  return [...byProduct.entries()].map(([product_id, quantity]) => ({ product_id, quantity }));
};

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { items, notes, payment_method, session_id } = req.body;
    const customerId = (req as any).user.id;
    const sellerId = (req as any).user.role === 'seller' ? customerId : null;
    const paymentMethod = payment_method || 'cash';

    if (!items || !Array.isArray(items) || items.length === 0) {
      await conn.rollback();
      res.status(400).json({ message: 'Nenhum item no pedido.' });
      return;
    }

    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      await conn.rollback();
      res.status(400).json({ message: 'Forma de pagamento invalida.' });
      return;
    }

    const normalizedItems = normalizeItems(items);
    if (!normalizedItems) {
      await conn.rollback();
      res.status(400).json({ message: 'Itens invalidos. Use product_id e quantity inteiros positivos.' });
      return;
    }

    const sessionId = session_id ? Number(session_id) : null;
    if (sessionId !== null) {
      if (!Number.isInteger(sessionId)) {
        await conn.rollback();
        res.status(400).json({ message: 'Sessao invalida.' });
        return;
      }

      const [sessionRows]: any = await conn.query(
        'SELECT id FROM movie_sessions WHERE id = ? AND is_active = 1',
        [sessionId]
      );
      if (sessionRows.length === 0) {
        await conn.rollback();
        res.status(400).json({ message: 'Sessao nao encontrada.' });
        return;
      }
    }

    let total = 0;
    for (const item of normalizedItems) {
      const [rows]: any = await conn.query(
        'SELECT price, stock FROM products WHERE id = ? AND is_active = 1 FOR UPDATE',
        [item.product_id]
      );
      if (rows.length === 0) {
        await conn.rollback();
        res.status(400).json({ message: `Produto ${item.product_id} nao encontrado.` });
        return;
      }
      if (Number(rows[0].stock) < item.quantity) {
        await conn.rollback();
        res.status(400).json({ message: `Estoque insuficiente para produto ${item.product_id}.` });
        return;
      }

      item.unit_price = Number(rows[0].price);
      total += item.unit_price * item.quantity;
    }

    const [orderResult]: any = await conn.query(
      'INSERT INTO orders (customer_id, seller_id, session_id, total, notes, status) VALUES (?, ?, ?, ?, ?, ?)',
      [customerId, sellerId, sessionId, total, notes || null, 'pending']
    );
    const orderId = orderResult.insertId;

    for (const item of normalizedItems) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.unit_price]
      );

      const [stockUpdate]: any = await conn.query(
        'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
        [item.quantity, item.product_id, item.quantity]
      );
      if (stockUpdate.affectedRows === 0) {
        await conn.rollback();
        res.status(409).json({ message: `Estoque acabou para produto ${item.product_id}.` });
        return;
      }
    }

    await conn.query(
      'INSERT INTO payments (order_id, method, amount, status) VALUES (?, ?, ?, ?)',
      [orderId, paymentMethod, total, 'pending']
    );

    const ticketCode = `POP-${uuidv4().split('-')[0].toUpperCase()}`;
    await conn.query(
      'INSERT INTO tickets (order_id, ticket_code) VALUES (?, ?)',
      [orderId, ticketCode]
    );

    await conn.commit();
    res.status(201).json({
      message: 'Pedido criado!',
      order_id: orderId,
      ticket_code: ticketCode,
      total,
      payment_method: paymentMethod,
    });
  } catch (error: any) {
    await conn.rollback();
    console.error('[createOrder]', error?.message || error);
    res.status(500).json({ message: 'Erro interno', detail: error?.message });
  } finally {
    conn.release();
  }
};

export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    let query = `
      SELECT o.*,
             tk.ticket_code,
             u.name           AS customer_name,
             p.status         AS payment_status,
             p.method         AS payment_method,
             ms.id            AS session_id,
             mv.title         AS movie_title,
             ms.session_date,
             ms.session_time,
             mv.room          AS room
      FROM orders o
      LEFT JOIN (
        SELECT order_id, GROUP_CONCAT(ticket_code ORDER BY id SEPARATOR ', ') AS ticket_code
        FROM tickets
        GROUP BY order_id
      ) tk ON tk.order_id = o.id
      LEFT JOIN users          u  ON u.id         = o.customer_id
      LEFT JOIN payments       p  ON p.order_id   = o.id
      LEFT JOIN movie_sessions ms ON ms.id        = o.session_id
      LEFT JOIN movies         mv ON mv.id        = ms.movie_id
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
  } catch (error: any) {
    console.error('[getOrders]', error?.message || error);
    res.status(500).json({ message: 'Erro interno', detail: error?.message });
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!ORDER_STATUSES.includes(status)) {
      res.status(400).json({ message: 'Status invalido.' });
      return;
    }

    const [result]: any = await pool.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Pedido nao encontrado.' });
      return;
    }
    res.json({ message: 'Status atualizado!' });
  } catch (error: any) {
    console.error('[updateOrderStatus]', error?.message || error);
    res.status(500).json({ message: 'Erro interno', detail: error?.message });
  }
};

export const validateTicket = async (req: Request, res: Response): Promise<void> => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { ticket_code } = req.params;
    const [rows]: any = await conn.query(
      `SELECT t.*,
              o.total,
              o.status,
              o.created_at,
              u.name AS customer_name,
              p.status AS payment_status,
              p.method AS payment_method
       FROM tickets t
       JOIN orders o ON o.id = t.order_id
       JOIN users  u ON u.id = o.customer_id
       LEFT JOIN payments p ON p.order_id = o.id
       WHERE t.ticket_code = ?
       FOR UPDATE`,
      [ticket_code]
    );

    if (rows.length === 0) {
      await conn.rollback();
      res.status(404).json({ message: 'Ticket nao encontrado.' });
      return;
    }

    const ticket = rows[0];
    if (ticket.is_used) {
      await conn.rollback();
      res.status(400).json({ message: 'Ticket ja utilizado.', ticket });
      return;
    }
    if (ticket.payment_status !== 'approved') {
      await conn.rollback();
      res.status(400).json({ message: 'Pagamento ainda nao aprovado.', ticket });
      return;
    }
    if (ticket.status === 'cancelled') {
      await conn.rollback();
      res.status(400).json({ message: 'Pedido cancelado.', ticket });
      return;
    }

    await conn.query(
      'UPDATE tickets SET is_used = 1, used_at = NOW() WHERE ticket_code = ? AND is_used = 0',
      [ticket_code]
    );

    await conn.commit();
    res.json({ message: 'Ticket validado com sucesso!', ticket });
  } catch (error: any) {
    await conn.rollback();
    console.error('[validateTicket]', error?.message || error);
    res.status(500).json({ message: 'Erro interno', detail: error?.message });
  } finally {
    conn.release();
  }
};
