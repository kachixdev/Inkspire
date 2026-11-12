import { ArrowLeft, MessageCircle, Send, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Avatar from '../components/common/Avatar';
import DeleteConfirmation from '../components/common/DeleteConfirmation';
import RelativeTime from '../components/common/RelativeTime';
import UserLink from '../components/common/UserLink';
import { apiRequest, getAuthor, getCurrentUser, getId } from '../utils/api';

function BlogDetailsPage() {
  const { blogId } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const currentUserRole = currentUser?.role;
  const currentUserId = currentUser?._id ?? currentUser?.id;
  const [blog, setBlog] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [commentsError, setCommentsError] = useState('');
  const [commentError, setCommentError] = useState('');
  const [posting, setPosting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadBlog() {
      try {
        const posts = await apiRequest('/posts/getallpost');
        if (!Array.isArray(posts)) {
          throw new Error('The server returned an invalid stories list.');
        }

        const selectedBlog = posts.find(
          (post) => String(getId(post)) === String(blogId),
        );
        if (!selectedBlog) {
          throw new Error('Story not found.');
        }
        setBlog(selectedBlog);
      } catch (error) {
        console.error('Error loading story:', error);
        setPageError(error.message);
        return;
      } finally {
        setLoading(false);
      }

      try {
        const postComments = await apiRequest(`/comments/post/${encodeURIComponent(blogId)}`);
        if (!Array.isArray(postComments)) {
          throw new Error('The server returned an invalid comments list.');
        }
        setComments(postComments);
        setCommentsError('');
      } catch (error) {
        console.error('Error loading comments:', error);
        setCommentsError(error.message);
      }
    }

    loadBlog();
  }, [blogId]);

  async function handleComment(event) {
    event.preventDefault();
    if (!currentUser) {
      setCommentError('Sign in before posting a comment.');
      return;
    }

    const commentText = text.trim();
    if (!commentText) {
      return;
    }

    setPosting(true);
    setCommentError('');
    try {
      const newComment = await apiRequest('/comments', {
        method: 'POST',
        body: JSON.stringify({ text: commentText, post: blogId }),
      });

      setComments((currentComments) => [...currentComments, newComment]);
      setText('');
    } catch (error) {
      console.error('Error posting comment:', error);
      setCommentError(error.message);
    } finally {
      setPosting(false);
    }
  }

  if (loading) {
    return <p className="page-shell py-24 text-center">Loading story...</p>;
  }

  if (pageError || !blog) {
    return (
      <div className="page-shell py-24 text-center">
        <h1 className="font-display text-5xl">
          {pageError || 'Story not found.'}
        </h1>
        <Link to="/feed" className="btn-primary mt-6">Back to feed</Link>
      </div>
    );
  }

  const author = getAuthor(blog);
  const canDeleteBlog =
    currentUser &&
    (currentUserRole === 'admin' ||
      String(getId(author)) === String(currentUserId));

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setDeleteError('');
    try {
      const endpoint =
        deleteTarget.type === 'post'
          ? `/posts/${encodeURIComponent(blogId)}`
          : `/comments/${encodeURIComponent(deleteTarget.id)}`;
      await apiRequest(endpoint, { method: 'DELETE' });

      if (deleteTarget.type === 'post') {
        navigate('/feed');
      } else {
        setComments((currentComments) =>
          currentComments.filter(
            (comment) => getId(comment) !== deleteTarget.id,
          ),
        );
        setDeleteTarget(null);
      }
    } catch (error) {
      console.error('Error deleting story or comment:', error);
      setDeleteError(error.message || 'Could not delete this item.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article className="page-shell py-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between border-b border-ink/10 pb-4">
          <Link
            to="/feed"
            className="inline-flex items-center gap-2 text-sm text-ink/55 transition-colors hover:text-ink"
          >
            <ArrowLeft size={16} /> Back to stories
          </Link>
          {canDeleteBlog && (
            <button
              type="button"
              onClick={() => setDeleteTarget({ type: 'post' })}
              className="inline-flex items-center gap-2 text-sm text-ink/45 transition-colors hover:text-red-600"
            >
              <Trash2 size={16} /> Delete
            </button>
          )}
        </div>

        <header className="border-b border-ink/10 py-8 sm:py-12">
          <div className="mb-6 flex items-center gap-3">
            <UserLink user={author} className="flex items-center gap-3">
              <Avatar user={author} size="md" />
              <span className="text-sm font-semibold">
                {author
                  ? `${author.firstName} ${author.lastName}`
                  : 'Inkspire member'}
              </span>
            </UserLink>
            <span className="text-ink/35" aria-hidden="true">·</span>
            <span className="text-sm text-ink/50">
              <RelativeTime value={blog.createdAt} />
            </span>
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            {blog.title}
          </h1>
          {blog.snippet && (
            <p className="mt-5 text-lg leading-8 text-ink/60 sm:text-xl">
              {blog.snippet}
            </p>
          )}
        </header>

        <div className="border-b border-ink/10 py-8 sm:py-10">
          {(blog.content || '').split('\n').filter(Boolean).map((paragraph, index) => (
            <p
              key={`${index}-${paragraph.slice(0, 20)}`}
              className="mb-6 whitespace-pre-line text-base leading-8 text-ink/80 last:mb-0 sm:text-lg sm:leading-9"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <section className="py-8 sm:py-10">
          <div className="flex items-center gap-2">
            <MessageCircle size={19} className="text-coral" />
            <h2 className="text-xl font-bold">
              Replies <span className="font-normal text-ink/45">
                ({commentsError ? '—' : comments.length})
              </span>
            </h2>
          </div>

          <form onSubmit={handleComment} className="mt-5 border-b border-ink/10 pb-6">
            <div className="flex items-start gap-3">
              {currentUser && <Avatar user={currentUser} size="sm" />}
              <textarea
                rows="3"
                className="field resize-none"
                placeholder={currentUser ? 'Write a reply...' : 'Sign in to reply'}
                value={text}
                onChange={(event) => setText(event.target.value)}
                disabled={!currentUser || posting}
              />
            </div>
            {commentError && (
              <p role="alert" className="mt-3 text-sm text-red-600">
                {commentError}
              </p>
            )}
            {commentsError && (
              <p className="mt-3 text-sm text-ink/50">{commentsError}</p>
            )}
            <div className="mt-3 flex justify-end">
              <button
                className="btn-primary py-2.5"
                type="submit"
                disabled={!currentUser || posting}
              >
                {posting ? 'Posting...' : 'Reply'} <Send size={15} />
              </button>
            </div>
          </form>

          <div>
            {comments.map((comment) => {
              const commentAuthor = getAuthor(comment);
              const commentAuthorId = getId(commentAuthor) ?? comment.author;
              const canDeleteComment =
                currentUser &&
                (currentUserRole === 'admin' ||
                  String(commentAuthorId) === String(currentUserId));

              return (
                <div key={getId(comment)} className="flex gap-3 border-b border-ink/10 py-5">
                  <UserLink user={commentAuthor}>
                    <Avatar user={commentAuthor} size="sm" />
                  </UserLink>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <UserLink user={commentAuthor} className="text-sm font-semibold">
                        {commentAuthor
                          ? `${commentAuthor.firstName} ${commentAuthor.lastName}`
                          : 'Inkspire member'}
                      </UserLink>
                      <span className="text-ink/35" aria-hidden="true">·</span>
                      <span className="text-xs text-ink/45">
                        <RelativeTime value={comment.createdAt} />
                      </span>
                      {canDeleteComment && (
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({
                              type: 'comment',
                              id: getId(comment),
                            })
                          }
                          className="ml-auto text-ink/35 transition-colors hover:text-red-600"
                          aria-label="Delete reply"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink/75">
                      {comment.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
      {deleteError && (
        <p role="alert" className="page-shell py-3 text-center text-sm text-red-600">
          {deleteError}
        </p>
      )}
      {deleteTarget && (
        <DeleteConfirmation
          itemName={deleteTarget.type === 'post' ? 'this story' : 'this comment'}
          error={deleteError}
          isDeleting={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </article>
  );
}

export default BlogDetailsPage;
