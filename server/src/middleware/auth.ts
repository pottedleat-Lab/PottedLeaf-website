import type { NextFunction, Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';

export interface AuthUser {
  id: string;
  email?: string;
  role: 'customer' | 'admin';
  fullName: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/** Requires a valid Supabase access token in `Authorization: Bearer <token>`. */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Please log in' });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: 'Session expired, please log in again' });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', data.user.id)
    .maybeSingle();

  req.user = {
    id: data.user.id,
    email: data.user.email,
    role: profile?.role === 'admin' ? 'admin' : 'customer',
    fullName: profile?.full_name || (data.user.user_metadata?.full_name as string) || '',
  };
  next();
}

/** Use after requireAuth. */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
  next();
}
