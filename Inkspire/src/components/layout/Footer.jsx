import { PenLine } from 'lucide-react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="mt-16 border-t border-ink/10">
      <div className="page-shell flex flex-col items-center justify-between gap-4 py-8 text-sm text-ink/50 sm:flex-row">
        <Link
          to="/"
          className="flex items-center gap-2 font-display text-lg text-ink"
        >
          <PenLine size={16} /> Inkspire<span className="text-coral">.</span>
        </Link>
        <p>Made for curious minds and honest stories.</p>
        <p> 2026</p>
      </div>
    </footer>
  );
}

export default Footer;
