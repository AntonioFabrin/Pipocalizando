import pool from '../config/db';
import * as TicketModel from '../models/Ticket';
import * as PaymentModel from '../models/Payment';
import * as OrderModel from '../models/Order';
import { v4 as uuidv4 } from 'uuid';
import { Order } from '../types';

interface OrderItem {
  product_id: number;
  quantity: number;
}

interface CreateOrderData {
  customer_id: number;
  seller_id?: number | null;
  items: OrderItem[];
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'pix';
  notes?: string;
}

export const createOrder = async (data: CreateOrderData) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let total = 0;
    const itemsWithPrice: any[] = [];

    for (const item of data.items) {
      const [rows]: any = await conn.query(
        'SELECT price, stock, name FROM products WHERE id = ? AND is_active = 1', [item.product_id]
      );
      if (rows.length === 0) {
        await conn.rollback();
        throw new Error(`Produto ${item.product_id} não encontrado.`);
      }
      if (rows[0].stock < item.quantity) {
        await conn.rollback();
        throw new Error(`Estoque insuficiente para "${rows[0].name}".`);
      }
      total += rows[0].price * item.quantity;
      itemsWithPrice.push({ ...item, unit_price: rows[0].price });
    }

    const [orderResult]: any = await conn.query(
      'INSERT INTO orders (customer_id, seller_id, total, notes, status) VALUES (?, ?, ?, ?, ?)',
      [data.customer_id, data.seller_id || null, total, data.notes || null, 'pending']
    );
    const order_id = orderResult.insertId;

    for (const item of itemsWithPrice) {
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
      [order_id, data.payment_method || 'cash', total, 'pending']
    );

    const ticket_code = `POP-${uuidv4().split('-')[0].toUpperCase()}`;
    await conn.query(
      'INSERT INTO tickets (order_id, ticket_code) VALUES (?, ?)',
      [order_id, ticket_code]
    );

    await conn.commit();
    return { order_id, ticket_code, total };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

export const getOrders = async (user: { id: number; role: string }) => {
  if (user.role === 'customer') return await OrderModel.findByCustomer(user.id);
  if (user.role === 'seller') return await OrderModel.findBySeller(user.id);
  return await OrderModel.findAll();
};

export const updateOrderStatus = async (id: number, status: Order['status']) => {
  const exists = await OrderModel.findById(id);
  if (!exists) throw new Error('Pedido não encontrado.');
  await OrderModel.updateStatus(id, status);
};

export const validateTicket = async (ticketCode: string) => {
  const ticket = await TicketModel.findByCode(ticketCode);
  if (!ticket) throw new Error('Ticket não encontrado.');
  if (ticket.is_used) throw new Error('Ticket já utilizado.');
  await TicketModel.markAsUsed(ticketCode);
  return ticket;
};
