import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { CATEGORIES } from '../lib/categories.js';
import { ah } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';

export const publicRouter = Router();

// ── Products ──────────────────────────────────
publicRouter.get(
  '/products',
  ah(async (req, res) => {
    const category = typeof req.query.category === 'string' ? req.query.category : '';
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const sort = typeof req.query.sort === 'string' ? req.query.sort : 'newest';
    const limit = Math.min(Number(req.query.limit) || 200, 200);

    let query = supabase.from('products').select('*').eq('is_active', true).limit(limit);
    if (category && (CATEGORIES as readonly string[]).includes(category)) query = query.eq('category', category);
    if (q) query = query.ilike('name', `%${q.replace(/[%_,()]/g, '')}%`);
    if (sort === 'price-asc') query = query.order('price', { ascending: true });
    else if (sort === 'price-desc') query = query.order('price', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  }),
);

publicRouter.get(
  '/products/:id',
  ah(async (req, res) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Product not found' });
    res.json(data);
  }),
);

// ── Gallery & vlogs ───────────────────────────
publicRouter.get(
  '/gallery',
  ah(async (_req, res) => {
    const { data, error } = await supabase.from('gallery_images').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  }),
);

publicRouter.get(
  '/vlogs',
  ah(async (_req, res) => {
    const { data, error } = await supabase.from('vlogs').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  }),
);

// ── Feedback ──────────────────────────────────
publicRouter.get(
  '/feedback',
  ah(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 100, 200);
    const { data, error } = await supabase
      .from('feedback')
      .select('id, name, rating, message, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    res.json(data);
  }),
);

const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  message: z.string().trim().min(3).max(1000),
  name: z.string().trim().max(80).optional(),
});

publicRouter.post(
  '/feedback',
  requireAuth,
  ah(async (req, res) => {
    const body = feedbackSchema.parse(req.body);
    const name = body.name || req.user!.fullName || req.user!.email?.split('@')[0] || 'Customer';
    const { data, error } = await supabase
      .from('feedback')
      .insert({ user_id: req.user!.id, name, rating: body.rating, message: body.message })
      .select('id, name, rating, message, created_at')
      .single();
    if (error) throw error;
    res.status(201).json(data);
  }),
);

// ── Current user & own orders ─────────────────
publicRouter.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

publicRouter.get(
  '/orders/mine',
  requireAuth,
  ah(async (req, res) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', req.user!.id)
      .neq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  }),
);

publicRouter.get(
  '/orders/:id',
  requireAuth,
  ah(async (req, res) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Order not found' });
    res.json(data);
  }),
);
