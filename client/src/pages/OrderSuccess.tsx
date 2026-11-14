import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { formatPrice, PAYMENT_LABEL } from '../lib/format';
import { useAsync } from '../lib/useAsync';

export default function OrderSuccess() {
  const { id = '' } = useParams();
  const { data: order, loading, error } = useAsync(() => api.order(id), [id]);

  if (loading) return <div className="page-loading">Loading…</div>;
  if (error || !order)
    return (
      <div className="container narrow empty-state section">
        <h1>Order not found</h1>
        <Link to="/orders">My orders</Link>
      </div>
    );

  const a = order.shipping_address;
  return (
    <div className="container narrow section success-page">
      <div className="success-mark">✓</div>
      <h1>Thank you! Your order is confirmed.</h1>
      <p className="muted">
        Order #{order.id.slice(0, 8).toUpperCase()} · {formatPrice(order.amount)} paid via{' '}
        {PAYMENT_LABEL[order.payment_method ?? ''] ?? 'Razorpay'}
      </p>
      <div className="card left">
        <h3>Items</h3>
        <ul className="plain-list">
          {order.items.map((i) => (
            <li key={i.product_id}>
              {i.quantity} × {i.name} <span className="muted">— {formatPrice(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <h3>Delivering to</h3>
        <p>
          {a.full_name}, {a.phone}
          <br />
          {a.line1}
          {a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.pincode}
        </p>
      </div>
      <div className="hero-cta center">
        <Link to="/orders" className="btn">
          View my orders
        </Link>
        <Link to="/shop" className="btn btn-ghost">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
