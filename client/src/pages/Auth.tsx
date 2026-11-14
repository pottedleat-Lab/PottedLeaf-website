import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';

function useRedirect() {
  const [params] = useSearchParams();
  const r = params.get('redirect') ?? '/';
  return r.startsWith('/') && !r.startsWith('//') ? r : '/';
}

/** Error Supabase puts in the URL when a Google sign-in fails or is cancelled. */
function oauthErrorFromUrl(): string | null {
  const read = (s: string) => new URLSearchParams(s).get('error_description');
  const msg = read(window.location.search) ?? read(window.location.hash.replace(/^#/, ''));
  return msg ? `Google sign-in failed: ${msg.replace(/\+/g, ' ')}` : null;
}

function GoogleButton({ redirect, onError }: { redirect: string; onError: (msg: string) => void }) {
  const { signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-lg btn-block btn-google"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await signInWithGoogle(redirect);
        } catch (err) {
          onError((err as Error).message);
          setBusy(false);
        }
      }}
    >
      <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
      </svg>
      {busy ? 'Redirecting to Google…' : 'Continue with Google'}
    </button>
  );
}

function Divider() {
  return (
    <div className="auth-divider">
      <span>or use email</span>
    </div>
  );
}

export function Login() {
  const { signIn, session } = useAuth();
  const navigate = useNavigate();
  const redirect = useRedirect();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(oauthErrorFromUrl);
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
        <GoogleButton redirect={redirect} onError={setError} />
        <Divider />
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
        <GoogleButton redirect={redirect} onError={setError} />
        <Divider />
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
