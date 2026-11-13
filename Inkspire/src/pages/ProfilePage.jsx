import { BookOpen, MessageCircle, PenLine, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Avatar from '../components/common/Avatar';
import DeleteConfirmation from '../components/common/DeleteConfirmation';
import EditProfileModal from '../components/common/EditProfileModal';
import RelativeTime from '../components/common/RelativeTime';
import { apiRequest, formatDate, getAuthor, getCurrentUser, getId } from '../utils/api';

function ProfilePage() {
  const { userId: viewedUserId } = useParams();
  const location = useLocation();
  const currentUser = useMemo(() => getCurrentUser(), []);
  const linkedUser = location.state?.profileUser;
  const currentUserId = currentUser?._id ?? currentUser?.id;
  const userId = viewedUserId ?? currentUserId;
  const isOwnProfile =
    !viewedUserId || String(viewedUserId) === String(currentUserId);
  const [profileUser, setProfileUser] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [comments, setComments] = useState([]);
  const [activeSection, setActiveSection] = useState('stories');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentsError, setCommentsError] = useState('');
  const [profileFeedback, setProfileFeedback] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deletingBlogId, setDeletingBlogId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const selectedSection = isOwnProfile ? activeSection : 'stories';

  useEffect(() => {
    async function loadProfileActivity() {
      setLoading(true);
      setError('');
      setCommentsError('');
      setProfileUser(isOwnProfile ? currentUser : null);
      setBlogs([]);
      setComments([]);

      if (!userId) {
        setError('User profile not found.');
        setLoading(false);
        return;
      }

      try {
        const linkedUserMatches =
          String(getId(linkedUser)) === String(userId);
        if (!isOwnProfile && linkedUserMatches) {
          setProfileUser(linkedUser);
        }

        const allBlogs = await apiRequest('/posts/getallpost');
        if (!Array.isArray(allBlogs)) {
          throw new Error('The server returned an invalid stories list.');
        }

        const matchingPost = allBlogs.find(
          (blog) =>
            String(getId(getAuthor(blog))) === String(userId),
        );
        const user = isOwnProfile
          ? currentUser
          : linkedUserMatches
            ? linkedUser
            : getAuthor(matchingPost);
        if (!user) {
          throw new Error('User profile not found.');
        }

        setProfileUser(user);
        setBlogs(
          allBlogs.filter(
            (blog) =>
              String(getId(getAuthor(blog)) ?? blog.author) === String(userId),
          ),
        );
      } catch (requestError) {
        console.error('Error loading profile stories:', requestError);
        setError(requestError.message);
      }

      if (isOwnProfile) {
        try {
          const myComments = await apiRequest('/comments/mine');
          if (!Array.isArray(myComments)) {
            throw new Error('The server returned an invalid comments list.');
          }
          setComments(myComments);
        } catch (requestError) {
          console.error('Error loading profile comments:', requestError);
          setCommentsError(requestError.message);
        }
      }

      setLoading(false);
    }

    loadProfileActivity();
  }, [currentUser, currentUserId, isOwnProfile, linkedUser, userId, viewedUserId]);

  async function deleteBlog(blogId) {
    setDeletingBlogId(blogId);
    try {
      await apiRequest(`/posts/${encodeURIComponent(blogId)}`, {
        method: 'DELETE',
      });
      setBlogs((currentBlogs) =>
        currentBlogs.filter((blog) => getId(blog) !== blogId),
      );
      setComments((currentComments) =>
        currentComments.filter(
          (comment) =>
            String(comment.post?._id ?? comment.post) !== String(blogId),
        ),
      );
    } finally {
      setDeletingBlogId('');
    }
  }

  async function deleteComment(commentId) {
    await apiRequest(`/comments/${encodeURIComponent(commentId)}`, {
      method: 'DELETE',
    });
    setComments((currentComments) =>
      currentComments.filter((comment) => getId(comment) !== commentId),
    );
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setDeleteError('');
    try {
      if (deleteTarget.type === 'post') {
        await deleteBlog(deleteTarget.id);
      } else {
        await deleteComment(deleteTarget.id);
      }
      setDeleteTarget(null);
    } catch (requestError) {
      console.error('Error deleting account activity:', requestError);
      setDeleteError(requestError.message || 'Could not delete this item.');
    } finally {
      setDeleting(false);
    }
  }

  if (!currentUser && isOwnProfile) {
    return (
      <section className="page-shell py-24 text-center">
        <h1 className="font-display text-4xl">Sign in to view your profile.</h1>
        <Link to="/signin" className="btn-primary mt-6">Sign in</Link>
      </section>
    );
  }

  if (loading) {
    return <p className="page-shell py-24 text-center">Loading profile...</p>;
  }

  if (!profileUser) {
    return (
      <section className="page-shell py-24 text-center">
        <h1 className="font-display text-4xl">Profile not found.</h1>
        <p role="alert" className="mt-3 text-ink/55">{error}</p>
        <Link to="/feed" className="btn-primary mt-6">Back to stories</Link>
      </section>
    );
  }

  return (
    <section className="page-shell py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <header className="flex flex-col gap-5 border-b border-ink/10 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar user={profileUser} size="lg" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {profileUser.firstName} {profileUser.lastName}
              </h1>
              {isOwnProfile && (
                <p className="mt-1 text-sm text-ink/55">{profileUser.email}</p>
              )}
              <p className="mt-2 text-xs text-ink/45">
                {blogs.length} {blogs.length === 1 ? 'story' : 'stories'}
                {isOwnProfile && !commentsError && (
                  <> · {comments.length} {comments.length === 1 ? 'comment' : 'comments'}</>
                )}
                {' · '}Member since {formatDate(profileUser.createdAt)}
              </p>
            </div>
          </div>
          {isOwnProfile && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsEditingProfile(true)}
                className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2.5 text-sm font-semibold hover:bg-mist"
              >
                <Pencil size={15} /> Edit profile
              </button>
              <Link to="/create" className="btn-primary">
                <PenLine size={16} /> Write a story
              </Link>
            </div>
          )}
        </header>

        {error && <p role="alert" className="mt-5 text-sm text-red-600">{error}</p>}
        {profileFeedback && (
          <p role="status" className="mt-4 text-sm text-ink/65">
            {profileFeedback}
          </p>
        )}
        {commentsError && (
          <p role="alert" className="mt-4 text-sm text-red-600">{commentsError}</p>
        )}
        {deleteError && (
          <p role="alert" className="mt-4 text-sm text-red-600">{deleteError}</p>
        )}

        <div
          className="mt-8 flex border-b border-ink/10"
          role="tablist"
          aria-label="Profile activity"
        >
          <button
            type="button"
            role="tab"
            id="stories-tab"
            aria-selected={selectedSection === 'stories'}
            aria-controls="stories-panel"
            onClick={() => setActiveSection('stories')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
              selectedSection === 'stories'
                ? 'border-ink text-ink'
                : 'border-transparent text-ink/50 hover:text-ink'
            }`}
          >
            <BookOpen size={16} />
            Stories ({blogs.length})
          </button>
          {isOwnProfile && (
            <button
              type="button"
              role="tab"
              id="comments-tab"
              aria-selected={selectedSection === 'comments'}
              aria-controls="comments-panel"
              onClick={() => setActiveSection('comments')}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
                selectedSection === 'comments'
                  ? 'border-ink text-ink'
                  : 'border-transparent text-ink/50 hover:text-ink'
              }`}
            >
              <MessageCircle size={16} />
              Comments ({commentsError ? '—' : comments.length})
            </button>
          )}
        </div>

        {selectedSection === 'stories' ? (
          <section id="stories-panel" role="tabpanel" aria-labelledby="stories-tab">
            {blogs.length ? (
              <div className="divide-y divide-ink/10">
                {blogs.map((blog) => {
                  const blogId = getId(blog);
                  return (
                    <article key={blogId} className="flex items-start justify-between gap-4 py-6">
                      <div className="min-w-0">
                        <p className="text-xs text-ink/45">
                          <RelativeTime value={blog.createdAt} />
                        </p>
                        <Link
                          to={`/blogs/${blogId}`}
                          className="mt-2 block text-xl font-semibold leading-snug hover:text-coral"
                        >
                          {blog.title}
                        </Link>
                        {blog.snippet && (
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink/60">
                            {blog.snippet}
                          </p>
                        )}
                      </div>
                      {currentUser && (isOwnProfile || currentUser.role === 'admin') && (
                        <button
                          type="button"
                          disabled={deletingBlogId === blogId}
                          onClick={() => setDeleteTarget({ type: 'post', id: blogId })}
                          className="mt-1 shrink-0 text-ink/35 transition hover:text-red-600 disabled:opacity-50"
                          aria-label="Delete story"
                        >
                          <Trash2 size={17} />
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="py-8 text-sm text-ink/55">
                {error ? 'Stories could not be loaded.' : 'No stories published yet.'}
              </p>
            )}
          </section>
        ) : (
          <section id="comments-panel" role="tabpanel" aria-labelledby="comments-tab">
            {comments.length ? (
              <div className="divide-y divide-ink/10">
                {comments.map((comment) => {
                  const postId = comment.post?._id ?? comment.post;
                  return (
                    <article key={getId(comment)} className="flex items-start justify-between gap-4 py-5">
                      <div>
                        <Link
                          to={`/blogs/${postId}`}
                          className="text-xs font-medium text-coral hover:underline"
                        >
                          {comment.post?.title || 'View story'}
                        </Link>
                        <p className="mt-2 text-sm leading-6 text-ink/75">
                          {comment.text}
                        </p>
                        <p className="mt-2 text-xs text-ink/45">
                          <RelativeTime value={comment.createdAt} />
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({ type: 'comment', id: getId(comment) })
                        }
                        className="mt-1 shrink-0 text-ink/35 transition hover:text-red-600"
                        aria-label="Delete comment"
                      >
                        <Trash2 size={16} />
                      </button>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p role={commentsError ? 'alert' : undefined} className="py-8 text-sm text-ink/55">
                {commentsError ? 'Comments could not be loaded.' : 'No comments yet.'}
              </p>
            )}
          </section>
        )}
      </div>
      {deleteTarget && (
        <DeleteConfirmation
          itemName={deleteTarget.type === 'post' ? 'this story' : 'this comment'}
          error={deleteError}
          isDeleting={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
      {isEditingProfile && (
        <EditProfileModal
          user={profileUser}
          onClose={() => setIsEditingProfile(false)}
          onSave={(updatedUser, passwordNoticeSent) => {
            setProfileUser(updatedUser);
            if (passwordNoticeSent === false) {
              setProfileFeedback(
                'Your password was changed, but the security email could not be sent.',
              );
            } else if (passwordNoticeSent === true) {
              setProfileFeedback('Your password was changed and a security email was sent.');
            } else {
              setProfileFeedback('');
            }
            setIsEditingProfile(false);
          }}
        />
      )}
    </section>
  );
}

export default ProfilePage;
