import * as PaymentModel from '../models/Payment';
import pool from '../config/db';

export const getAllPayments = async () => {
  return await PaymentModel.findAll();
};

export const getPaymentById = async (id: number) => {
  const payment = await PaymentModel.findById(id);
  if (!payment) throw new Error('Pagamento não encontrado.');
  return payment;
};

export const approvePayment = async (id: number) => {
  const payment = await PaymentModel.findById(id);
  if (!payment) throw new Error('Pagamento não encontrado.');
  if (payment.status === 'approved') throw new Error('Pagamento já aprovado.');

  await PaymentModel.approvePayment(id);

  // Atualiza o pedido para confirmado
  await pool.query(
    `UPDATE orders SET status = 'confirmed' WHERE id = ?`, [payment.order_id]
  );
};

export const rejectPayment = async (id: number) => {
  const payment = await PaymentModel.findById(id);
  if (!payment) throw new Error('Pagamento não encontrado.');
  if (payment.status === 'rejected') throw new Error('Pagamento já rejeitado.');

  await PaymentModel.rejectPayment(id);
};
