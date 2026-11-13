import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../utils/api';

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const response = await apiRequest('/users/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword: form.password }),
      });
      navigate('/signin', {
        replace: true,
        state: {
          message: response.passwordNoticeSent === false
            ? 'Your password was reset, but the security email could not be sent.'
            : 'Your password has been reset. Please sign in.',
        },
      });
    } catch (requestError) {
      console.error('Error resetting password:', requestError);
      setError(requestError.message || 'Unable to reset your password. Request a new link and try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page-shell py-16">
      <div className="mx-auto max-w-md">
        <p className="text-sm font-semibold text-coral">ACCOUNT RECOVERY</p>
        <h1 className="mt-3 font-display text-5xl">Choose a new password</h1>
        {!token ? (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm leading-6 text-red-700">
            This reset link is incomplete or invalid. Request a new password reset link.
            <Link className="ml-1 font-semibold underline" to="/forgot-password">
              Request a new link
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-3 text-ink/55">
              Choose a new password for your Inkspire account.
            </p>
            <form onSubmit={handleSubmit} className="card mt-8 space-y-5 p-6 sm:p-8">
              {error && (
                <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}
              <div>
                <label className="label" htmlFor="new-password">New password</label>
                <input
                  className="field"
                  id="new-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength="6"
                  required
                  value={form.password}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="label" htmlFor="confirm-password">Confirm new password</label>
                <input
                  className="field"
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength="6"
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
              </div>
              <button className="btn-primary w-full" type="submit" disabled={saving}>
                {saving ? 'Updating password...' : 'Update password'} <ArrowRight size={17} />
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}

export default ResetPasswordPage;
