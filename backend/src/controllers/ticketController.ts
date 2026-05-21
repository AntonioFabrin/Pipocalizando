import { Request, Response } from 'express';
import pool from '../config/db';
import { v4 as uuidv4 } from 'uuid';
import { MercadoPagoApiError, createCheckoutPreference, createCheckoutReturnUrls } from '../services/mercadoPagoService';
import { cancelTicketOrder, cleanupExpiredTicketPayments } from '../services/ticketPaymentService';

const SEAT_LABEL_RE = /^[A-H](10|[1-9])$/;
const RESERVATION_MINUTES = 20;
const PIX_EXPIRATION_MINUTES = 30;

const normalizeSeatList = (seats: unknown): string[] | null => {
  if (!Array.isArray(seats) || seats.length === 0) return null;

  const normalizedSeats = seats.map((seat: unknown) => String(seat).trim().toUpperCase());
  const uniqueSeats = [...new Set(normalizedSeats)];

  if (uniqueSeats.length !== normalizedSeats.length) return null;
  if (uniqueSeats.some((seat) => !SEAT_LABEL_RE.test(seat))) return null;

  return uniqueSeats;
};

const deleteExpiredReservations = async (conn: any): Promise<void> => {
  await conn.query('DELETE FROM seat_reservations WHERE expires_at <= NOW()');
};

const ensureSeatReservationsTable = async (conn: any): Promise<void> => {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS seat_reservations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id INT NOT NULL,
      movie_id INT NOT NULL,
      user_id INT NOT NULL,
      seat_label VARCHAR(10) NOT NULL,
      reservation_token VARCHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES movie_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY uq_seat_reservation (session_id, seat_label),
      INDEX idx_seat_reservations_expiry (expires_at),
      INDEX idx_seat_reservations_user_session (user_id, session_id)
    )
  `);
};

const ensureMercadoPagoPaymentColumns = async (conn: any): Promise<void> => {
  const [columns]: any = await conn.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments'`
  );
  const existing = new Set(columns.map((column: any) => column.COLUMN_NAME));

  const missingDefinitions: Array<[string, string]> = [
    ['status_detail', 'ADD COLUMN status_detail VARCHAR(100) NULL AFTER status'],
    ['provider', 'ADD COLUMN provider VARCHAR(50) NULL AFTER status_detail'],
    ['provider_payment_id', 'ADD COLUMN provider_payment_id VARCHAR(100) NULL AFTER provider'],
    ['external_reference', 'ADD COLUMN external_reference VARCHAR(100) NULL AFTER provider_payment_id'],
    ['checkout_url', 'ADD COLUMN checkout_url VARCHAR(500) NULL AFTER external_reference'],
    ['qr_code', 'ADD COLUMN qr_code TEXT NULL AFTER checkout_url'],
    ['qr_code_base64', 'ADD COLUMN qr_code_base64 MEDIUMTEXT NULL AFTER qr_code'],
    ['expires_at', 'ADD COLUMN expires_at DATETIME NULL AFTER qr_code_base64'],
    ['raw_response', 'ADD COLUMN raw_response JSON NULL AFTER expires_at'],
  ];

  for (const [columnName, definition] of missingDefinitions) {
    if (!existing.has(columnName)) {
      await conn.query(`ALTER TABLE payments ${definition}`);
    }
  }
};

const findConflictingReservations = async (
  conn: any,
  sessionId: number,
  seats: string[],
  userId: number,
): Promise<any[]> => {
  const [rows]: any = await conn.query(
    `SELECT seat_label
     FROM seat_reservations
     WHERE session_id = ? AND seat_label IN (?) AND user_id <> ? AND expires_at > NOW()
     FOR UPDATE`,
    [sessionId, seats, userId]
  );

  return rows;
};

const assertActiveSession = async (conn: any, sessionId: number, movieId: number): Promise<any | null> => {
  const [sessionRows]: any = await conn.query(
    `SELECT ms.id, ms.available_seats, COALESCE(m.price, 0) AS price
     FROM movie_sessions ms
     JOIN movies m ON m.id = ms.movie_id
     WHERE ms.id = ? AND ms.movie_id = ? AND ms.is_active = 1 AND m.is_active = 1
     FOR UPDATE`,
    [sessionId, movieId]
  );

  return sessionRows.length > 0 ? sessionRows[0] : null;
};

