import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db';

const isMissingMercadoPagoColumns = (err: any): boolean =>
  err?.code === 'ER_BAD_FIELD_ERROR' ||
  (typeof err?.message === 'string' && (
    err.message.includes('expires_at') ||
    err.message.includes('status_detail')
  ));

export const cleanupExpiredTicketPayments = async (conn: any = pool): Promise<void> => {
  try {
    await conn.query(
      `UPDATE orders o
       JOIN payments p ON p.order_id = o.id
       SET o.status = 'cancelled',
           p.status = 'rejected',
           p.status_detail = COALESCE(p.status_detail, 'expired')
       WHERE p.method = 'pix'
         AND p.status = 'pending'
         AND p.expires_at IS NOT NULL
         AND p.expires_at <= NOW()`
    );
  } catch (err: any) {
    if (isMissingMercadoPagoColumns(err)) return;
    throw err;
  }

  await conn.query(
    `DELETE t
     FROM tickets t
     JOIN payments p ON p.order_id = t.order_id
     JOIN orders o ON o.id = t.order_id
     WHERE p.method = 'pix'
       AND p.status = 'rejected'
       AND o.status = 'cancelled'
       AND t.is_used = 0`
  );
};

export const finalizeTicketOrder = async (conn: any, orderId: number): Promise<void> => {
  const [existingTickets]: any = await conn.query(
    'SELECT id, ticket_code FROM tickets WHERE order_id = ? FOR UPDATE',
    [orderId]
  );

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
    `DELETE sr
     FROM seat_reservations sr
     JOIN tickets t
       ON t.session_id = sr.session_id
      AND t.seat_label = sr.seat_label
     WHERE t.order_id = ?`,
    [orderId]
  );

  await conn.query('UPDATE orders SET status = "confirmed" WHERE id = ?', [orderId]);
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
  await conn.query('UPDATE orders SET status = "cancelled" WHERE id = ?', [orderId]);
  await conn.query(
    `DELETE FROM tickets
     WHERE order_id = ? AND is_used = 0`,
    [orderId]
  );
};
