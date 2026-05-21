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

type PreferenceInput = PixPaymentInput & {
  seats: string[];
  backUrls?: {
    success: string;
    pending?: string;
    failure?: string;
  };
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

type MercadoPagoPreference = {
  id: string;
  init_point?: string;
  sandbox_init_point?: string;
  external_reference?: string;
};

export class MercadoPagoApiError extends Error {
  status: number;
  responseBody: unknown;

  constructor(status: number, message: string, responseBody: unknown) {
    super(message);
    this.name = 'MercadoPagoApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

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
    const causeMessages = Array.isArray(data?.cause)
      ? data.cause
          .map((cause: any) => cause?.description || cause?.message || cause?.code)
          .filter(Boolean)
          .join(' | ')
      : '';
    const message =
      causeMessages ||
      data?.message ||
      data?.error ||
      `Mercado Pago respondeu com status ${response.status}`;
    throw new MercadoPagoApiError(response.status, message, data);
  }
  return data;
};

export const createPixPayment = async (input: PixPaymentInput): Promise<MercadoPagoPayment> => {
  const notificationUrl = process.env.MERCADO_PAGO_WEBHOOK_URL;
  const payerEmail = process.env.MERCADO_PAGO_PAYER_EMAIL_OVERRIDE || input.payer.email;
  const body: Record<string, unknown> = {
    transaction_amount: Number(input.amount.toFixed(2)),
    description: input.description,
    payment_method_id: 'pix',
    payer: {
      email: payerEmail,
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

  const payment = await parseMercadoPagoResponse(response);
  console.info('[MercadoPago] PIX criado', {
    order_id: input.orderId,
    payment_id: input.paymentId,
    provider_payment_id: payment.id,
    status: payment.status,
    status_detail: payment.status_detail,
  });
  return payment;
};

export const createCheckoutPreference = async (input: PreferenceInput): Promise<MercadoPagoPreference> => {
  const notificationUrl = process.env.MERCADO_PAGO_WEBHOOK_URL;
  const payerEmail = process.env.MERCADO_PAGO_PAYER_EMAIL_OVERRIDE || input.payer.email;
  const checkoutMode = process.env.MERCADO_PAGO_CHECKOUT_MODE || 'production';
  const preferenceExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
  const body: Record<string, unknown> = {
    items: [
      {
        id: String(input.orderId),
        title: input.description,
        description: input.seats.length > 0 ? `Assentos: ${input.seats.join(', ')}` : input.description,
        quantity: 1,
        currency_id: 'BRL',
        unit_price: Number(input.amount.toFixed(2)),
      },
    ],
    payer: {
      email: payerEmail,
      name: input.payer.name || undefined,
    },
    payment_methods: {
      installments: 1,
    },
    external_reference: `ticket_order_${input.orderId}`,
    expires: true,
    expiration_date_from: new Date().toISOString(),
    expiration_date_to: preferenceExpiresAt.toISOString(),
    metadata: {
      order_id: input.orderId,
      local_payment_id: input.paymentId,
    },
  };

  if (input.backUrls) {
    body.back_urls = input.backUrls;
    body.auto_return = 'approved';
  }

  if (notificationUrl) {
    body.notification_url = notificationUrl;
  }

  const response = await fetch(`${MERCADO_PAGO_API}/checkout/preferences`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': uuidv4(),
    },
    body: JSON.stringify(body),
  });

  const data: any = await parseMercadoPagoResponse(response);
  const checkoutUrl = checkoutMode === 'sandbox' && data.sandbox_init_point
    ? data.sandbox_init_point
    : data.init_point || data.sandbox_init_point;

  console.info('[MercadoPago] Preferencia criada', {
    order_id: input.orderId,
    payment_id: input.paymentId,
    preference_id: data.id,
    mode: checkoutMode,
    checkout_url: checkoutUrl ? 'ok' : 'missing',
  });

  return {
    id: data.id,
    init_point: checkoutUrl,
    sandbox_init_point: data.sandbox_init_point,
    external_reference: data.external_reference,
  };
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
