import { v4 as uuidv4 } from 'uuid';

type PixPaymentInput = {
  orderId: number;
  paymentId: number;
  amount: number;
  description: string;
  payer: {
    email: string;
    name?: string;
  };
  expiresAt: Date;
};

type MercadoPagoPayment = {
  id: number | string;
  status: string;
  status_detail?: string;
  external_reference?: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
};

const MERCADO_PAGO_API = 'https://api.mercadopago.com';

const getAccessToken = (): string => {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error('MERCADO_PAGO_ACCESS_TOKEN nao definido no .env.');
  }
  return token;
};

const parseMercadoPagoResponse = async (response: Response): Promise<MercadoPagoPayment> => {
  const data: any = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Mercado Pago respondeu com status ${response.status}`;
    throw new Error(message);
  }
  return data;
};

export const createPixPayment = async (input: PixPaymentInput): Promise<MercadoPagoPayment> => {
  const notificationUrl = process.env.MERCADO_PAGO_WEBHOOK_URL;
  const body: Record<string, unknown> = {
    transaction_amount: Number(input.amount.toFixed(2)),
    description: input.description,
    payment_method_id: 'pix',
    payer: {
      email: input.payer.email,
      first_name: input.payer.name || undefined,
    },
    external_reference: `ticket_order_${input.orderId}`,
    date_of_expiration: input.expiresAt.toISOString(),
    metadata: {
      order_id: input.orderId,
      local_payment_id: input.paymentId,
    },
  };

  if (notificationUrl) {
    body.notification_url = notificationUrl;
  }

  const response = await fetch(`${MERCADO_PAGO_API}/v1/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': uuidv4(),
    },
    body: JSON.stringify(body),
  });

  return parseMercadoPagoResponse(response);
};

export const getPayment = async (providerPaymentId: string): Promise<MercadoPagoPayment> => {
  const response = await fetch(`${MERCADO_PAGO_API}/v1/payments/${providerPaymentId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json',
    },
  });

  return parseMercadoPagoResponse(response);
};

export const getPixData = (payment: MercadoPagoPayment) => {
  const transactionData = payment.point_of_interaction?.transaction_data;
  return {
    qr_code: transactionData?.qr_code || null,
    qr_code_base64: transactionData?.qr_code_base64 || null,
    ticket_url: transactionData?.ticket_url || null,
  };
};
