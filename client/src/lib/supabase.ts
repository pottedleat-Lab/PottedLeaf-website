import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  console.warn('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing — copy client/.env.example to client/.env');
}

// The browser uses Supabase only for authentication. All data goes through the backend API.
export const supabase = createClient(url || 'http://localhost:54321', anonKey || 'missing-anon-key');
