import { useState } from 'react';
import { api } from '../../lib/api';
import { useAsync } from '../../lib/useAsync';

export default function AdminGallery() {
  const { data, loading, error, setData } = useAsync(() => api.gallery());
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.length) return;
    setBusy(true);
    setMsg(null);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('images', f));
      if (caption.trim()) fd.append('caption', caption.trim());
      const added = await api.admin.uploadGallery(fd);
      setData([...added, ...(data ?? [])]);
      setFiles([]);
      setCaption('');
      (e.target as HTMLFormElement).reset();
      setMsg({ ok: true, text: `${added.length} photo${added.length > 1 ? 's' : ''} uploaded.` });
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this photo?')) return;
    try {
      await api.admin.deleteGallery(id);
      setData((data ?? []).filter((g) => g.id !== id));
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    }
  };

  return (
    <div className="card">
      <h2>Gallery</h2>
      <form className="inline-form" onSubmit={upload}>
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple required onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
        <input placeholder="Caption (optional)" value={caption} maxLength={200} onChange={(e) => setCaption(e.target.value)} />
        <button className="btn" disabled={busy || !files.length}>
          {busy ? 'Uploading…' : `Upload${files.length ? ` ${files.length}` : ''}`}
        </button>
      </form>
      {msg && <p className={msg.ok ? 'success' : 'error'}>{msg.text}</p>}
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error">{error}</p>}
      <div className="admin-gallery">
        {data?.map((g) => (
          <figure key={g.id}>
            <img src={g.image_url} alt={g.caption ?? ''} loading="lazy" />
            <figcaption>
              <span>{g.caption}</span>
              <button className="link-btn danger" onClick={() => remove(g.id)}>
                Delete
              </button>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
