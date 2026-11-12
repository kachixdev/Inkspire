import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../utils/api';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSending(true);
    setError('');

    try {
      await apiRequest('/users/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (requestError) {
      console.error('Error requesting a password reset:', requestError);
      setError(requestError.message || 'Unable to send a reset link. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="page-shell py-16">
      <div className="mx-auto max-w-md">
        <p className="text-sm font-semibold text-coral">ACCOUNT RECOVERY</p>
        {/* <h1 className="mt-3 font-display text-5xl">YOUR PASSWORD RESET LINK HAS BEEN SENT</h1> */}
        {sent ? (
          <div className="mt-6 rounded-2xl bg-green-50 p-4 text-sm leading-6 text-green-800">
            A password reset link has been sent to your email address. Please check your inbox and follow the instructions to reset your password. If you do not see the email, please check your spam or junk folder.
          </div>
        ) : (
          <>
            <p className="mt-3 text-ink/55">
              Enter the email address you used to sign up and we&apos;ll send you
              a link to reset your password.
            </p>
            <form onSubmit={handleSubmit} className="card mt-8 space-y-5 p-6 sm:p-8">
              {error && (
                <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}
              <div>
                <label className="label" htmlFor="reset-email">Email address</label>
                <input
                  className="field"
                  id="reset-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <button className="btn-primary w-full" type="submit" disabled={sending}>
                {sending ? 'Sending link...' : 'Send reset link'} <ArrowRight size={17} />
              </button>
            </form>
          </>
        )}
        <Link
          className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-ink/60 underline underline-offset-4 hover:text-ink"
          to="/signin"
        >
          <ArrowLeft size={16} /> Back to sign in
        </Link>
      </div>
    </section>
  );
}

export default ForgotPasswordPage;
