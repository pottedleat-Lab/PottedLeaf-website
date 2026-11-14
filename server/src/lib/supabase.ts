import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { env } from './env.js';

// Service-role client: bypasses RLS. Never expose this key to the browser.
export const supabase = createClient(env.supabaseUrl, env.supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Upload a file buffer to a public bucket and return its public URL + path. */
export async function uploadPublic(bucket: string, file: Express.Multer.File) {
  const ext = (file.originalname.split('.').pop() ?? 'jpg').toLowerCase();
  const path = `${new Date().getFullYear()}/${randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/** Best-effort: given a public URL from our bucket, delete the stored object. */
export async function removeByPublicUrl(bucket: string, url: string | null | undefined) {
  if (!url) return;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  await supabase.storage.from(bucket).remove([url.slice(idx + marker.length)]);
}
