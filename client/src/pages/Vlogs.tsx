import { api } from '../lib/api';
import { formatDate, youtubeEmbed } from '../lib/format';
import { useAsync } from '../lib/useAsync';

export default function Vlogs() {
  const { data, loading, error } = useAsync(() => api.vlogs());

  return (
    <div className="container section">
      <div className="page-intro">
        <span className="eyebrow">From our nursery</span>
        <h1>Vlogs</h1>
        <p className="muted">Plant-care walkthroughs, repotting guides and behind-the-scenes from thePottedLeaf greenhouse.</p>
      </div>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error">{error}</p>}
      {data && data.length === 0 && <p className="empty-state">No vlogs yet — check back soon.</p>}
      <div className="vlog-grid">
        {data?.map((v) => {
          const embed = youtubeEmbed(v.video_url);
          return (
            <article key={v.id} className="vlog-card">
              <div className="video-frame">
                {embed ? (
                  <iframe
                    src={embed}
                    title={v.title}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <a href={v.video_url} target="_blank" rel="noreferrer" className="video-link">
                    ▶ Watch video
                  </a>
                )}
              </div>
              <div className="vlog-body">
                <span className="muted small">{formatDate(v.created_at)}</span>
                <h3>{v.title}</h3>
                {v.description && <p>{v.description}</p>}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
