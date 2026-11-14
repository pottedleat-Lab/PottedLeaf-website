import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { CATEGORIES } from '../lib/categories';
import { CONTACT, MAPS_URL } from '../lib/contact';
import { Logo } from './Logo';

export function Layout() {
  const { session, me, isAdmin, signOut } = useAuth();
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/shop?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <>
      <div className="announce">Free delivery on every order · Healthy-plant guarantee</div>
      <header className="site-header">
        <div className="container header-row">
          <button className="icon-btn menu-toggle" aria-label="Menu" onClick={() => setMenuOpen((o) => !o)}>
            <span className="burger" />
          </button>
          <Link to="/" className="brand">
            <Logo />
            <span>PottedLeaf</span>
          </Link>

          <form className="header-search" onSubmit={search} role="search">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search plants, pots, tools…" />
          </form>

          <div className="header-actions">
            {session ? (
              <div className="account">
                <button className="link-btn">Hi, {me?.fullName?.split(' ')[0] || 'there'} ▾</button>
                <div className="account-menu">
                  {isAdmin && <Link to="/admin">Admin dashboard</Link>}
                  <Link to="/orders">My orders</Link>
                  <button onClick={() => signOut().then(() => navigate('/'))}>Log out</button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="link-btn">
                Log in
              </Link>
            )}
            <Link to="/cart" className="cart-btn" aria-label={`Cart, ${count} items`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 7h12l-1.2 12.1a1 1 0 0 1-1 .9H8.2a1 1 0 0 1-1-.9z" />
                <path d="M9 7a3 3 0 0 1 6 0" />
              </svg>
              {count > 0 && <span className="badge">{count}</span>}
            </Link>
          </div>
        </div>

        <nav className={`main-nav ${menuOpen ? 'open' : ''}`}>
          <div className="container nav-row">
            <NavLink to="/" end>
              Home
            </NavLink>
            <div className="nav-dropdown">
              <NavLink to="/shop">Shop ▾</NavLink>
              <div className="dropdown-panel">
                {CATEGORIES.map((c) => (
                  <Link key={c.slug} to={`/shop/${c.slug}`}>
                    <span>{c.icon}</span> {c.name}
                  </Link>
                ))}
              </div>
            </div>
            <NavLink to="/shop/office-plants">Office</NavLink>
            <NavLink to="/shop/flower-plants">Flowering</NavLink>
            <NavLink to="/shop/pots">Pots</NavLink>
            <NavLink to="/vlogs">Vlogs</NavLink>
            <NavLink to="/gallery">Gallery</NavLink>
            <NavLink to="/feedback">Feedback</NavLink>
            <NavLink to="/about">About</NavLink>
            {isAdmin && (
              <NavLink to="/admin" className="nav-admin">
                Admin
              </NavLink>
            )}
          </div>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <Link to="/" className="brand light">
              <Logo />
              <span>PottedLeaf</span>
            </Link>
            <p className="muted-light">
              Nursery-grown plants, handcrafted pots and honest advice — delivered carefully to your door.
            </p>
            <address className="footer-contact">
              {CONTACT.name}
              <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
              <a href={`tel:${CONTACT.phoneHref}`}>{CONTACT.phone}</a>
              <a href={MAPS_URL} target="_blank" rel="noreferrer">
                {CONTACT.address}
              </a>
            </address>
          </div>
          <div>
            <h4>Shop</h4>
            {CATEGORIES.slice(0, 5).map((c) => (
              <Link key={c.slug} to={`/shop/${c.slug}`}>
                {c.name}
              </Link>
            ))}
          </div>
          <div>
            <h4>More</h4>
            <Link to="/shop/pots">Pots & Planters</Link>
            <Link to="/shop/tools">Tools</Link>
            <Link to="/shop/seeds">Seeds</Link>
          </div>
          <div>
            <h4>Explore</h4>
            <Link to="/vlogs">Vlogs</Link>
            <Link to="/gallery">Gallery</Link>
            <Link to="/feedback">Customer feedback</Link>
            <Link to="/about">About & contact</Link>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} PottedLeaf</span>
          <span>Secure payments by Razorpay · UPI · Cards</span>
        </div>
      </footer>
    </>
  );
}
