import { useState } from 'react';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { useAsync } from '../../lib/useAsync';

export default function AdminVlogs() {
  const { data, loading, error, setData } = useAsync(() => api.vlogs());
  const [form, setForm] = useState({ title: '', video_url: '', description: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const v = await api.admin.createVlog(form);
      setData([v, ...(data ?? [])]);
      setForm({ title: '', video_url: '', description: '' });
      setMsg({ ok: true, text: 'Vlog published.' });
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this vlog?')) return;
    try {
      await api.admin.deleteVlog(id);
      setData((data ?? []).filter((v) => v.id !== id));
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    }
  };

  return (
    <div className="card">
      <h2>Vlogs</h2>
      <form className="form-stack" onSubmit={add}>
        <div className="form-row">
          <label>
            Title
            <input required minLength={2} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </label>
          <label>
            YouTube URL
            <input type="url" required placeholder="https://youtu.be/…" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} />
          </label>
        </div>
        <label>
          Description
          <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        <button className="btn" disabled={busy}>
          {busy ? 'Publishing…' : 'Publish vlog'}
        </button>
      </form>
      {msg && <p className={msg.ok ? 'success' : 'error'}>{msg.text}</p>}
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error">{error}</p>}
      <ul className="admin-list">
        {data?.map((v) => (
          <li key={v.id}>
            <div>
              <strong>{v.title}</strong>
              <a href={v.video_url} target="_blank" rel="noreferrer" className="muted small">
                {v.video_url}
              </a>
              <span className="muted small">{formatDate(v.created_at)}</span>
            </div>
            <button className="link-btn danger" onClick={() => remove(v.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
