import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAsync } from '../lib/useAsync';

export default function Gallery() {
  const { data, loading, error } = useAsync(() => api.gallery());
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null || !data) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') setOpen((i) => (i! + 1) % data.length);
      if (e.key === 'ArrowLeft') setOpen((i) => (i! - 1 + data.length) % data.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, data]);

  const current = open !== null ? data?.[open] : null;

  return (
    <div className="container section">
      <div className="page-intro">
        <span className="eyebrow">Moments from the nursery & your homes</span>
        <h1>Gallery</h1>
      </div>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error">{error}</p>}
      {data && data.length === 0 && <p className="empty-state">Photos coming soon.</p>}
      <div className="masonry">
        {data?.map((g, i) => (
          <button key={g.id} className="masonry-item" onClick={() => setOpen(i)}>
            <img src={g.image_url} alt={g.caption ?? 'Gallery photo'} loading="lazy" />
            {g.caption && <span className="masonry-caption">{g.caption}</span>}
          </button>
        ))}
      </div>

      {current && (
        <div className="lightbox" onClick={() => setOpen(null)} role="dialog" aria-modal="true">
          <button className="lightbox-close" aria-label="Close">
            ×
          </button>
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={current.image_url} alt={current.caption ?? ''} />
            {current.caption && <figcaption>{current.caption}</figcaption>}
          </figure>
        </div>
      )}
    </div>
  );
}
