import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { CATEGORIES } from '../../lib/categories';
import type { Product } from '../../lib/types';

export default function AddProduct() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Product | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return setError('Please add a picture of the item');
    setBusy(true);
    setError(null);
    setCreated(null);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set('image', file);
      const p = await api.admin.createProduct(fd);
      setCreated(p);
      formRef.current?.reset();
      setFile(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form ref={formRef} className="card add-product" onSubmit={submit}>
      <h2>Add a new item</h2>
      <div className="add-product-grid">
        <label
          className={`dropzone ${preview ? 'has-img' : ''}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f?.type.startsWith('image/')) setFile(f);
          }}
        >
          {preview ? <img src={preview} alt="Preview" /> : <span>📷<br />Click or drop a picture<br /><small>JPG, PNG, WebP · max 5 MB</small></span>}
          <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>

        <div className="form-stack">
          <label>
            Name
            <input name="name" required minLength={2} maxLength={120} placeholder="e.g. Snake Plant" />
          </label>
          <label>
            Section / category
            <select name="category" required defaultValue="">
              <option value="" disabled>
                Choose…
              </option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="form-row">
            <label>
              Cost (₹)
              <input name="price" type="number" required min={0} step="0.01" placeholder="349" />
            </label>
            <label>
              Quantity
              <input name="quantity" type="number" required min={0} step={1} placeholder="20" />
            </label>
          </div>
          <label>
            Bio
            <textarea name="bio" rows={4} maxLength={2000} placeholder="Care tips, size, light & water needs…" />
          </label>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      {created && (
        <p className="success">
          “{created.name}” is now live on the website. <Link to={`/product/${created.id}`}>View it →</Link>
        </p>
      )}
      <button className="btn btn-lg" disabled={busy}>
        {busy ? 'Uploading…' : 'Add item to store'}
      </button>
    </form>
  );
}
