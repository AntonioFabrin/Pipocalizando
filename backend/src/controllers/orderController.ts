import { Request, Response } from 'express';
import pool from '../config/db';
import { createCheckoutPreference, createCheckoutReturnUrls } from '../services/mercadoPagoService';
import { isSellerLikeRole, normalizeRole } from '../utils/roles';

const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
const PAYMENT_METHODS = ['cash', 'credit_card', 'debit_card', 'pix'];
const MAX_QUANTITY_PER_PRODUCT = 100;

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

    if (
      !Number.isInteger(productId) ||
      productId <= 0 ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > MAX_QUANTITY_PER_PRODUCT
    ) {
      return null;
    }

    const nextQuantity = (byProduct.get(productId) || 0) + quantity;
    if (nextQuantity > MAX_QUANTITY_PER_PRODUCT) {
      return null;
    }

    byProduct.set(productId, nextQuantity);
  }

  return [...byProduct.entries()].map(([product_id, quantity]) => ({ product_id, quantity }));
};

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { items, notes, payment_method, session_id } = req.body;
    const customerId = (req as any).user.id;
    const sellerId = isSellerLikeRole((req as any).user.role) ? customerId : null;
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
      res.status(400).json({ message: `Itens invalidos. Use product_id e quantity entre 1 e ${MAX_QUANTITY_PER_PRODUCT}.` });
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
        'SELECT name, price, stock FROM products WHERE id = ? AND is_active = 1 FOR UPDATE',
        [item.product_id]
      );
      if (rows.length === 0) {
        await conn.rollback();
        res.status(400).json({ message: `Produto ${item.product_id} nao encontrado.` });
        return;
      }
      if (Number(rows[0].stock) < item.quantity) {
        await conn.rollback();
        res.status(400).json({ message: `Estoque insuficiente para "${rows[0].name}".` });
        return;
      }

      item.unit_price = Number(rows[0].price);
      total += item.unit_price * item.quantity;
    }

    if (!Number.isFinite(total) || total <= 0) {
      await conn.rollback();
      res.status(400).json({ message: 'Total do pedido invalido.' });
      return;
    }

    const [customerRows]: any = await conn.query(
      'SELECT id, name, email FROM users WHERE id = ?',
      [customerId]
    );
    if (customerRows.length === 0) {
      await conn.rollback();
      res.status(404).json({ message: 'Cliente nao encontrado.' });
      return;
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

      // O estoque e consumido somente apos pagamento aprovado, para nao reter itens em pedidos abandonados.
    }

    const [paymentResult]: any = await conn.query(
      'INSERT INTO payments (order_id, method, amount, status, expires_at) VALUES (?, ?, ?, ?, ?)',
      [orderId, paymentMethod, total, 'pending', paymentMethod === 'cash' ? null : new Date(Date.now() + 30 * 60 * 1000)]
    );
    const paymentId = paymentResult.insertId;

    let checkoutUrl: string | null = null;
    if (paymentMethod !== 'cash') {
      const backUrls = createCheckoutReturnUrls(
        process.env.FRONTEND_URL ||
        req.headers.origin ||
        'http://localhost:3000',
        `/payment/return?order_id=${orderId}&source=products`,
      );

      const preference = await createCheckoutPreference({
        orderId,
        paymentId,
        amount: total,
        description: `Pedido #${orderId} - Bomboniere`,
        seats: [],
        payer: {
          email: customerRows[0].email,
          name: customerRows[0].name,
        },
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        ...(backUrls ? { backUrls } : {}),
      });

      checkoutUrl = preference.init_point || null;
      await conn.query(
        `UPDATE payments
         SET provider = 'mercado_pago',
             provider_payment_id = ?,
             external_reference = ?,
             checkout_url = ?,
             status_detail = 'checkout_preference_created'
         WHERE id = ?`,
        [String(preference.id), `ticket_order_${orderId}`, checkoutUrl, paymentId]
      );
    }

    await conn.commit();
    res.status(201).json({
      message: 'Pedido criado!',
      order_id: orderId,
      total,
      payment_method: paymentMethod,
      checkout_url: checkoutUrl,
      payment_status: 'pending',
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
             tk.ticket_issued_at,
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
        SELECT order_id,
               GROUP_CONCAT(ticket_code ORDER BY id SEPARATOR ', ') AS ticket_code,
               MIN(issued_at) AS ticket_issued_at
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
    } else if (isSellerLikeRole(normalizeRole(user.role))) {
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

export const getSalesReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (normalizeRole(user?.role) !== 'super_admin') {
      res.status(403).json({ message: 'Acesso restrito ao super_admin.' });
      return;
    }

    const requestedDays = Number(req.query.days || 30);
    const periodDays = Number.isFinite(requestedDays) ? Math.min(Math.max(Math.trunc(requestedDays), 7), 90) : 30;

    const [salesRows]: any = await pool.query(
      `
      SELECT o.id            AS order_id,
             o.total         AS total,
             o.status        AS order_status,
             o.created_at    AS created_at,
             p.status        AS payment_status,
             p.method        AS payment_method,
             p.paid_at       AS paid_at,
             u.id            AS customer_id,
             u.name          AS customer_name,
             u.email         AS customer_email,
             tk.ticket_code  AS ticket_code,
             tk.ticket_issued_at AS ticket_issued_at
      FROM orders o
      JOIN payments p ON p.order_id = o.id AND p.status = 'approved'
      JOIN users u ON u.id = o.customer_id
      LEFT JOIN (
        SELECT order_id,
               GROUP_CONCAT(ticket_code ORDER BY id SEPARATOR ', ') AS ticket_code,
               MIN(issued_at) AS ticket_issued_at
        FROM tickets
        GROUP BY order_id
      ) tk ON tk.order_id = o.id
      WHERE COALESCE(p.paid_at, o.created_at) >= DATE_SUB(NOW(), INTERVAL ? DAY)
      ORDER BY COALESCE(p.paid_at, o.created_at) DESC, o.id DESC
      `,
      [periodDays]
    );

    const orderIds = salesRows.map((sale: any) => Number(sale.order_id));
    const itemsByOrder = new Map<number, Array<{
      product_id: number;
      product_name: string;
      quantity: number;
      unit_price: number;
      line_total: number;
    }>>();

    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => '?').join(', ');
      const [itemRows]: any = await pool.query(
        `
        SELECT oi.order_id,
               oi.product_id,
               oi.quantity,
               oi.unit_price,
               p.name AS product_name
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id IN (${placeholders})
        ORDER BY oi.order_id DESC, oi.id ASC
        `,
        orderIds
      );

      for (const item of itemRows) {
        const orderId = Number(item.order_id);
        if (!itemsByOrder.has(orderId)) {
          itemsByOrder.set(orderId, []);
        }

        itemsByOrder.get(orderId)!.push({
          product_id: Number(item.product_id),
          product_name: item.product_name,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          line_total: Number(item.quantity) * Number(item.unit_price),
        });
      }
    }

    const enrichedSales = salesRows.map((sale: any) => {
      const orderId = Number(sale.order_id);
      const items = itemsByOrder.get(orderId) || [];
      return {
        ...sale,
        order_id: orderId,
        total: Number(sale.total),
        items,
        items_summary: items.length > 0
          ? items.map((item) => `${item.product_name} x${item.quantity}`).join(' • ')
          : '-',
      };
    });

    const [chartRows]: any = await pool.query(
      `
      SELECT DATE(COALESCE(p.paid_at, o.created_at)) AS sale_day,
             COUNT(*) AS sales_count,
             COALESCE(SUM(o.total), 0) AS revenue
      FROM orders o
      JOIN payments p ON p.order_id = o.id AND p.status = 'approved'
      WHERE COALESCE(p.paid_at, o.created_at) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(COALESCE(p.paid_at, o.created_at))
      ORDER BY sale_day ASC
      `,
      [periodDays]
    );

    const [topProductsRows]: any = await pool.query(
      `
      SELECT p.id AS product_id,
             p.name AS product_name,
             SUM(oi.quantity) AS quantity_sold,
             SUM(oi.quantity * oi.unit_price) AS revenue
      FROM orders o
      JOIN payments pay ON pay.order_id = o.id AND pay.status = 'approved'
      JOIN order_items oi ON oi.order_id = o.id
      JOIN products p ON p.id = oi.product_id
      WHERE COALESCE(pay.paid_at, o.created_at) >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY p.id, p.name
      ORDER BY quantity_sold DESC, revenue DESC
      LIMIT 8
      `,
      [periodDays]
    );

    const toLocalDateKey = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const dailySalesMap = new Map<string, { date: string; sales_count: number; revenue: number }>();
    for (const row of chartRows) {
      const key = String(row.sale_day).slice(0, 10);
      dailySalesMap.set(key, {
        date: key,
        sales_count: Number(row.sales_count || 0),
        revenue: Number(row.revenue || 0),
      });
    }

    const dailySales: Array<{ date: string; sales_count: number; revenue: number }> = [];
    for (let i = periodDays - 1; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = toLocalDateKey(date);
      dailySales.push(
        dailySalesMap.get(key) || {
          date: key,
          sales_count: 0,
          revenue: 0,
        }
      );
    }

    const totalRevenue = enrichedSales.reduce(
      (acc: number, sale: { total: number }) => acc + Number(sale.total || 0),
      0
    );
    const totalItemsSold = enrichedSales.reduce(
      (acc: number, sale: { items: Array<{ quantity: number }> }) =>
        acc + sale.items.reduce((sum: number, item: { quantity: number }) => sum + Number(item.quantity || 0), 0),
      0
    );
    const uniqueCustomers = new Set(enrichedSales.map((sale: any) => sale.customer_id)).size;

    res.json({
      period_days: periodDays,
      summary: {
        total_sales: enrichedSales.length,
        total_revenue: totalRevenue,
        total_items_sold: totalItemsSold,
        unique_customers: uniqueCustomers,
        average_ticket: enrichedSales.length > 0 ? totalRevenue / enrichedSales.length : 0,
      },
      sales: enrichedSales,
      daily_sales: dailySales,
      top_products: topProductsRows.map((row: any) => ({
        product_id: row.product_id,
        product_name: row.product_name,
        quantity_sold: Number(row.quantity_sold || 0),
        revenue: Number(row.revenue || 0),
      })),
    });
  } catch (error: any) {
    console.error('[getSalesReport]', error?.message || error);
    res.status(500).json({ message: 'Erro interno', detail: error?.message });
  }
};
