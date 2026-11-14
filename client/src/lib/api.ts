import { supabase } from './supabase';
import type {
  CreateOrderResponse,
  Feedback,
  GalleryImage,
  Me,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  ShippingAddress,
  Vlog,
} from './types';

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:4000';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);
  if (data.session) headers.set('Authorization', `Bearer ${data.session.access_token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  const res = await fetch(`${BASE}/api${path}`, { ...init, headers });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
  return body as T;
}

const json = (method: string, data: unknown): RequestInit => ({ method, body: JSON.stringify(data) });

/** One function per backend endpoint (see server/src/routes). */
export const api = {
  // ── Public ─────────────────────────────
  products: (params: { category?: string; q?: string; sort?: string; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && qs.set(k, String(v)));
    return request<Product[]>(`/products?${qs}`);
  },
  product: (id: string) => request<Product>(`/products/${id}`),
  gallery: () => request<GalleryImage[]>('/gallery'),
  vlogs: () => request<Vlog[]>('/vlogs'),
  feedback: (limit?: number) => request<Feedback[]>(`/feedback${limit ? `?limit=${limit}` : ''}`),

  // ── Logged-in customer ─────────────────
  me: () => request<Me>('/me'),
  postFeedback: (data: { rating: number; message: string; name?: string }) =>
    request<Feedback>('/feedback', json('POST', data)),
  myOrders: () => request<Order[]>('/orders/mine'),
  order: (id: string) => request<Order>(`/orders/${id}`),

  // ── Payments ───────────────────────────
  createOrder: (data: {
    items: { product_id: string; quantity: number }[];
    payment_method: PaymentMethod;
    shipping_address: ShippingAddress;
  }) => request<CreateOrderResponse>('/payments/create-order', json('POST', data)),
  verifyPayment: (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    request<{ ok: true; orderId: string }>('/payments/verify', json('POST', data)),

  // ── Admin ──────────────────────────────
  admin: {
    products: () => request<Product[]>('/admin/products'),
    createProduct: (form: FormData) => request<Product>('/admin/products', { method: 'POST', body: form }),
    updateProduct: (id: string, data: Partial<Omit<Product, 'id' | 'image_url' | 'created_at'>>) =>
      request<Product>(`/admin/products/${id}`, json('PATCH', data)),
    replaceProductImage: (id: string, file: File) => {
      const fd = new FormData();
      fd.append('image', file);
      return request<Product>(`/admin/products/${id}/image`, { method: 'PUT', body: fd });
    },
    deleteProduct: (id: string) => request<void>(`/admin/products/${id}`, { method: 'DELETE' }),

    uploadGallery: (form: FormData) => request<GalleryImage[]>('/admin/gallery', { method: 'POST', body: form }),
    deleteGallery: (id: string) => request<void>(`/admin/gallery/${id}`, { method: 'DELETE' }),

    createVlog: (data: { title: string; video_url: string; description: string }) =>
      request<Vlog>('/admin/vlogs', json('POST', data)),
    deleteVlog: (id: string) => request<void>(`/admin/vlogs/${id}`, { method: 'DELETE' }),

    deleteFeedback: (id: string) => request<void>(`/admin/feedback/${id}`, { method: 'DELETE' }),

    orders: () => request<Order[]>('/admin/orders'),
    updateOrderStatus: (id: string, status: Exclude<OrderStatus, 'pending' | 'failed'>) =>
      request<Order>(`/admin/orders/${id}`, json('PATCH', { status })),
  },
};
