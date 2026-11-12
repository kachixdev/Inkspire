import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';

function CreateBlogPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', snippet: '', content: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await apiRequest('/posts', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      navigate('/feed');
    } catch (error) {
      console.error('Error publishing story:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page-shell py-14 sm:py-20">
      <div className="grid gap-12 lg:grid-cols-[.65fr_1.35fr]">
        <aside>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-coral">
            New story
          </p>
          <h1 className="mt-3 font-display text-5xl">
            Give the idea some room.
          </h1>
          <p className="mt-4 leading-7 text-ink/55">
            Write clearly, keep it honest, and remember you can always improve it later.
          </p>
          <div className="mt-10 space-y-4">
            {[
              'Choose a clear, inviting title',
              'Summarise the heart of your story',
              'Use paragraphs to make reading easier',
            ].map((tip) => (
              <p className="flex items-center gap-3 text-sm text-ink/60" key={tip}>
                <CheckCircle2 size={17} className="text-coral" /> {tip}
              </p>
            ))}
          </div>
        </aside>

        <form onSubmit={handleSubmit} className="card space-y-6 p-6 sm:p-9">
          {error && (
            <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <div>
            <div className="flex justify-between">
              <label className="label" htmlFor="title">Title</label>
              <span className="text-xs text-ink/35">{form.title.length}/80</span>
            </div>
            <input
              className="field font-display text-xl"
              id="title"
              name="title"
              required
              maxLength="80"
              placeholder="The story you want to tell"
              value={form.title}
              onChange={handleChange}
            />
          </div>

          <div>
            <div className="flex justify-between">
              <label className="label" htmlFor="snippet">Snippet</label>
              <span className="text-xs text-ink/35">{form.snippet.length}/180</span>
            </div>
            <textarea
              className="field resize-none"
              id="snippet"
              name="snippet"
              required
              maxLength="180"
              rows="3"
              placeholder="A short preview that invites people in..."
              value={form.snippet}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="label" htmlFor="content">Content</label>
            <textarea
              className="field min-h-72 resize-y leading-7"
              id="content"
              name="content"
              required
              placeholder="Start writing here..."
              value={form.content}
              onChange={handleChange}
            />
          </div>

          <div className="flex justify-end border-t border-ink/10 pt-6">
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? 'Publishing...' : 'Publish story'} <ArrowRight size={17} />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default CreateBlogPage;
