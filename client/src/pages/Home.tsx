import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { CATEGORIES } from '../lib/categories';
import { useAsync } from '../lib/useAsync';
import { ProductGrid } from '../components/ProductCard';
import { Stars } from '../components/Stars';

export default function Home() {
  const products = useAsync(() => api.products({ limit: 8 }));
  const feedback = useAsync(() => api.feedback(3));

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Grown in our nursery · Packed by hand</span>
            <h1>
              Bring home a little <em>green</em> that lasts.
            </h1>
            <p>
              Healthy indoor & outdoor plants, breathable clay pots and the tools to keep them thriving — chosen by
              gardeners, delivered safely across India.
            </p>
            <div className="hero-cta">
              <Link to="/shop" className="btn btn-lg">
                Shop all plants
              </Link>
              <Link to="/shop/office-plants" className="btn btn-lg btn-ghost">
                Plants for your desk
              </Link>
            </div>
            <ul className="hero-points">
              <li>🌿 Healthy-plant guarantee</li>
              <li>🚚 Free delivery</li>
              <li>🔒 UPI & card payments</li>
            </ul>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-arch">
              <svg viewBox="0 0 300 360">
                <path d="M150 300C150 200 190 120 260 90c4 90-40 170-110 210z" fill="#2f5d45" />
                <path d="M150 300c-6-80-46-140-116-150-2 80 46 140 116 150z" fill="#6d9a78" />
                <path d="M150 300c0-90-10-160-40-220 50 40 66 130 40 220z" fill="#4b7a5d" />
                <path d="M150 300V140" stroke="#23432f" strokeWidth="4" />
                <path d="M80 290h140l-14 70H94z" fill="#c4663a" />
                <path d="M72 280h156v18H72z" fill="#a9532c" />
              </svg>
            </div>
            <div className="hero-badge">
              <strong>4.8★</strong>
              <span>from happy plant parents</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Shop by category</h2>
            <Link to="/shop" className="text-link">
              View everything →
            </Link>
          </div>
          <div className="category-grid">
            {CATEGORIES.map((c) => (
              <Link key={c.slug} to={`/shop/${c.slug}`} className="category-tile">
                <span className="category-icon">{c.icon}</span>
                <strong>{c.name}</strong>
                <span>{c.blurb}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-tint">
        <div className="container">
          <div className="section-head">
            <h2>New in the nursery</h2>
            <Link to="/shop" className="text-link">
              Shop all →
            </Link>
          </div>
          {products.loading && <p className="muted">Loading plants…</p>}
          {products.error && <p className="error">{products.error}</p>}
          {products.data && <ProductGrid products={products.data} />}
        </div>
      </section>

      <section className="section">
        <div className="container promo-row">
          <div className="promo promo-green">
            <h3>Pots that let roots breathe</h3>
            <p>Hand-thrown terracotta and matte ceramics in every size.</p>
            <Link to="/shop/pots" className="btn btn-light">
              Browse pots
            </Link>
          </div>
          <div className="promo promo-clay">
            <h3>Start a kitchen garden</h3>
            <p>Vegetable seedlings and seeds that grow on any balcony.</p>
            <Link to="/shop/vegetable-plants" className="btn btn-light">
              Grow your own
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-tint">
        <div className="container">
          <div className="section-head">
            <h2>What customers say</h2>
            <Link to="/feedback" className="text-link">
              All feedback →
            </Link>
          </div>
          {feedback.data && feedback.data.length === 0 && (
            <p className="muted">
              No feedback yet — <Link to="/feedback">be the first</Link>.
            </p>
          )}
          <div className="feedback-grid">
            {feedback.data?.map((f) => (
              <blockquote key={f.id} className="feedback-card">
                <Stars value={f.rating} />
                <p>“{f.message}”</p>
                <cite>— {f.name}</cite>
              </blockquote>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
