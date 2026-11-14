import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { formatDate, formatPrice, PAYMENT_LABEL } from '../lib/format';
import { useAsync } from '../lib/useAsync';
import { ProductImage } from '../components/ProductImage';

export default function Orders() {
  const { data, loading, error } = useAsync(() => api.myOrders());

  return (
    <div className="container narrow section">
      <h1>My orders</h1>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error">{error}</p>}
      {data && data.length === 0 && (
        <div className="empty-state">
          <p>You haven't placed any orders yet.</p>
          <Link to="/shop" className="btn">
            Start shopping
          </Link>
        </div>
      )}
      <div className="order-list">
        {data?.map((o) => (
          <article key={o.id} className="card order-card">
            <header>
              <div>
                <strong>#{o.id.slice(0, 8).toUpperCase()}</strong>
                <span className="muted small"> · {formatDate(o.created_at)}</span>
              </div>
              <span className={`status status-${o.status}`}>{o.status}</span>
            </header>
            <ul className="order-items">
              {o.items.map((i) => (
                <li key={i.product_id}>
                  <span className="order-thumb">
                    <ProductImage src={i.image_url} alt={i.name} />
                  </span>
                  <span>
                    {i.name} <span className="muted">× {i.quantity}</span>
                  </span>
                  <span>{formatPrice(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <footer>
              <span className="muted small">{PAYMENT_LABEL[o.payment_method ?? ''] ?? ''}</span>
              <strong>{formatPrice(o.amount)}</strong>
            </footer>
            {o.status === 'failed' && (
              <p className="error small">Payment received but an item went out of stock — a refund has been initiated.</p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
