import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { formatPrice } from '../lib/format';
import type { PaymentMethod, ShippingAddress } from '../lib/types';
import { ProductImage } from '../components/ProductImage';

// Razorpay Checkout is loaded from index.html
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: any) => void) => void };
  }
}

const METHODS: { id: PaymentMethod; title: string; desc: string; icon: string; instrument: Record<string, unknown> }[] = [
  { id: 'upi_qr', title: 'UPI QR code', desc: 'Scan with GPay, PhonePe, Paytm or any UPI app', icon: '▦', instrument: { method: 'upi', flows: ['qr'] } },
  { id: 'credit_card', title: 'Credit card', desc: 'Visa, Mastercard, RuPay, Amex', icon: '💳', instrument: { method: 'card', types: ['credit'] } },
  { id: 'debit_card', title: 'Debit card', desc: 'Visa, Mastercard, RuPay', icon: '🏧', instrument: { method: 'card', types: ['debit'] } },
];

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Lakshadweep', 'Puducherry',
];

const ADDR_KEY = 'pottedleaf-address';

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { me } = useAuth();
  const navigate = useNavigate();
  const [method, setMethod] = useState<PaymentMethod>('upi_qr');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addr, setAddr] = useState<ShippingAddress>(() => {
    try {
      const saved = localStorage.getItem(ADDR_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    return { full_name: me?.fullName ?? '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' };
  });

  if (items.length === 0)
    return (
      <div className="container narrow empty-state section">
        <h1>Nothing to check out</h1>
        <Link to="/shop" className="btn">
          Go shopping
        </Link>
      </div>
    );

  const field = (k: keyof ShippingAddress) => ({
    value: addr[k] ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setAddr({ ...addr, [k]: e.target.value }),
  });

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!window.Razorpay) {
      setError('Payment system failed to load. Check your internet connection and refresh.');
      return;
    }
    setBusy(true);
    try {
      try {
        localStorage.setItem(ADDR_KEY, JSON.stringify(addr));
      } catch {
        /* ignore */
      }
      const order = await api.createOrder({
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        payment_method: method,
        shipping_address: addr,
      });
      const chosen = METHODS.find((m) => m.id === method)!;

      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.razorpayOrderId,
        amount: order.amount,
        currency: order.currency,
        name: 'thePottedLeaf',
        description: `Order of ${items.length} item${items.length > 1 ? 's' : ''}`,
        prefill: order.customer,
        theme: { color: '#2f5d45' },
        // Show only the method the customer picked on our page
        config: {
          display: {
            blocks: { chosen: { name: chosen.title, instruments: [chosen.instrument] } },
            sequence: ['block.chosen'],
            preferences: { show_default_blocks: false },
          },
        },
        handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const result = await api.verifyPayment(resp);
            clear();
            navigate(`/order-success/${result.orderId}`, { replace: true });
          } catch (err) {
            setError((err as Error).message);
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.on('payment.failed', (r) => {
        setError(r?.error?.description ?? 'Payment failed. Please try again.');
        setBusy(false);
      });
      rzp.open();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="container section">
      <h1>Checkout</h1>
      <form className="checkout-layout" onSubmit={pay}>
        <div className="checkout-main">
          <fieldset className="card">
            <legend>1. Delivery address</legend>
            <div className="form-grid">
              <label>
                Full name
                <input required minLength={2} {...field('full_name')} />
              </label>
              <label>
                Mobile number
                <input required pattern="[6-9][0-9]{9}" inputMode="numeric" maxLength={10} title="10-digit mobile number" {...field('phone')} />
              </label>
              <label className="span-2">
                House / flat, street
                <input required minLength={3} {...field('line1')} />
              </label>
              <label className="span-2">
                Area, landmark (optional)
                <input {...field('line2')} />
              </label>
              <label>
                City
                <input required {...field('city')} />
              </label>
              <label>
                State
                <select required {...field('state')}>
                  <option value="">Select state</option>
                  {STATES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Pincode
                <input required pattern="[0-9]{6}" inputMode="numeric" maxLength={6} title="6-digit pincode" {...field('pincode')} />
              </label>
            </div>
          </fieldset>

          <fieldset className="card">
            <legend>2. Payment method</legend>
            <div className="pay-options">
              {METHODS.map((m) => (
                <label key={m.id} className={`pay-option ${method === m.id ? 'selected' : ''}`}>
                  <input type="radio" name="method" checked={method === m.id} onChange={() => setMethod(m.id)} />
                  <span className="pay-icon">{m.icon}</span>
                  <span>
                    <strong>{m.title}</strong>
                    <small>{m.desc}</small>
                  </span>
                </label>
              ))}
            </div>
            <p className="muted small">🔒 Payments are processed securely by Razorpay. We never see your card details.</p>
          </fieldset>
        </div>

        <aside className="summary">
          <h3>Your order</h3>
          <ul className="summary-items">
            {items.map((i) => (
              <li key={i.product_id}>
                <span className="summary-thumb">
                  <ProductImage src={i.image_url} alt={i.name} />
                  <em>{i.quantity}</em>
                </span>
                <span className="summary-name">{i.name}</span>
                <span>{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="summary-row">
            <span>Delivery</span>
            <span>Free</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {error && <p className="error">{error}</p>}
          <button className="btn btn-lg btn-block" disabled={busy}>
            {busy ? 'Processing…' : `Pay ${formatPrice(subtotal)}`}
          </button>
        </aside>
      </form>
    </div>
  );
}
