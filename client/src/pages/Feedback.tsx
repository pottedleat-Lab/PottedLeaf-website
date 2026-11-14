import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { formatDate } from '../lib/format';
import { useAsync } from '../lib/useAsync';
import { useAuth } from '../context/AuthContext';
import { Stars, StarInput } from '../components/Stars';

export default function FeedbackPage() {
  const { session, me } = useAuth();
  const { data, loading, error, setData } = useAsync(() => api.feedback());
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [formMsg, setFormMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const avg = data && data.length ? data.reduce((s, f) => s + f.rating, 0) / data.length : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormMsg(null);
    try {
      const created = await api.postFeedback({ rating, message, name: name.trim() || undefined });
      setData([created, ...(data ?? [])]);
      setMessage('');
      setFormMsg({ ok: true, text: 'Thank you for your feedback!' });
    } catch (err) {
      setFormMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container section">
      <div className="page-intro">
        <span className="eyebrow">Real words from real plant parents</span>
        <h1>Customer feedback</h1>
        {data && data.length > 0 && (
          <p className="rating-summary">
            <Stars value={Math.round(avg)} /> <strong>{avg.toFixed(1)}</strong>{' '}
            <span className="muted">from {data.length} reviews</span>
          </p>
        )}
      </div>

      <div className="feedback-layout">
        <aside className="card feedback-form">
          <h3>Share your experience</h3>
          {session ? (
            <form onSubmit={submit}>
              <StarInput value={rating} onChange={setRating} />
              <label>
                Display name
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder={me?.fullName || 'Your name'} maxLength={80} />
              </label>
              <label>
                Your feedback
                <textarea required minLength={3} maxLength={1000} rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />
              </label>
              {formMsg && <p className={formMsg.ok ? 'success' : 'error'}>{formMsg.text}</p>}
              <button className="btn btn-block" disabled={busy}>
                {busy ? 'Posting…' : 'Post feedback'}
              </button>
            </form>
          ) : (
            <p>
              <Link to="/login?redirect=/feedback">Log in</Link> to leave feedback.
            </p>
          )}
        </aside>

        <section>
          {loading && <p className="muted">Loading…</p>}
          {error && <p className="error">{error}</p>}
          {data && data.length === 0 && <p className="muted">No feedback yet. Be the first!</p>}
          <div className="feedback-wall">
            {data?.map((f) => (
              <blockquote key={f.id} className="feedback-card">
                <div className="feedback-top">
                  <span className="avatar">{f.name.charAt(0).toUpperCase()}</span>
                  <div>
                    <cite>{f.name}</cite>
                    <span className="muted small">{formatDate(f.created_at)}</span>
                  </div>
                  <Stars value={f.rating} />
                </div>
                <p>{f.message}</p>
              </blockquote>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
