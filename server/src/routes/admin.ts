import { Router } from 'express';
import { z } from 'zod';
import { removeByPublicUrl, supabase, uploadPublic } from '../lib/supabase.js';
import { CATEGORIES } from '../lib/categories.js';
import { imageUpload } from '../lib/upload.js';
import { ah } from '../middleware/asyncHandler.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

// ── Products ──────────────────────────────────
adminRouter.get(
  '/products',
  ah(async (_req, res) => {
    // includes hidden products
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  }),
);

const newProductSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.enum(CATEGORIES),
  price: z.coerce.number().min(0),
  quantity: z.coerce.number().int().min(0),
  bio: z.string().trim().max(2000).default(''),
});

adminRouter.post(
  '/products',
  imageUpload.single('image'),
  ah(async (req, res) => {
    const body = newProductSchema.parse(req.body);
    if (!req.file) return res.status(400).json({ error: 'Please add a picture of the item' });
    const { url } = await uploadPublic('product-images', req.file);
    const { data, error } = await supabase
      .from('products')
      .insert({ ...body, image_url: url })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  }),
);

const patchProductSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    category: z.enum(CATEGORIES),
    price: z.coerce.number().min(0),
    quantity: z.coerce.number().int().min(0),
    bio: z.string().trim().max(2000),
    is_active: z.boolean(),
  })
  .partial();

adminRouter.patch(
  '/products/:id',
  ah(async (req, res) => {
    const body = patchProductSchema.parse(req.body);
    const { data, error } = await supabase.from('products').update(body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  }),
);

// Replace a product's picture
adminRouter.put(
  '/products/:id/image',
  imageUpload.single('image'),
  ah(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    const { data: old } = await supabase.from('products').select('image_url').eq('id', req.params.id).maybeSingle();
    const { url } = await uploadPublic('product-images', req.file);
    const { data, error } = await supabase
      .from('products')
      .update({ image_url: url })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    await removeByPublicUrl('product-images', old?.image_url).catch(() => {});
    res.json(data);
  }),
);

adminRouter.delete(
  '/products/:id',
  ah(async (req, res) => {
    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id)
      .select('image_url')
      .maybeSingle();
    if (error) throw error;
    await removeByPublicUrl('product-images', data?.image_url).catch(() => {});
    res.status(204).end();
  }),
);

// ── Gallery ───────────────────────────────────
adminRouter.post(
  '/gallery',
  imageUpload.array('images', 20),
  ah(async (req, res) => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (!files.length) return res.status(400).json({ error: 'Select at least one image' });
    const caption = typeof req.body.caption === 'string' ? req.body.caption.trim().slice(0, 200) : '';
    const rows = [];
    for (const f of files) {
      const { url, path } = await uploadPublic('gallery', f);
      rows.push({ image_url: url, storage_path: path, caption: caption || null });
    }
    const { data, error } = await supabase.from('gallery_images').insert(rows).select();
    if (error) throw error;
    res.status(201).json(data);
  }),
);

adminRouter.delete(
  '/gallery/:id',
  ah(async (req, res) => {
    const { data, error } = await supabase
      .from('gallery_images')
      .delete()
      .eq('id', req.params.id)
      .select('storage_path')
      .maybeSingle();
    if (error) throw error;
    if (data?.storage_path) await supabase.storage.from('gallery').remove([data.storage_path]);
    res.status(204).end();
  }),
);

// ── Vlogs ─────────────────────────────────────
const vlogSchema = z.object({
  title: z.string().trim().min(2).max(150),
  video_url: z.string().trim().url(),
  description: z.string().trim().max(3000).default(''),
});

adminRouter.post(
  '/vlogs',
  ah(async (req, res) => {
    const body = vlogSchema.parse(req.body);
    const { data, error } = await supabase.from('vlogs').insert(body).select().single();
    if (error) throw error;
    res.status(201).json(data);
  }),
);

adminRouter.delete(
  '/vlogs/:id',
  ah(async (req, res) => {
    const { error } = await supabase.from('vlogs').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(204).end();
  }),
);

// ── Feedback moderation ───────────────────────
adminRouter.delete(
  '/feedback/:id',
  ah(async (req, res) => {
    const { error } = await supabase.from('feedback').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(204).end();
  }),
);

// ── Orders ────────────────────────────────────
adminRouter.get(
  '/orders',
  ah(async (_req, res) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .neq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw error;
    res.json(data);
  }),
);

adminRouter.patch(
  '/orders/:id',
  ah(async (req, res) => {
    const { status } = z.object({ status: z.enum(['paid', 'shipped', 'delivered']) }).parse(req.body);
    const { data, error } = await supabase.from('orders').update({ status }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  }),
);