export const reserveSeats = async (req: Request, res: Response): Promise<void> => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await cleanupExpiredTicketPayments(conn);
    await ensureSeatReservationsTable(conn);

    const movieId = Number(req.body.movie_id);
    const sessionId = Number(req.body.session_id);
    const userId = (req as any).user.id;
    const seats = normalizeSeatList(req.body.seats);

    if (!Number.isInteger(movieId) || !Number.isInteger(sessionId) || !seats) {
      await conn.rollback();
      res.status(400).json({ message: 'movie_id, session_id e seats[] validos sao obrigatorios.' });
      return;
    }

    await deleteExpiredReservations(conn);

    const session = await assertActiveSession(conn, sessionId, movieId);
    if (!session) {
      await conn.rollback();
      res.status(404).json({ message: 'Sessao nao encontrada ou inativa.' });
      return;
    }

    const [occupiedSeats]: any = await conn.query(
      'SELECT seat_label FROM tickets WHERE session_id = ? AND seat_label IN (?) FOR UPDATE',
      [sessionId, seats]
    );
    if (occupiedSeats.length > 0) {
      await conn.rollback();
      const labels = occupiedSeats.map((row: any) => row.seat_label).join(', ');
      res.status(409).json({ message: `Assentos ja vendidos: ${labels}` });
      return;
    }

    const conflictingReservations = await findConflictingReservations(conn, sessionId, seats, userId);
    if (conflictingReservations.length > 0) {
      await conn.rollback();
      const labels = conflictingReservations.map((row: any) => row.seat_label).join(', ');
      res.status(409).json({ message: `Assentos temporariamente reservados: ${labels}` });
      return;
    }

    await conn.query(
      'DELETE FROM seat_reservations WHERE session_id = ? AND user_id = ? AND seat_label NOT IN (?)',
      [sessionId, userId, seats]
    );

    const reservationToken = uuidv4();
    for (const seat of seats) {
      const [refreshResult]: any = await conn.query(
        `UPDATE seat_reservations
         SET reservation_token = ?, expires_at = DATE_ADD(NOW(), INTERVAL ? MINUTE)
         WHERE session_id = ? AND seat_label = ? AND user_id = ?`,
        [reservationToken, RESERVATION_MINUTES, sessionId, seat, userId]
      );

      if (refreshResult.affectedRows === 0) {
        await conn.query(
          `INSERT INTO seat_reservations (session_id, movie_id, user_id, seat_label, reservation_token, expires_at)
           VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
        [sessionId, movieId, userId, seat, reservationToken, RESERVATION_MINUTES]
        );
      }
    }

    const [reservedRows]: any = await conn.query(
      `SELECT seat_label, expires_at
       FROM seat_reservations
       WHERE session_id = ? AND user_id = ? AND seat_label IN (?)`,
      [sessionId, userId, seats]
    );

    await conn.commit();
    res.status(201).json({
      message: 'Assentos reservados temporariamente.',
      reserved: reservedRows.map((row: any) => row.seat_label),
      expires_at: reservedRows[0]?.expires_at,
      expires_in_seconds: RESERVATION_MINUTES * 60,
    });
  } catch (err: any) {
    await conn.rollback();
    console.error('[reserveSeats]', err?.message || err);
    const status = err?.code === 'ER_DUP_ENTRY' ? 409 : 500;
    res.status(status).json({
      message: status === 409 ? 'Um ou mais assentos acabaram de ser reservados.' : 'Erro interno',
      detail: err?.message,
    });
  } finally {
    conn.release();
  }
};

export const releaseSeatReservations = async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureSeatReservationsTable(pool);

    const sessionId = Number(req.body.session_id);
    const userId = (req as any).user.id;
    const seats = Array.isArray(req.body.seats)
      ? req.body.seats.map((seat: unknown) => String(seat).trim().toUpperCase())
      : null;

    if (!Number.isInteger(sessionId)) {
      res.status(400).json({ message: 'session_id invalido.' });
      return;
    }

    if (seats && seats.length > 0) {
      await pool.query(
        'DELETE FROM seat_reservations WHERE session_id = ? AND user_id = ? AND seat_label IN (?)',
        [sessionId, userId, seats]
      );
    } else {
      await pool.query(
        'DELETE FROM seat_reservations WHERE session_id = ? AND user_id = ?',
        [sessionId, userId]
      );
    }

    res.json({ message: 'Reserva liberada.' });
  } catch (err: any) {
    console.error('[releaseSeatReservations]', err?.message || err);
    res.status(500).json({ message: 'Erro interno', detail: err?.message });
  }
};

// POST /tickets/purchase
// Body: { movie_id, session_id, seats: string[] }
export const purchaseTickets = async (req: Request, res: Response): Promise<void> => {
  const conn = await pool.getConnection();
  let createdOrderId: number | null = null;
  let createdPaymentId: number | null = null;
  try {
    await ensureMercadoPagoPaymentColumns(conn);
    await conn.beginTransaction();

    const movieId = Number(req.body.movie_id);
    const sessionId = Number(req.body.session_id);
    const seats = normalizeSeatList(req.body.seats);
    const customerId = (req as any).user.id;

    if (!Number.isInteger(movieId) || !Number.isInteger(sessionId) || !seats) {
      await conn.rollback();
      res.status(400).json({ message: 'movie_id, session_id e seats[] validos sao obrigatorios.' });
      return;
    }

    await cleanupExpiredTicketPayments(conn);
    await ensureSeatReservationsTable(conn);
    await deleteExpiredReservations(conn);

    const session = await assertActiveSession(conn, sessionId, movieId);

    if (!session) {
      await conn.rollback();
      res.status(404).json({ message: 'Sessao nao encontrada ou inativa.' });
      return;
    }

    if (Number(session.available_seats) < seats.length) {
      await conn.rollback();
      res.status(409).json({ message: 'Nao ha assentos disponiveis suficientes nesta sessao.' });
      return;
    }

    const [occupiedSeats]: any = await conn.query(
      'SELECT seat_label FROM tickets WHERE session_id = ? AND seat_label IN (?) FOR UPDATE',
      [sessionId, seats]
    );

    if (occupiedSeats.length > 0) {
      await conn.rollback();
      const labels = occupiedSeats.map((row: any) => row.seat_label).join(', ');
      res.status(409).json({ message: `Assentos ja ocupados: ${labels}` });
      return;
    }

    const conflictingReservations = await findConflictingReservations(conn, sessionId, seats, customerId);
    if (conflictingReservations.length > 0) {
      await conn.rollback();
      const labels = conflictingReservations.map((row: any) => row.seat_label).join(', ');
      res.status(409).json({ message: `Assentos temporariamente reservados: ${labels}` });
      return;
    }

    const pricePerSeat = Number(session.price);
    const total = seats.length * pricePerSeat;
    if (!Number.isFinite(pricePerSeat) || pricePerSeat <= 0 || total <= 0) {
      await conn.rollback();
      res.status(400).json({ message: 'Preco do ingresso invalido. Configure um valor maior que zero para o filme.' });
      return;
    }

    const expiresAt = new Date(Date.now() + PIX_EXPIRATION_MINUTES * 60 * 1000);

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
      `INSERT INTO orders (customer_id, session_id, status, total)
       VALUES (?, ?, 'pending', ?)`,
      [customerId, sessionId, total]
    );
    const orderId = orderResult.insertId;
    createdOrderId = orderId;

    const [paymentResult]: any = await conn.query(
      `INSERT INTO payments (order_id, method, amount, status, provider, external_reference, expires_at)
       VALUES (?, 'pix', ?, 'pending', 'mercado_pago', ?, ?)`,
      [orderId, total, `ticket_order_${orderId}`, expiresAt]
    );
    const paymentId = paymentResult.insertId;
    createdPaymentId = paymentId;

    const createdTickets: { seat_label: string; ticket_code: string }[] = [];
    for (const seat of seats) {
      const ticketCode = `POP-${uuidv4().substring(0, 8).toUpperCase()}`;
      await conn.query(
        `INSERT INTO tickets (order_id, ticket_code, seat_label, movie_id, session_id)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, ticketCode, seat, movieId, sessionId]
      );
      createdTickets.push({ seat_label: seat, ticket_code: ticketCode });
    }

    await conn.commit();

    const preference = await createCheckoutPreference({
      orderId,
      paymentId,
      amount: total,
      description: `Ingressos ${seats.join(', ')} - Pedido #${orderId}`,
      seats,
      payer: {
        email: customerRows[0].email,
        name: customerRows[0].name,
      },
      expiresAt,
      backUrls: createCheckoutReturnUrls(
        process.env.FRONTEND_URL ||
        req.headers.origin ||
        'http://localhost:3000',
        `/payment/return?order_id=${orderId}&source=tickets`,
      ),
    });

    await pool.query(
      `UPDATE payments
       SET provider_payment_id = ?,
           status_detail = ?,
           checkout_url = ?,
           qr_code = ?,
           qr_code_base64 = ?,
           raw_response = ?
       WHERE id = ?`,
      [
        String(preference.id),
        'checkout_preference_created',
        preference.init_point,
        null,
        null,
        JSON.stringify(preference),
        paymentId,
      ]
    );

    res.status(201).json({
      message: 'Pagamento PIX criado. Os ingressos serao confirmados apos aprovacao.',
      order_id: orderId,
      payment_id: paymentId,
      provider_payment_id: String(preference.id),
      payment_status: 'pending',
      payment_status_detail: 'checkout_preference_created',
      expires_at: expiresAt,
      total,
      tickets: createdTickets,
      pix: {
        ticket_url: preference.init_point,
        qr_code: null,
        qr_code_base64: null,
      },
    });
  } catch (err: any) {
    try {
      await conn.rollback();
    } catch {}
    if (createdOrderId && createdPaymentId) {
      const cleanupConn = await pool.getConnection();
      try {
        await cleanupConn.beginTransaction();
        await cancelTicketOrder(cleanupConn, createdOrderId, 'mercado_pago_create_failed');
        await cleanupConn.commit();
      } catch {
        await cleanupConn.rollback();
      } finally {
        cleanupConn.release();
      }
    }
    console.error('[purchaseTickets]', err?.message || err, err instanceof MercadoPagoApiError ? err.responseBody : '');
    const status = err?.code === 'ER_DUP_ENTRY' ? 409 : 500;
    const isMercadoPagoError = err instanceof MercadoPagoApiError;
    res.status(status).json({
      message: status === 409 ? 'Um ou mais assentos acabaram de ser ocupados.' : 'Erro ao criar pagamento PIX.',
      detail: err?.message,
      provider: isMercadoPagoError ? 'mercado_pago' : undefined,
      provider_status: isMercadoPagoError ? err.status : undefined,
      provider_response: isMercadoPagoError ? err.responseBody : undefined,
    });
  } finally {
    conn.release();
  }
};

