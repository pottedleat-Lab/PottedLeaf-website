import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { ZodError } from 'zod';
import { env } from './lib/env.js';
import { publicRouter } from './routes/public.js';
import { adminRouter } from './routes/admin.js';
import { paymentsRouter, razorpayWebhook } from './routes/payments.js';

const app = express();

// CLIENT_URL may list several sites, comma-separated; a trailing "/" is ignored
app.use(cors({ origin: env.clientUrl.split(',').map((s) => s.trim().replace(/\/+$/, '')).filter(Boolean) }));

// Webhook needs the raw body for signature verification — register before express.json()
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  razorpayWebhook(req, res).catch(next);
});

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', publicRouter);
app.use('/api/admin', adminRouter);
app.use('/api/payments', paymentsRouter);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// Central error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    const first = err.issues[0];
    return res.status(400).json({ error: `${first.path.join('.') || 'input'}: ${first.message}` });
  }
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be under 5 MB' : err.message;
    return res.status(400).json({ error: msg });
  }
  const e = err as { status?: number; statusCode?: number; message?: string; error?: { description?: string } };
  const status = e.status ?? e.statusCode ?? 500;
  // Razorpay SDK errors carry { error: { description } }
  const message = e.error?.description ?? e.message ?? 'Something went wrong';
  if (status >= 500) console.error(err);
  res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
});

app.listen(env.port, () => {
  console.log(`PottedLeaf API running on http://localhost:${env.port}`);
});
