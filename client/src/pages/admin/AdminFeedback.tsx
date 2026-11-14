import { useState } from 'react';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { useAsync } from '../../lib/useAsync';
import { Stars } from '../../components/Stars';

export default function AdminFeedback() {
  const { data, loading, error, setData } = useAsync(() => api.feedback(200));
  const [msg, setMsg] = useState<string | null>(null);

  const remove = async (id: string) => {
    if (!confirm('Delete this feedback?')) return;
    try {
      await api.admin.deleteFeedback(id);
      setData((data ?? []).filter((f) => f.id !== id));
    } catch (err) {
      setMsg((err as Error).message);
    }
  };

  return (
    <div className="card">
      <h2>Feedback</h2>
      {loading && <p className="muted">Loading…</p>}
      {(error || msg) && <p className="error">{error || msg}</p>}
      {data && data.length === 0 && <p className="muted">No feedback yet.</p>}
      <ul className="admin-list">
        {data?.map((f) => (
          <li key={f.id}>
            <div>
              <strong>{f.name}</strong> <Stars value={f.rating} />
              <p>{f.message}</p>
              <span className="muted small">{formatDate(f.created_at)}</span>
            </div>
            <button className="link-btn danger" onClick={() => remove(f.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
