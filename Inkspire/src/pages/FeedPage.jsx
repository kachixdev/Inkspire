import { MessageCircle, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../components/common/Avatar';
import DeleteConfirmation from '../components/common/DeleteConfirmation';
import RelativeTime from '../components/common/RelativeTime';
import UserLink from '../components/common/UserLink';
import { apiRequest, getAuthor, getCurrentUser, getId, newestFirst } from '../utils/api';

function FeedPage() {
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?._id ?? currentUser?.id;
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const [search, setSearch] = useState('');
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const searchTerm = search.toLowerCase();
  const filteredBlogs = blogs.filter((blog) =>
    `${blog.title} ${blog.snippet}`.toLowerCase().includes(searchTerm),
  );

  function canDeleteBlog(blog) {
    const author = getAuthor(blog);
    return Boolean(
      currentUser &&
        (currentUser.role === 'admin' ||
          String(getId(author) ?? blog.author) === String(currentUserId)),
    );
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setDeleteError('');
    try {
      await apiRequest(`/posts/${encodeURIComponent(deleteTarget)}`, {
        method: 'DELETE',
      });
      setBlogs((currentBlogs) =>
        currentBlogs.filter((blog) => getId(blog) !== deleteTarget),
      );
      setDeleteTarget(null);
    } catch (requestError) {
      console.error('Error deleting story:', requestError);
      setDeleteError(requestError.message || 'Could not delete this story.');
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    async function fetchPosts() {
      try {
        const data = await apiRequest('/posts/getallpost');
        if (!Array.isArray(data)) {
          throw new Error('The server returned an invalid stories list.');
        }
        setBlogs(newestFirst(data));
      } catch (error) {
        console.error('Error fetching stories:', error);
        setError(error.message || 'Could not load stories. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  return (
    <section className="page-shell py-10 sm:py-14">
      <div className="mx-auto flex max-w-4xl flex-col justify-between gap-6 border-b border-ink/10 pb-7 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-coral">
            Community stories
          </p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl">
            {greeting}, {currentUser?.firstName || 'there'}.
          </h1>
          <p className="mt-2 text-sm text-ink/55">
            Here is what the community has been thinking about.
          </p>
        </div>
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-4 top-3.5 text-ink/35" size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="field pl-11"
            placeholder="Search stories..."
          />
        </div>
      </div>

      <div className="mx-auto mt-3 max-w-4xl">
        {deleteError && (
          <p role="alert" className="mb-5 text-sm text-red-600">{deleteError}</p>
        )}
        {loading ? (
          <p className="py-12 text-center text-ink/50">Loading stories...</p>
        ) : error ? (
          <p role="alert" className="py-12 text-center text-red-600">{error}</p>
        ) : filteredBlogs.length > 0 ? (
          <div className="divide-y divide-ink/10">
            {filteredBlogs.map((blog) => {
              const author = getAuthor(blog);
              const blogId = getId(blog);

              return (
                <article key={blogId} className="py-7 sm:py-8">
                  <div className="flex items-center gap-2 text-xs text-ink/55">
                    <UserLink user={author} className="flex items-center gap-2">
                      <Avatar user={author} size="sm" />
                      <span className="font-medium text-ink">
                        {author
                          ? `${author.firstName} ${author.lastName}`
                          : 'Inkspire member'}
                      </span>
                    </UserLink>
                    <span aria-hidden="true">·</span>
                    <RelativeTime value={blog.createdAt} />
                  </div>
                  <Link to={`/blogs/${blogId}`} className="group mt-3 block">
                    <h2 className="font-display text-2xl leading-tight transition-colors group-hover:text-coral sm:text-3xl">
                      {blog.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink/65 sm:text-base">
                      {blog.snippet}
                    </p>
                  </Link>
                  <div className="mt-4 flex items-center justify-between">
                    <Link
                      to={`/blogs/${blogId}`}
                      className="inline-flex items-center gap-1.5 text-xs text-ink/50 transition-colors hover:text-coral"
                    >
                      <MessageCircle size={15} />
                      Read and join the conversation
                    </Link>
                    {canDeleteBlog(blog) && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(blogId)}
                        className="inline-flex items-center gap-1.5 text-xs text-ink/40 transition-colors hover:text-red-600"
                        aria-label={`Delete ${blog.title}`}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="font-display text-2xl">No stories found.</p>
            <p className="mt-2 text-sm text-ink/50">
              Try a different search word.
            </p>
          </div>
        )}
      </div>
      {deleteTarget && (
        <DeleteConfirmation
          itemName="this story"
          error={deleteError}
          isDeleting={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </section>
  );
}

export default FeedPage;
