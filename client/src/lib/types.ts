import type { CategorySlug } from './categories';

export interface Product {
  id: string;
  name: string;
  category: CategorySlug;
  price: number;
  quantity: number;
  bio: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
}

export interface Vlog {
  id: string;
  title: string;
  video_url: string;
  description: string;
  created_at: string;
}

export interface Feedback {
  id: string;
  name: string;
  rating: number;
  message: string;
  created_at: string;
}

export interface Me {
  id: string;
  email?: string;
  role: 'customer' | 'admin';
  fullName: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
}

export interface ShippingAddress {
  full_name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'failed';
export type PaymentMethod = 'upi_qr' | 'credit_card' | 'debit_card';

export interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  amount: number;
  status: OrderStatus;
  payment_method: PaymentMethod | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  shipping_address: ShippingAddress;
  created_at: string;
}

export interface CreateOrderResponse {
  orderId: string;
  razorpayOrderId: string;
  amount: number; // paise
  currency: string;
  keyId: string;
  customer: { name: string; email?: string; contact: string };
}
