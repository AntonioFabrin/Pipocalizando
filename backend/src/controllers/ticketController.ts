import { Request, Response } from 'express';
import pool from '../config/db';
import { v4 as uuidv4 } from 'uuid';

const SEAT_LABEL_RE = /^[A-H](10|[1-9])$/;

// POST /tickets/purchase
// Body: { movie_id, session_id, seats: string[] }
export const purchaseTickets = async (req: Request, res: Response): Promise<void> => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const movieId = Number(req.body.movie_id);
    const sessionId = Number(req.body.session_id);
    const seats = req.body.seats;
    const customerId = (req as any).user.id;

    if (!Number.isInteger(movieId) || !Number.isInteger(sessionId) || !Array.isArray(seats) || seats.length === 0) {
      await conn.rollback();
      res.status(400).json({ message: 'movie_id, session_id e seats[] sao obrigatorios.' });
      return;
    }

    const normalizedSeats = seats.map((seat: unknown) => String(seat).trim().toUpperCase());
    const uniqueSeats = [...new Set(normalizedSeats)];

    if (uniqueSeats.length !== normalizedSeats.length) {
      await conn.rollback();
      res.status(400).json({ message: 'Assentos duplicados no pedido.' });
      return;
    }

    if (uniqueSeats.some((seat) => !SEAT_LABEL_RE.test(seat))) {
      await conn.rollback();
      res.status(400).json({ message: 'Assento invalido.' });
      return;
    }

    const [sessionRows]: any = await conn.query(
      `SELECT ms.id, ms.available_seats, COALESCE(m.price, 0) AS price
       FROM movie_sessions ms
       JOIN movies m ON m.id = ms.movie_id
       WHERE ms.id = ? AND ms.movie_id = ? AND ms.is_active = 1 AND m.is_active = 1
       FOR UPDATE`,
      [sessionId, movieId]
    );

    if (sessionRows.length === 0) {
      await conn.rollback();
      res.status(404).json({ message: 'Sessao nao encontrada ou inativa.' });
      return;
    }

    if (Number(sessionRows[0].available_seats) < uniqueSeats.length) {
      await conn.rollback();
      res.status(409).json({ message: 'Nao ha assentos disponiveis suficientes nesta sessao.' });
      return;
    }

    const [occupiedSeats]: any = await conn.query(
      'SELECT seat_label FROM tickets WHERE session_id = ? AND seat_label IN (?) FOR UPDATE',
      [sessionId, uniqueSeats]
    );

    if (occupiedSeats.length > 0) {
      await conn.rollback();
      const labels = occupiedSeats.map((row: any) => row.seat_label).join(', ');
      res.status(409).json({ message: `Assentos ja ocupados: ${labels}` });
      return;
    }

    const pricePerSeat = Number(sessionRows[0].price);
    const total = uniqueSeats.length * pricePerSeat;

    const [orderResult]: any = await conn.query(
      `INSERT INTO orders (customer_id, session_id, status, total)
       VALUES (?, ?, 'pending', ?)`,
      [customerId, sessionId, total]
    );
    const orderId = orderResult.insertId;

    await conn.query(
      `INSERT INTO payments (order_id, method, amount, status)
       VALUES (?, 'pix', ?, 'pending')`,
      [orderId, total]
    );

    const createdTickets: { seat_label: string; ticket_code: string }[] = [];
    for (const seat of uniqueSeats) {
      const ticketCode = `POP-${uuidv4().substring(0, 8).toUpperCase()}`;
      await conn.query(
        `INSERT INTO tickets (order_id, ticket_code, seat_label, movie_id, session_id)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, ticketCode, seat, movieId, sessionId]
      );
      createdTickets.push({ seat_label: seat, ticket_code: ticketCode });
    }

    const [seatUpdate]: any = await conn.query(
      'UPDATE movie_sessions SET available_seats = available_seats - ? WHERE id = ? AND available_seats >= ?',
      [uniqueSeats.length, sessionId, uniqueSeats.length]
    );

    if (seatUpdate.affectedRows === 0) {
      await conn.rollback();
      res.status(409).json({ message: 'Nao ha assentos disponiveis suficientes nesta sessao.' });
      return;
    }

    await conn.commit();
    res.status(201).json({
      message: 'Ingressos comprados com sucesso!',
      order_id: orderId,
      total,
      tickets: createdTickets,
    });
  } catch (err: any) {
    await conn.rollback();
    console.error('[purchaseTickets]', err?.message || err);
    const status = err?.code === 'ER_DUP_ENTRY' ? 409 : 500;
    res.status(status).json({
      message: status === 409 ? 'Um ou mais assentos acabaram de ser ocupados.' : 'Erro interno',
      detail: err?.message,
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

    const [rows]: any = await pool.query(
      'SELECT seat_label FROM tickets WHERE session_id = ? AND seat_label IS NOT NULL',
      [sessionId]
    );
    res.json({ occupied: rows.map((row: any) => row.seat_label) });
  } catch (err: any) {
    console.error('[getOccupiedSeats]', err?.message || err);
    res.status(500).json({ message: 'Erro interno', detail: err?.message });
  }
};
