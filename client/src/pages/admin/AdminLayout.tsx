import { NavLink, Outlet } from 'react-router-dom';

const TABS = [
  { to: '/admin', label: '＋ Add product', end: true },
  { to: '/admin/inventory', label: 'Inventory' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/gallery', label: 'Gallery' },
  { to: '/admin/vlogs', label: 'Vlogs' },
  { to: '/admin/feedback', label: 'Feedback' },
];

export default function AdminLayout() {
  return (
    <div className="container section admin">
      <div className="admin-head">
        <h1>Admin dashboard</h1>
        <span className="eyebrow">Changes go live on the website instantly</span>
      </div>
      <nav className="admin-tabs">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end}>
            {t.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
