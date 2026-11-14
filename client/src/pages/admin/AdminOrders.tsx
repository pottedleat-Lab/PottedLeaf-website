import { useState } from 'react';
import { api } from '../../lib/api';
import { formatDate, formatPrice, PAYMENT_LABEL } from '../../lib/format';
import { useAsync } from '../../lib/useAsync';
import type { OrderStatus } from '../../lib/types';

const NEXT: Partial<Record<OrderStatus, 'shipped' | 'delivered'>> = { paid: 'shipped', shipped: 'delivered' };

export default function AdminOrders() {
  const { data, loading, error, setData } = useAsync(() => api.admin.orders());
  const [filter, setFilter] = useState<string>('');
  const [msg, setMsg] = useState<string | null>(null);

  const advance = async (id: string, status: 'shipped' | 'delivered') => {
    try {
      const updated = await api.admin.updateOrderStatus(id, status);
      setData((data ?? []).map((o) => (o.id === id ? updated : o)));
    } catch (err) {
      setMsg((err as Error).message);
    }
  };

  const rows = (data ?? []).filter((o) => !filter || o.status === filter);
  const revenue = (data ?? []).filter((o) => o.status !== 'failed').reduce((s, o) => s + Number(o.amount), 0);

  return (
    <div className="card">
      <div className="toolbar">
        <h2>Orders</h2>
        <span className="muted">
          {data?.length ?? 0} orders · {formatPrice(revenue)} revenue
        </span>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="paid">Paid (to ship)</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="failed">Failed / refunded</option>
        </select>
      </div>
      {loading && <p className="muted">Loading…</p>}
      {(error || msg) && <p className="error">{error || msg}</p>}
      {data && rows.length === 0 && <p className="muted">No orders.</p>}
      <div className="admin-orders">
        {rows.map((o) => {
          const a = o.shipping_address;
          const next = NEXT[o.status];
          return (
            <article key={o.id} className="admin-order">
              <header>
                <strong>#{o.id.slice(0, 8).toUpperCase()}</strong>
                <span className="muted small">{formatDate(o.created_at)}</span>
                <span className={`status status-${o.status}`}>{o.status}</span>
              </header>
              <div className="admin-order-body">
                <ul className="plain-list">
                  {o.items.map((i) => (
                    <li key={i.product_id}>
                      {i.quantity} × {i.name} <span className="muted">({formatPrice(i.price)})</span>
                    </li>
                  ))}
                </ul>
                <address>
                  <strong>{a.full_name}</strong> · {a.phone}
                  <br />
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ''}
                  <br />
                  {a.city}, {a.state} – {a.pincode}
                </address>
              </div>
              <footer>
                <span className="muted small">
                  {PAYMENT_LABEL[o.payment_method ?? ''] ?? ''} · {o.razorpay_payment_id}
                </span>
                <strong>{formatPrice(o.amount)}</strong>
                {next && (
                  <button className="btn btn-sm" onClick={() => advance(o.id, next)}>
                    Mark {next}
                  </button>
                )}
              </footer>
            </article>
          );
        })}
      </div>
    </div>
  );
}
