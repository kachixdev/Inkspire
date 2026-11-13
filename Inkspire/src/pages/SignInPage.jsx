import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';

function SignInPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSigningIn(true);
    setError('');

    try {
      const data = await apiRequest('/users/login', {
        method: 'POST',
        body: JSON.stringify(form)
      });

      if (!data.user) {
        setError('The server did not return the signed-in user.');
        return;
      }

      localStorage.setItem('currentUser', JSON.stringify(data.user));
      window.dispatchEvent(new Event('auth-change'));
      navigate(data.user.role === 'admin' ? '/admin' : '/feed');
    } catch (error) {
      console.error('Error signing in:', error);
      setError(error.message || 'Unable to sign in. Please try again.');
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <section className="page-shell grid min-h-[720px] items-center gap-10 py-14 lg:grid-cols-2">
      <div className="hidden rounded-[2rem] bg-sage p-12 lg:block">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-coral">
          Welcome back
        </p>
        <p className="mt-8 font-display text-5xl leading-tight">
          “Writing is thinking on paper, with the door left open.”
        </p>
      </div>

      <div className="mx-auto w-full max-w-md">
        <p className="text-sm font-semibold text-coral">GOOD TO SEE YOU</p>
        <h1 className="mt-3 font-display text-5xl">Sign in to Inkspire</h1>
        <p className="mt-3 text-ink/55">Pick up where your ideas left off.</p>
        <form onSubmit={handleSubmit} className="mt-9 space-y-5">
          {location.state?.message && (
            <p
              role="status"
              className={`rounded-2xl p-3 text-sm ${
                location.state.tone === 'warning'
                  ? 'bg-amber-50 text-amber-800'
                  : 'bg-green-50 text-green-700'
              }`}
            >
              {location.state.message}
            </p>
          )}
          {error && <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div>
            <label className="label" htmlFor="email">Email address</label>
            <input
              className="field"
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              disabled={signingIn}
            />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <div className="relative">
              <input
                className="field pr-12"
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Your password"
                value={form.password}
                onChange={handleChange}
                disabled={signingIn}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-ink/40"
                aria-label="Show password"
                disabled={signingIn}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="mt-2 text-right">
              <Link
                className="text-sm font-semibold text-ink/60 underline underline-offset-4 hover:text-ink"
                to="/forgot-password"
              >
                Forgot password?
              </Link>
            </div>
          </div>
          <button className="btn-primary w-full" type="submit" disabled={signingIn}>
            {signingIn ? 'Signing in...' : 'Sign in'} <ArrowRight size={17} />
          </button>
        </form>
        <p className="mt-7 text-center text-sm text-ink/55">
          New here?{' '}
          <Link
            className="font-semibold text-ink underline underline-offset-4"
            to="/signup"
          >
            Create an account
          </Link>
        </p>
      </div>
    </section>
  );
}

export default SignInPage;
