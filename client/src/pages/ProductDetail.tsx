import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { categoryName } from '../lib/categories';
import { formatPrice } from '../lib/format';
import { useAsync } from '../lib/useAsync';
import { useCart } from '../context/CartContext';
import { ProductImage } from '../components/ProductImage';
import { ProductGrid } from '../components/ProductCard';

export default function ProductDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { add, items } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const { data: p, loading, error } = useAsync(() => api.product(id), [id]);
  const related = useAsync(
    async () => (p ? (await api.products({ category: p.category, limit: 5 })).filter((x) => x.id !== p.id).slice(0, 4) : []),
    [p?.id],
  );

  if (loading) return <div className="page-loading">Loading…</div>;
  if (error || !p)
    return (
      <div className="container narrow empty-state">
        <h1>Product not found</h1>
        <Link to="/shop" className="btn">
          Back to shop
        </Link>
      </div>
    );

  const inCart = items.find((i) => i.product_id === p.id)?.quantity ?? 0;
  const available = Math.max(0, p.quantity - inCart);
  const soldOut = p.quantity <= 0;

  const addToCart = (goToCart = false) => {
    add(p, qty);
    setAdded(true);
    setQty(1);
    if (goToCart) navigate('/cart');
  };

  return (
    <div className="container section">
      <nav className="breadcrumb">
        <Link to="/shop">Shop</Link> / <Link to={`/shop/${p.category}`}>{categoryName(p.category)}</Link> /{' '}
        <span>{p.name}</span>
      </nav>

      <div className="pdp">
        <div className="pdp-img">
          <ProductImage src={p.image_url} alt={p.name} />
        </div>
        <div className="pdp-info">
          <span className="eyebrow">{categoryName(p.category)}</span>
          <h1>{p.name}</h1>
          <p className="pdp-price">{formatPrice(p.price)}</p>
          <p className={`stock ${soldOut ? 'out' : p.quantity <= 5 ? 'low' : ''}`}>
            {soldOut ? 'Out of stock' : p.quantity <= 5 ? `Hurry — only ${p.quantity} left` : 'In stock'}
          </p>

          {!soldOut && (
            <div className="pdp-buy">
              <div className="qty">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">
                  −
                </button>
                <span>{qty}</span>
                <button onClick={() => setQty((q) => Math.min(available, q + 1))} aria-label="Increase" disabled={qty >= available}>
                  +
                </button>
              </div>
              <button className="btn btn-lg" disabled={available <= 0} onClick={() => addToCart()}>
                Add to cart
              </button>
              <button className="btn btn-lg btn-ghost" disabled={available <= 0} onClick={() => addToCart(true)}>
                Buy now
              </button>
            </div>
          )}
          {added && (
            <p className="success small">
              Added to cart. <Link to="/cart">View cart →</Link>
            </p>
          )}
          {inCart > 0 && available <= 0 && <p className="muted small">You have all available stock in your cart.</p>}

          <div className="pdp-bio">
            <h3>About this {p.category === 'tools' ? 'tool' : p.category === 'pots' ? 'pot' : 'plant'}</h3>
            <p>{p.bio || 'No description yet.'}</p>
          </div>
          <ul className="pdp-perks">
            <li>🌿 Ships healthy, or we replace it</li>
            <li>📦 Secure, breathable packaging</li>
            <li>💳 Pay with UPI QR, credit or debit card</li>
          </ul>
        </div>
      </div>

      {related.data && related.data.length > 0 && (
        <section className="section">
          <h2>You may also like</h2>
          <ProductGrid products={related.data} />
        </section>
      )}
    </div>
  );
}
