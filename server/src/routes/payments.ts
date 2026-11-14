import { Router, type Request, type Response } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { razorpay } from '../lib/razorpay.js';
import { env } from '../lib/env.js';
import { ah } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';

export const paymentsRouter = Router();

const createOrderSchema = z.object({
  items: z
    .array(z.object({ product_id: z.string().uuid(), quantity: z.number().int().min(1).max(50) }))
    .min(1),
  payment_method: z.enum(['upi_qr', 'credit_card', 'debit_card']),
  shipping_address: z.object({
    full_name: z.string().trim().min(2).max(100),
    phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
    line1: z.string().trim().min(3).max(200),
    line2: z.string().trim().max(200).optional().default(''),
    city: z.string().trim().min(2).max(80),
    state: z.string().trim().min(2).max(80),
    pincode: z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
  }),
});

/**
 * Step 1: create a Razorpay order.
 * Prices and stock are read from the database — the client only sends product IDs and quantities.
 */
paymentsRouter.post(
  '/create-order',
  requireAuth,
  ah(async (req, res) => {
    const body = createOrderSchema.parse(req.body);

    // merge duplicate lines
    const qtyById = new Map<string, number>();
    for (const i of body.items) qtyById.set(i.product_id, (qtyById.get(i.product_id) ?? 0) + i.quantity);

    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, price, quantity, image_url, is_active')
      .in('id', [...qtyById.keys()]);
    if (error) throw error;

    const items = [];
    let amount = 0;
    for (const [id, qty] of qtyById) {
      const p = products?.find((x) => x.id === id);
      if (!p || !p.is_active) return res.status(400).json({ error: 'A product in your cart is no longer available' });
      if (p.quantity < qty)
        return res.status(400).json({ error: `Only ${p.quantity} left of "${p.name}". Please update your cart.` });
      const price = Number(p.price);
      amount += price * qty;
      items.push({ product_id: p.id, name: p.name, price, quantity: qty, image_url: p.image_url });
    }
    amount = Math.round(amount * 100) / 100;
    if (amount < 1) return res.status(400).json({ error: 'Order total must be at least ₹1' });

    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: `pl_${Date.now()}`,
      notes: { user_id: req.user!.id },
    });

    const { data: order, error: insertErr } = await supabase
      .from('orders')
      .insert({
        user_id: req.user!.id,
        items,
        amount,
        status: 'pending',
        payment_method: body.payment_method,
        razorpay_order_id: rzpOrder.id,
        shipping_address: body.shipping_address,
      })
      .select('id')
      .single();
    if (insertErr) throw insertErr;

    res.json({
      orderId: order.id,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount, // paise
      currency: rzpOrder.currency,
      keyId: env.razorpayKeyId,
      customer: { name: body.shipping_address.full_name, email: req.user!.email, contact: body.shipping_address.phone },
    });
  }),
);

/** Mark the order paid + decrement stock. Refunds automatically if stock ran out meanwhile. */
async function fulfil(razorpayOrderId: string, paymentId: string) {
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, status')
    .eq('razorpay_order_id', razorpayOrderId)
    .maybeSingle();
  if (error) throw error;
  if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
  if (order.status !== 'pending') return order.id; // already processed (e.g. by webhook)

  const { error: rpcErr } = await supabase.rpc('fulfil_order', { p_order_id: order.id, p_payment_id: paymentId });
  if (rpcErr) {
    await supabase.from('orders').update({ status: 'failed', razorpay_payment_id: paymentId }).eq('id', order.id);
    await razorpay.payments.refund(paymentId, {}).catch((e) => console.error('Refund failed', e));
    throw Object.assign(new Error(`${rpcErr.message}. Your payment will be refunded.`), { status: 409 });
  }
  return order.id;
}

const verifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/** Step 2: verify the signature Razorpay Checkout returns to the browser. */
paymentsRouter.post(
  '/verify',
  requireAuth,
  ah(async (req, res) => {
    const body = verifySchema.parse(req.body);
    const expected = crypto
      .createHmac('sha256', env.razorpayKeySecret)
      .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
      .digest('hex');
    if (!safeEqual(expected, body.razorpay_signature))
      return res.status(400).json({ error: 'Payment verification failed' });

    const { data: owner } = await supabase
      .from('orders')
      .select('user_id')
      .eq('razorpay_order_id', body.razorpay_order_id)
      .maybeSingle();
    if (owner?.user_id !== req.user!.id) return res.status(403).json({ error: 'Not your order' });

    const orderId = await fulfil(body.razorpay_order_id, body.razorpay_payment_id);
    res.json({ ok: true, orderId });
  }),
);

/**
 * Optional backup: Razorpay webhook (Dashboard → Webhooks → event "payment.captured").
 * Mounted with express.raw() in index.ts because the signature is over the raw body.
 */
export async function razorpayWebhook(req: Request, res: Response) {
  if (!env.razorpayWebhookSecret) return res.status(501).json({ error: 'Webhook secret not configured' });
  const signature = req.header('x-razorpay-signature') ?? '';
  const raw = req.body as Buffer;
  const expected = crypto.createHmac('sha256', env.razorpayWebhookSecret).update(raw).digest('hex');
  if (!safeEqual(expected, signature)) return res.status(400).json({ error: 'Invalid signature' });

  const event = JSON.parse(raw.toString('utf8'));
  if (event.event === 'payment.captured') {
    const payment = event.payload?.payment?.entity;
    if (payment?.order_id) {
      try {
        await fulfil(payment.order_id, payment.id);
      } catch (e) {
        console.error('Webhook fulfil error', e);
      }
    }
  }
  res.json({ ok: true });
}
