import { Request, Response } from 'express';
import pool from '../config/db';
import { getPayment, getPixData } from '../services/mercadoPagoService';
import { cancelTicketOrder, finalizeTicketOrder } from '../services/ticketPaymentService';

const getProviderPaymentId = (req: Request): string | null => {
  const id =
    req.body?.data?.id ||
    req.body?.id ||
    req.query?.id ||
    req.query?.['data.id'];

  if (id) return String(id);

  const resource = req.body?.resource || req.query?.resource;
  if (typeof resource === 'string') {
    const match = resource.match(/\/payments\/([^/?]+)/);
    return match?.[1] || null;
  }

  return null;
};

const syncMercadoPagoPayment = async (providerPaymentId: string) => {
  const providerPayment = await getPayment(providerPaymentId);
  const pix = getPixData(providerPayment);
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [rows]: any = await conn.query(
      `SELECT p.*, o.status AS order_status
       FROM payments p
       JOIN orders o ON o.id = p.order_id
       WHERE p.provider_payment_id = ? OR p.external_reference = ?
       FOR UPDATE`,
      [String(providerPayment.id), providerPayment.external_reference || null]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return { found: false, providerPayment };
    }

    const payment = rows[0];
    await conn.query(
      `UPDATE payments
       SET provider_payment_id = ?,
           status_detail = ?,
           checkout_url = COALESCE(?, checkout_url),
           qr_code = COALESCE(?, qr_code),
           qr_code_base64 = COALESCE(?, qr_code_base64),
           raw_response = ?
       WHERE id = ?`,
      [
        String(providerPayment.id),
        providerPayment.status_detail || providerPayment.status,
        pix.ticket_url,
        pix.qr_code,
        pix.qr_code_base64,
        JSON.stringify(providerPayment),
        payment.id,
      ]
    );

    if (providerPayment.status === 'approved' && payment.status !== 'approved') {
      await conn.query(
        `UPDATE payments
         SET status = 'approved', paid_at = COALESCE(paid_at, NOW())
         WHERE id = ?`,
        [payment.id]
      );
      await finalizeTicketOrder(conn, payment.order_id);
    } else if (
      ['cancelled', 'rejected', 'refunded', 'charged_back'].includes(providerPayment.status) &&
      payment.status === 'pending'
    ) {
      await cancelTicketOrder(conn, payment.order_id, providerPayment.status_detail || providerPayment.status);
    }

    await conn.commit();
    return { found: true, providerPayment };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

export const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, o.total as order_total, u.name as customer_name
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      JOIN users u ON u.id = o.customer_id
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error });
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows]: any = await pool.query(`
      SELECT p.*, o.total as order_total, u.name as customer_name
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      JOIN users u ON u.id = o.customer_id
      WHERE p.id = ?
    `, [req.params.id]);
    if (rows.length === 0) {
      res.status(404).json({ message: 'Pagamento nao encontrado.' });
      return;
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erro interno', error });
  }
};

export const approve = async (req: Request, res: Response): Promise<void> => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [paymentRows]: any = await conn.query(
      'SELECT * FROM payments WHERE id = ? FOR UPDATE',
      [req.params.id]
    );
    if (paymentRows.length === 0) {
      await conn.rollback();
      res.status(404).json({ message: 'Pagamento nao encontrado.' });
      return;
    }

    await conn.query(
      `UPDATE payments SET status = 'approved', paid_at = COALESCE(paid_at, NOW()) WHERE id = ?`,
      [req.params.id]
    );
    if (paymentRows[0].status !== 'approved') {
      await finalizeTicketOrder(conn, paymentRows[0].order_id);
    }

    await conn.commit();
    res.json({ message: 'Pagamento aprovado!' });
  } catch (error: any) {
    await conn.rollback();
    res.status(500).json({ message: 'Erro interno', detail: error?.message });
  } finally {
    conn.release();
  }
};

export const reject = async (req: Request, res: Response): Promise<void> => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [paymentRows]: any = await conn.query(
      'SELECT * FROM payments WHERE id = ? FOR UPDATE',
      [req.params.id]
    );
    if (paymentRows.length === 0) {
      await conn.rollback();
      res.status(404).json({ message: 'Pagamento nao encontrado.' });
      return;
    }

    await cancelTicketOrder(conn, paymentRows[0].order_id, 'manual_reject');
    await conn.commit();
    res.json({ message: 'Pagamento rejeitado.' });
  } catch (error: any) {
    await conn.rollback();
    res.status(500).json({ message: 'Erro interno', detail: error?.message });
  } finally {
    conn.release();
  }
};

export const mercadoPagoWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const providerPaymentId = getProviderPaymentId(req);
    if (!providerPaymentId) {
      res.status(200).json({ message: 'Notificacao ignorada: pagamento nao identificado.' });
      return;
    }

    const result = await syncMercadoPagoPayment(providerPaymentId);
    res.json({
      message: result.found ? 'Pagamento sincronizado.' : 'Pagamento local nao encontrado.',
      provider_payment_id: providerPaymentId,
      status: result.providerPayment.status,
    });
  } catch (error: any) {
    console.error('[mercadoPagoWebhook]', error?.message || error);
    res.status(500).json({ message: 'Erro ao sincronizar Mercado Pago.', detail: error?.message });
  }
};

export const getOrderPaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = Number(req.params.order_id);
    const user = (req as any).user;
    if (!Number.isInteger(orderId)) {
      res.status(400).json({ message: 'order_id invalido.' });
      return;
    }

    const params: any[] = [orderId];
    let ownershipFilter = '';
    if (user.role === 'customer') {
      ownershipFilter = ' AND o.customer_id = ?';
      params.push(user.id);
    }

    const [rows]: any = await pool.query(
      `SELECT p.*, o.status AS order_status
       FROM payments p
       JOIN orders o ON o.id = p.order_id
       WHERE o.id = ?${ownershipFilter}
       ORDER BY p.id DESC
       LIMIT 1`,
      params
    );

    if (rows.length === 0) {
      res.status(404).json({ message: 'Pagamento nao encontrado.' });
      return;
    }

    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: 'Erro interno', detail: error?.message });
  }
};
