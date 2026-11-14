import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../lib/format';
import { ProductImage } from '../components/ProductImage';

export default function Cart() {
  const { items, subtotal, setQty, remove } = useCart();
  const { session } = useAuth();
  const navigate = useNavigate();

  if (items.length === 0)
    return (
      <div className="container narrow empty-state section">
        <h1>Your cart is empty</h1>
        <p className="muted">Find something green to take home.</p>
        <Link to="/shop" className="btn btn-lg">
          Start shopping
        </Link>
      </div>
    );

  return (
    <div className="container section">
      <h1>Your cart</h1>
      <div className="cart-layout">
        <div className="cart-items">
          {items.map((i) => (
            <div key={i.product_id} className="cart-row">
              <Link to={`/product/${i.product_id}`} className="cart-thumb">
                <ProductImage src={i.image_url} alt={i.name} />
              </Link>
              <div className="cart-info">
                <Link to={`/product/${i.product_id}`} className="cart-name">
                  {i.name}
                </Link>
                <span className="muted small">{formatPrice(i.price)} each</span>
                <button className="link-btn danger small" onClick={() => remove(i.product_id)}>
                  Remove
                </button>
              </div>
              <div className="qty">
                <button onClick={() => setQty(i.product_id, i.quantity - 1)} disabled={i.quantity <= 1} aria-label="Decrease">
                  −
                </button>
                <span>{i.quantity}</span>
                <button onClick={() => setQty(i.product_id, i.quantity + 1)} disabled={i.quantity >= i.stock} aria-label="Increase">
                  +
                </button>
              </div>
              <strong className="cart-line">{formatPrice(i.price * i.quantity)}</strong>
            </div>
          ))}
        </div>

        <aside className="summary">
          <h3>Order summary</h3>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Delivery</span>
            <span>Free</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <button className="btn btn-lg btn-block" onClick={() => navigate('/checkout')}>
            {session ? 'Proceed to checkout' : 'Log in to checkout'}
          </button>
          <p className="muted small center">UPI QR · Credit card · Debit card</p>
        </aside>
      </div>
    </div>
  );
}
