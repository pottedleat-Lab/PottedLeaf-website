import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';

function useRedirect() {
  const [params] = useSearchParams();
  const r = params.get('redirect') ?? '/';
  return r.startsWith('/') && !r.startsWith('//') ? r : '/';
}

export function Login() {
  const { signIn, session } = useAuth();
  const navigate = useNavigate();
  const redirect = useRedirect();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to={redirect} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
      navigate(redirect, { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <Logo size={44} />
        <h1>Welcome back</h1>
        {redirect === '/checkout' && <p className="notice">Please log in to complete your purchase.</p>}
        <label>
          Email
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-lg btn-block" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
        <p className="muted small center">
          New here? <Link to={`/signup?redirect=${encodeURIComponent(redirect)}`}>Create an account</Link>
        </p>
      </form>
    </div>
  );
}

export function Signup() {
  const { signUp, session } = useAuth();
  const navigate = useNavigate();
  const redirect = useRedirect();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to={redirect} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { needsConfirmation } = await signUp(email, password, fullName);
      if (needsConfirmation) setInfo('Check your email to confirm your account, then log in.');
      else navigate(redirect, { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <Logo size={44} />
        <h1>Create your account</h1>
        <label>
          Full name
          <input required autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </label>
        <label>
          Email
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
        {info && <p className="success">{info}</p>}
        <button className="btn btn-lg btn-block" disabled={busy}>
          {busy ? 'Creating account…' : 'Sign up'}
        </button>
        <p className="muted small center">
          Already have an account? <Link to={`/login?redirect=${encodeURIComponent(redirect)}`}>Log in</Link>
        </p>
      </form>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="container narrow empty-state section">
      <h1>Page not found</h1>
      <p className="muted">This page seems to have wilted.</p>
      <Link to="/" className="btn">
        Go home
      </Link>
    </div>
  );
}