// GET /tickets/occupied/:session_id
export const getOccupiedSeats = async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = Number(req.params.session_id);
    if (!Number.isInteger(sessionId)) {
      res.status(400).json({ message: 'session_id invalido.' });
      return;
    }

    await cleanupExpiredTicketPayments();
    await ensureSeatReservationsTable(pool);
    await pool.query('DELETE FROM seat_reservations WHERE expires_at <= NOW()');

    const [rows]: any = await pool.query(
      `SELECT seat_label FROM tickets WHERE session_id = ? AND seat_label IS NOT NULL
       UNION
       SELECT seat_label FROM seat_reservations WHERE session_id = ? AND expires_at > NOW()`,
      [sessionId, sessionId]
    );

    const [reservationRows]: any = await pool.query(
      'SELECT seat_label, expires_at FROM seat_reservations WHERE session_id = ? AND expires_at > NOW()',
      [sessionId]
    );

    res.json({
      occupied: rows.map((row: any) => row.seat_label),
      reserved: reservationRows.map((row: any) => ({
        seat_label: row.seat_label,
        expires_at: row.expires_at,
      })),
    });
  } catch (err: any) {
    console.error('[getOccupiedSeats]', err?.message || err);
    res.status(500).json({ message: 'Erro interno', detail: err?.message });
  }
};
