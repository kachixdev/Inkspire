import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <section className="page-shell grid min-h-[620px] place-items-center py-20 text-center">
      <div>
        <p className="font-display text-8xl text-coral">404</p>
        <h1 className="mt-2 font-display text-4xl">This page wandered off.</h1>
        <p className="mt-3 text-ink/50">
          Even good stories lose their way sometimes.
        </p>
        <Link to="/" className="btn-primary mt-7">
          <ArrowLeft size={16} /> Return home
        </Link>
      </div>
    </section>
  );
}

export default NotFoundPage;
