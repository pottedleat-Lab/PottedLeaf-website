import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Loading() {
  return <div className="page-loading">Loading…</div>;
}

/** Login required (e.g. checkout). Redirects to /login and comes back after. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loading />;
  if (!session) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { session, isAdmin, loading, me } = useAuth();
  const location = useLocation();
  if (loading || (session && !me)) return <Loading />;
  if (!session) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  if (!isAdmin)
    return (
      <div className="container narrow empty-state">
        <h1>Admins only</h1>
        <p>Your account doesn't have admin access.</p>
      </div>
    );
  return <>{children}</>;
}
