import { useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { CATEGORIES, categoryName } from '../../lib/categories';
import { formatPrice } from '../../lib/format';
import { useAsync } from '../../lib/useAsync';
import type { Product } from '../../lib/types';
import { ProductImage } from '../../components/ProductImage';

export default function Inventory() {
  const { data, loading, error, setData } = useAsync(() => api.admin.products());
  const [filter, setFilter] = useState('');
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);

  const rows = useMemo(
    () =>
      (data ?? []).filter(
        (p) => (!filter || p.category === filter) && (!q || p.name.toLowerCase().includes(q.toLowerCase())),
      ),
    [data, filter, q],
  );

  const replace = (p: Product) => setData((data ?? []).map((x) => (x.id === p.id ? p : x)));

  const patch = async (id: string, change: Parameters<typeof api.admin.updateProduct>[1]) => {
    setMsg(null);
    try {
      replace(await api.admin.updateProduct(id, change));
    } catch (err) {
      setMsg((err as Error).message);
    }
  };

  const remove = async (p: Product) => {
    if (!confirm(`Delete “${p.name}” permanently?`)) return;
    try {
      await api.admin.deleteProduct(p.id);
      setData((data ?? []).filter((x) => x.id !== p.id));
    } catch (err) {
      setMsg((err as Error).message);
    }
  };

  const changeImage = async (p: Product, file: File | undefined) => {
    if (!file) return;
    try {
      replace(await api.admin.replaceProductImage(p.id, file));
    } catch (err) {
      setMsg((err as Error).message);
    }
  };

  return (
    <div className="card">
      <div className="toolbar">
        <h2>Inventory</h2>
        <input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All sections</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {loading && <p className="muted">Loading…</p>}
      {(error || msg) && <p className="error">{error || msg}</p>}

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Section</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Visible</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className={!p.is_active ? 'row-hidden' : ''}>
                <td>
                  <div className="item-cell">
                    <label className="thumb-edit" title="Change picture">
                      <ProductImage src={p.image_url} alt={p.name} />
                      <input type="file" accept="image/*" hidden onChange={(e) => changeImage(p, e.target.files?.[0])} />
                    </label>
                    <span>{p.name}</span>
                  </div>
                </td>
                <td>{categoryName(p.category)}</td>
                <td>{formatPrice(p.price)}</td>
                <td>
                  <QtyEditor value={p.quantity} onSave={(quantity) => patch(p.id, { quantity })} />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={p.is_active}
                    onChange={(e) => patch(p.id, { is_active: e.target.checked })}
                    aria-label="Visible on website"
                  />
                </td>
                <td className="actions">
                  <button className="link-btn" onClick={() => setEditing(p)}>
                    Edit
                  </button>
                  <button className="link-btn danger" onClick={() => remove(p)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && rows.length === 0 && <p className="muted">No products match.</p>}

      {editing && (
        <EditDialog
          product={editing}
          onClose={() => setEditing(null)}
          onSave={async (change) => {
            await patch(editing.id, change);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function QtyEditor({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(String(value));
  }
  const commit = (v: number) => {
    const n = Math.max(0, Math.floor(v));
    if (Number.isFinite(n) && n !== value) onSave(n);
    else setDraft(String(value));
  };
  return (
    <div className={`qty qty-sm ${value === 0 ? 'qty-zero' : ''}`}>
      <button onClick={() => commit(value - 1)} disabled={value <= 0} aria-label="Remove one">
        −
      </button>
      <input
        type="number"
        min={0}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commit(Number(draft))}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        aria-label="Quantity"
      />
      <button onClick={() => commit(value + 1)} aria-label="Add one">
        +
      </button>
    </div>
  );
}

function EditDialog({
  product,
  onClose,
  onSave,
}: {
  product: Product;
  onClose: () => void;
  onSave: (change: Partial<Product>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: product.name,
    category: product.category,
    price: String(product.price),
    bio: product.bio,
  });
  const [busy, setBusy] = useState(false);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal card"
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          await onSave({ ...form, price: Number(form.price) });
          setBusy(false);
        }}
      >
        <h3>Edit item</h3>
        <label>
          Name
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label>
          Section
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Product['category'] })}>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Cost (₹)
          <input type="number" min={0} step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </label>
        <label>
          Bio
          <textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </label>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
