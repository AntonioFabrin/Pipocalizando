import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db';

const isMissingMercadoPagoColumns = (err: any): boolean =>
  err?.code === '42703' ||
  (typeof err?.message === 'string' && (
    err.message.includes('expires_at') ||
    err.message.includes('status_detail')
  ));

export const cleanupExpiredTicketPayments = async (conn: any = pool): Promise<void> => {
  let expiredOrders: Array<{ id: number; order_id: number }> = [];

  try {
    const [rows]: any = await conn.query(
      `SELECT p.id, p.order_id
       FROM payments p
       WHERE p.method = 'pix'
         AND p.status = 'pending'
         AND p.expires_at IS NOT NULL
         AND p.expires_at <= NOW()`
    );

    expiredOrders = rows;
    if (expiredOrders.length === 0) {
      return;
    }

    const paymentIds = expiredOrders.map((row) => row.id);
    const orderIds = [...new Set(expiredOrders.map((row) => row.order_id))];

    await conn.query(
      `UPDATE payments
       SET status = 'rejected',
           status_detail = COALESCE(status_detail, 'expired')
       WHERE id IN (?)`,
      [paymentIds]
    );

    await conn.query(
      `UPDATE orders
       SET status = 'cancelled'
       WHERE id IN (?)`,
      [orderIds]
    );

    await conn.query(
      `DELETE FROM tickets
       WHERE order_id IN (?) AND is_used = 0`,
      [orderIds]
    );
  } catch (err: any) {
    if (isMissingMercadoPagoColumns(err)) return;
    throw err;
  }
};

export const finalizeTicketOrder = async (conn: any, orderId: number): Promise<void> => {
  const [orderRows]: any = await conn.query(
    'SELECT id, status FROM orders WHERE id = ? FOR UPDATE',
    [orderId]
  );

  if (orderRows.length === 0) {
    throw new Error('Pedido nao encontrado para confirmacao.');
  }

  if (orderRows[0].status === 'confirmed') {
    return;
  }

  const [existingTickets]: any = await conn.query(
    'SELECT id, ticket_code FROM tickets WHERE order_id = ? FOR UPDATE',
    [orderId]
  );

  const [productRows]: any = await conn.query(
    `SELECT oi.product_id,
            oi.quantity,
            p.name,
            p.stock
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ?
     FOR UPDATE`,
    [orderId]
  );

  for (const item of productRows) {
    if (Number(item.stock) < Number(item.quantity)) {
      throw new Error(`Estoque insuficiente para confirmar "${item.name}".`);
    }

    const [stockUpdate]: any = await conn.query(
      'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
      [item.quantity, item.product_id, item.quantity]
    );

    if (stockUpdate.affectedRows === 0) {
      throw new Error(`Estoque acabou para "${item.name}".`);
    }
  }

  const [ticketRows]: any = await conn.query(
    `SELECT session_id, COUNT(*) AS total
     FROM tickets
     WHERE order_id = ? AND session_id IS NOT NULL
     GROUP BY session_id
     FOR UPDATE`,
    [orderId]
  );

  for (const row of ticketRows) {
    const [seatUpdate]: any = await conn.query(
      `UPDATE movie_sessions
       SET available_seats = available_seats - ?
       WHERE id = ? AND available_seats >= ?`,
      [row.total, row.session_id, row.total]
    );

    if (seatUpdate.affectedRows === 0) {
      throw new Error('Nao ha assentos disponiveis suficientes para confirmar este pedido.');
    }
  }

  if (existingTickets.length === 0) {
    const ticketCode = `POP-${uuidv4().split('-')[0].toUpperCase()}`;
    await conn.query(
      'INSERT INTO tickets (order_id, ticket_code) VALUES (?, ?)',
      [orderId, ticketCode]
    );
  }

  await conn.query(
    `DELETE FROM seat_reservations sr
     USING tickets t
     WHERE t.order_id = ?
       AND t.session_id = sr.session_id
       AND t.seat_label = sr.seat_label`,
    [orderId]
  );

  await conn.query('UPDATE orders SET status = \'confirmed\' WHERE id = ?', [orderId]);
};

export const cancelTicketOrder = async (conn: any, orderId: number, detail = 'cancelled'): Promise<void> => {
  try {
    await conn.query(
      `UPDATE payments
       SET status = 'rejected',
           status_detail = ?
       WHERE order_id = ? AND status = 'pending'`,
      [detail, orderId]
    );
  } catch (err: any) {
    if (!isMissingMercadoPagoColumns(err)) throw err;
    await conn.query(
      `UPDATE payments
       SET status = 'rejected'
       WHERE order_id = ? AND status = 'pending'`,
      [orderId]
    );
  }

  await conn.query('UPDATE orders SET status = \'cancelled\' WHERE id = ? AND status = \'pending\'', [orderId]);
  await conn.query(
    `DELETE FROM tickets
     WHERE order_id = ? AND is_used = 0`,
    [orderId]
  );
};
