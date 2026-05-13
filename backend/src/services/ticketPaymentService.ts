import pool from '../config/db';

export const cleanupExpiredTicketPayments = async (conn: any = pool): Promise<void> => {
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
  await conn.query(
    `UPDATE payments
     SET status = 'rejected',
         status_detail = ?
     WHERE order_id = ? AND status = 'pending'`,
    [detail, orderId]
  );
  await conn.query('UPDATE orders SET status = "cancelled" WHERE id = ?', [orderId]);
  await conn.query(
    `DELETE FROM tickets
     WHERE order_id = ? AND is_used = 0`,
    [orderId]
  );
};
