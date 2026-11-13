import { Menu, Moon, PenLine, Sun, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { apiRequest, getCurrentUser } from '../../utils/api';

const navClass = ({ isActive }) => `rounded-full px-4 py-2 text-sm font-medium transition ${isActive ? 'bg-white text-coral shadow-sm' : 'text-ink/55 hover:bg-white/70 hover:text-ink'}`;

function Header() {
  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(getCurrentUser);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    let savedTheme;
    try {
      savedTheme = localStorage.getItem('inkspire-theme');
    } catch (error) {
      console.warn('Could not read the saved theme.', error);
    }
    const initialTheme = savedTheme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = initialTheme;
    return initialTheme;
  });

  useEffect(() => {
    function updateUser() {
      setCurrentUser(getCurrentUser());
    }

    window.addEventListener('auth-change', updateUser);
    return () => window.removeEventListener('auth-change', updateUser);
  }, []);

  async function signOut() {
    if (signingOut) {
      return;
    }

    setSigningOut(true);
    setSignOutError('');
    try {
      await apiRequest('/users/logout', { method: 'POST' });
      localStorage.removeItem('currentUser');
      setCurrentUser(null);
      setOpen(false);
      window.dispatchEvent(new Event('auth-change'));
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      setSignOutError(error.message || 'Unable to sign out. Please try again.');
    } finally {
      setSigningOut(false);
    }
  }

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    setTheme(nextTheme);

    try {
      localStorage.setItem('inkspire-theme', nextTheme);
    } catch (error) {
      console.warn('Could not save the selected theme.', error);
    }
  }

  const themeLabel = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  const themeToggle = (
    <button
      type="button"
      onClick={toggleTheme}
      className="grid h-8 w-8 place-items-center rounded-full text-ink/65 transition duration-300 hover:rotate-12 hover:bg-ink/5 hover:text-coral focus:outline-none focus:ring-2 focus:ring-coral/40"
      aria-label={themeLabel}
      title={themeLabel}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );

  const links = (
    <>
      <NavLink to="/feed" className={navClass}>Discover</NavLink>
      {currentUser && <NavLink to="/create" className={navClass}>Write</NavLink>}
      {currentUser && <NavLink to="/profile" className={navClass}>Profile</NavLink>}
      {currentUser?.role === 'admin' && <NavLink to="/admin" className={navClass}>Admin</NavLink>}
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/70 bg-paper/75 backdrop-blur-xl">
      <div className="page-shell flex h-20 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-2xl">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-lg shadow-violet-500/20"><PenLine size={17} /></span>
          Inkspire<span className="brand-dot text-coral">.</span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-white/80 bg-white/50 p-1 shadow-sm md:flex">{links}</nav>

        <div className="hidden items-center gap-3 md:flex">
          {themeToggle}
          {currentUser ? (
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              aria-busy={signingOut}
              className="text-sm font-semibold disabled:opacity-50"
            >
              {signingOut ? 'Signing out...' : 'Sign out'}
            </button>
          ) : (
            <>
              <Link to="/signin" className="text-sm font-semibold">Sign in</Link>
              <Link to="/signup" className="btn-primary py-2.5">Start writing</Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {themeToggle}
          <button onClick={() => setOpen(!open)} className="grid h-10 w-10 place-items-center rounded-full border border-ink/15" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="page-shell flex flex-col gap-5 border-t border-ink/10 py-5 md:hidden">
          {links}
          {currentUser ? (
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              aria-busy={signingOut}
              className="text-left text-sm font-semibold disabled:opacity-50"
            >
              {signingOut ? 'Signing out...' : 'Sign out'}
            </button>
          ) : (
            <>
              <NavLink to="/signin" className={navClass}>Sign in</NavLink>
              <NavLink to="/signup" className={navClass}>Create account</NavLink>
            </>
          )}
        </div>
      )}
      {signOutError && (
        <p role="alert" className="page-shell pb-3 text-right text-sm text-red-600">
          {signOutError}
        </p>
      )}
    </header>
  );
}

export default Header;
