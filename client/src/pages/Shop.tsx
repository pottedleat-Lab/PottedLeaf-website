import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { CATEGORIES } from '../lib/categories';
import { useAsync } from '../lib/useAsync';
import { ProductGrid } from '../components/ProductCard';

export default function Shop() {
  const { category = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const sort = params.get('sort') ?? 'newest';
  const [search, setSearch] = useState(q);
  useEffect(() => setSearch(q), [q]);

  const current = CATEGORIES.find((c) => c.slug === category);
  const { data, loading, error } = useAsync(() => api.products({ category, q, sort }), [category, q, sort]);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <div className="container section shop-layout">
      <aside className="shop-sidebar">
        <h3>Categories</h3>
        <nav className="category-list">
          <Link to={`/shop${q ? `?q=${encodeURIComponent(q)}` : ''}`} className={!category ? 'active' : ''}>
            All products
          </Link>
          {CATEGORIES.map((c) => (
            <Link key={c.slug} to={`/shop/${c.slug}`} className={category === c.slug ? 'active' : ''}>
              <span>{c.icon}</span> {c.name}
            </Link>
          ))}
        </nav>
      </aside>

      <section>
        <div className="shop-head">
          <div>
            <h1>{current?.name ?? (q ? `Results for “${q}”` : 'All products')}</h1>
            {current && <p className="muted">{current.blurb}</p>}
          </div>
          <div className="shop-controls">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                update('q', search.trim());
              }}
            >
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" />
            </form>
            <select value={sort} onChange={(e) => update('sort', e.target.value)} aria-label="Sort">
              <option value="newest">Newest</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </div>
        </div>

        {/* mobile category chips */}
        <div className="chip-row">
          <Link to="/shop" className={`chip ${!category ? 'active' : ''}`}>
            All
          </Link>
          {CATEGORIES.map((c) => (
            <Link key={c.slug} to={`/shop/${c.slug}`} className={`chip ${category === c.slug ? 'active' : ''}`}>
              {c.name}
            </Link>
          ))}
        </div>

        {loading && <p className="muted">Loading…</p>}
        {error && <p className="error">{error}</p>}
        {data && data.length === 0 && (
          <div className="empty-state">
            <p>Nothing here yet. Check back soon!</p>
          </div>
        )}
        {data && data.length > 0 && (category || q) && (
          <>
            <p className="muted small">{data.length} items</p>
            <ProductGrid products={data} />
          </>
        )}
        {/* "All products": list section-wise, one heading per category */}
        {data &&
          data.length > 0 &&
          !category &&
          !q &&
          CATEGORIES.map((c) => {
            const inCat = data.filter((p) => p.category === c.slug);
            if (!inCat.length) return null;
            return (
              <section key={c.slug} className="shop-section">
                <div className="section-head">
                  <h2>
                    {c.icon} {c.name}
                  </h2>
                  <Link to={`/shop/${c.slug}`} className="text-link">
                    See all {inCat.length} →
                  </Link>
                </div>
                <ProductGrid products={inCat.slice(0, 4)} />
              </section>
            );
          })}
      </section>
    </div>
  );
}
