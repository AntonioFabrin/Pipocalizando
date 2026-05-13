export interface User {
  id?: number;
  name: string;
  email: string;
  password: string;
  role: 'super_admin' | 'manager' | 'seller' | 'customer';
  phone?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Product {
  id?: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category_id?: number;
  image_url?: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface Category {
  id?: number;
  name: string;
  description?: string;
}

export interface Order {
  id?: number;
  customer_id: number;
  seller_id?: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  total: number;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface OrderItem {
  id?: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface Ticket {
  id?: number;
  order_id: number;
  ticket_code: string;
  issued_at?: Date;
  is_used?: boolean;
  used_at?: Date | null;
}

export interface Payment {
  id?: number;
  order_id: number;
  method: 'cash' | 'credit_card' | 'debit_card' | 'pix';
  status: 'pending' | 'approved' | 'rejected' | 'refunded';
  status_detail?: string | null;
  provider?: string | null;
  provider_payment_id?: string | null;
  external_reference?: string | null;
  checkout_url?: string | null;
  qr_code?: string | null;
  qr_code_base64?: string | null;
  expires_at?: Date | null;
  amount: number;
  paid_at?: Date | null;
  created_at?: Date;
}

export interface JwtPayload {
  id: number;
  email: string;
  role: string;
}
