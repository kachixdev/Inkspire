import {
  BookOpen,
  MessageCircle,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Avatar from "../components/common/Avatar";
import DeleteConfirmation from "../components/common/DeleteConfirmation";
import RelativeTime from "../components/common/RelativeTime";
import UserLink from "../components/common/UserLink";
import {
  apiRequest,
  getApiUrl,
  getAuthor,
  getCurrentUser,
  getId,
} from "../utils/api";

function StatCard({ icon: Icon, label, value, note, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-3xl border border-ink/10 bg-white p-5 text-left transition hover:-translate-y-1 hover:shadow-soft focus:outline-none focus:ring-2 focus:ring-coral/50"
    >
      <div className="mb-5 flex items-center justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sage">
          <Icon size={19} />
        </span>
        <span className="text-xs text-ink/40">{note}</span>
      </div>
      <p className="font-display text-4xl">{value}</p>
      <p className="mt-1 text-sm text-ink/50">{label}</p>
    </button>
  );
}

function formatJoinDate(user) {
  const joinedAt =
    user.createdAt || user.created_at || user.joinedAt || user.joined;

  if (!joinedAt) {
    return "Not available";
  }

  const date = new Date(joinedAt);
  if (Number.isNaN(date.getTime())) {
    return joinedAt;
  }

  const hasTime = /\d{1,2}:\d{2}/.test(joinedAt);
  return hasTime
    ? date.toLocaleString()
    : date.toLocaleDateString();
}

function AdminPage() {
  const currentUser = getCurrentUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [gmailFeedback] = useState(() => {
    const result = searchParams.get("gmail");
    if (!result) {
      return "";
    }
    return result === "connected"
      ? "Gmail was connected successfully."
      : "Gmail could not be connected. Check the server setup and try again.";
  });
  const [users, setUsers] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [comments, setComments] = useState([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("users");
  const [memberFilter, setMemberFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [editError, setEditError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [blogsError, setBlogsError] = useState("");
  const [commentsError, setCommentsError] = useState("");
  const [gmailStatus, setGmailStatus] = useState("checking");
  const filteredUsers = users.filter((user) => {
    const matchesSearch = `${user.firstName} ${user.lastName} ${user.email}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const isActive = (user.status ?? "active") === "active";
    return matchesSearch && (memberFilter === "all" || isActive);
  });
  const activeUserCount = users.filter(
    (user) => (user.status ?? "active") === "active",
  ).length;

  function showDetails(nextTab, nextMemberFilter = "all") {
    setTab(nextTab);
    setMemberFilter(nextMemberFilter);
    setSearch("");
    document.getElementById("admin-records")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await apiRequest("/users/getallusers");
        if (!Array.isArray(data)) {
          throw new Error("Failed to load users: expected an array response");
        }
        setUsers(data);
        setUsersError("");
      } catch (error) {
        console.error("Error fetching users:", error);
        setUsersError(error.message);
      }
    }

    loadUsers();
  }, []);

  useEffect(() => {
    async function loadPosts() {
      try {
        const data = await apiRequest("/posts/getallpost");
        if (!Array.isArray(data)) {
          throw new Error("Failed to load posts: expected an array response");
        }
        setBlogs(data);
        setBlogsError("");
      } catch (error) {
        console.error("Error fetching posts:", error);
        setBlogsError(error.message);
      }
    }

    loadPosts();
  }, []);

  useEffect(() => {
    async function loadComments() {
      try {
        const data = await apiRequest("/comments/getallcomments");
        if (!Array.isArray(data)) {
          throw new Error("Failed to load comments: expected an array response");
        }
        setComments(data);
        setCommentsError("");
      } catch (error) {
        console.error("Error fetching comments:", error);
        setCommentsError(error.message);
      }
    }

    loadComments();
  }, []);

  useEffect(() => {
    async function loadGmailStatus() {
      try {
        const status = await apiRequest("/admin/gmail/status");
        setGmailStatus(status.connected ? "connected" : "disconnected");
      } catch (error) {
        console.error("Error checking Gmail connection:", error);
        setGmailStatus("unavailable");
      }
    }

    loadGmailStatus();
  }, []);

  useEffect(() => {
    if (!searchParams.has("gmail")) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("gmail");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  async function saveEdit(event) {
    event.preventDefault();
    const userId = editing._id ?? editing.id;

    if (!userId) {
      setEditError("This user does not have an ID, so the role cannot be saved.");
      return;
    }

    setSavingEdit(true);
    setEditError("");

    try {
      await apiRequest(`/users/${encodeURIComponent(userId)}`, {
        method: "PATCH",
        body: JSON.stringify({ role: editing.role }),
      });

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          String(getId(user)) === String(userId)
            ? { ...user, role: editing.role }
            : user,
        ),
      );
      setEditing(null);
    } catch (error) {
      console.error("Error updating user role:", error);
      setEditError("Could not save the role. Please try again.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function deleteUser(userId) {
    await apiRequest(`/users/${encodeURIComponent(userId)}`, {
      method: "DELETE",
    });
    setUsers((currentUsers) =>
      currentUsers.filter((user) => String(getId(user)) !== String(userId)),
    );
  }

  async function deleteBlog(blogId) {
    await apiRequest(`/posts/${encodeURIComponent(blogId)}`, {
      method: "DELETE",
    });
    setBlogs((currentBlogs) =>
      currentBlogs.filter((blog) => String(getId(blog)) !== String(blogId)),
    );
    setComments((currentComments) =>
      currentComments.filter(
        (comment) =>
          String(comment.post?._id ?? comment.post) !== String(blogId),
      ),
    );
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    setDeleteError("");
    try {
      if (deleteTarget.type === "user") {
        await deleteUser(deleteTarget.id);
      } else {
        await deleteBlog(deleteTarget.id);
      }
      setDeleteTarget(null);
    } catch (error) {
      console.error("Error deleting member or story:", error);
      setDeleteError(error.message || "Could not delete this item.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="min-h-screen bg-paper">
      <div className="page-shell py-12 sm:py-16">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-coral">
              <ShieldCheck size={16} /> Admin workspace
            </div>
            <h1 className="mt-3 font-display text-5xl">
              Keep the community healthy.
            </h1>
            <p className="mt-3 text-ink/55">
              Manage members, stories, and comments from one place.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white p-3">
            <Avatar user={currentUser} size="sm" />
            <div className="pr-3 text-sm">
              <p className="font-semibold">
                {currentUser?.firstName} {currentUser?.lastName}
              </p>
              <p className="text-xs text-ink/40">Super admin</p>
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-col justify-between gap-4 rounded-3xl border border-ink/10 bg-white p-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold">Gmail email delivery</p>
            <p className="mt-1 text-sm text-ink/55">
              {gmailStatus === "checking"
                ? "Checking connection..."
                : gmailStatus === "connected"
                  ? "Gmail authorization is saved. Account emails use the Gmail API."
                  : gmailStatus === "disconnected"
                    ? "Not connected. Connect the Gmail account used to send emails."
                    : "Connection status is unavailable."}
            </p>
            {gmailFeedback && (
              <p role="status" className="mt-2 text-sm text-ink/70">
                {gmailFeedback}
              </p>
            )}
          </div>
          <a
            href={getApiUrl("/admin/gmail/oauth/start")}
            className="btn-primary shrink-0"
          >
            {gmailStatus === "connected" ? "Reconnect Gmail" : "Connect Gmail"}
          </a>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="Total members"
            value={users.length}
            note="All time"
            onClick={() => showDetails("users")}
          />
          <StatCard
            icon={UserCheck}
            label="Active members"
            value={activeUserCount}
            note="Now"
            onClick={() => showDetails("users", "active")}
          />
          <StatCard
            icon={BookOpen}
            label="Published stories"
            value={blogs.length}
            note="Live"
            onClick={() => showDetails("blogs")}
          />
          <StatCard
            icon={MessageCircle}
            label="Comments"
            value={commentsError ? "—" : comments.length}
            note="All posts"
            onClick={() => showDetails("comments")}
          />
        </div>
        {commentsError && (
          <p className="mt-3 text-sm text-red-600">{commentsError}</p>
        )}

        <div
          id="admin-records"
          className="mt-10 scroll-mt-24 overflow-hidden rounded-[1.75rem] border border-ink/10 bg-white"
        >
          <div className="flex flex-col justify-between gap-4 border-b border-ink/10 p-5 sm:flex-row sm:items-center">
            <div className="flex gap-1 rounded-full bg-mist p-1">
              <button
                type="button"
                onClick={() => {
                  setTab("users");
                  setMemberFilter("all");
                }}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${tab === "users" ? "bg-white shadow-sm" : "text-ink/50"}`}
              >
                Members
              </button>
              <button
                type="button"
                onClick={() => setTab("blogs")}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${tab === "blogs" ? "bg-white shadow-sm" : "text-ink/50"}`}
              >
                Stories
              </button>
              <button
                type="button"
                onClick={() => setTab("comments")}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${tab === "comments" ? "bg-white shadow-sm" : "text-ink/50"}`}
              >
                Comments
              </button>
            </div>
            {tab === "users" && (
              <div className="relative">
                <Search
                  className="absolute left-3 top-2.5 text-ink/30"
                  size={16}
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-full border border-ink/10 py-2 pl-9 pr-4 text-sm outline-none"
                  placeholder="Find a member"
                />
              </div>
            )}
          </div>

          {tab === "users" ? (
            <div className="overflow-x-auto">
              {usersError && (
                <p className="p-6 text-sm text-red-600">{usersError}</p>
              )}
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-mist/60 text-xs uppercase tracking-wider text-ink/40">
                  <tr>
                    <th className="px-6 py-4">Member</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 && !usersError && (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-sm text-ink/50">
                        No members found.
                      </td>
                    </tr>
                  )}
                  {filteredUsers.map((user) => (
                    <tr
                      key={user._id ?? user.id ?? user.email}
                      className="border-t border-ink/5"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <UserLink user={user} className="flex items-center gap-3">
                            <Avatar user={user} size="sm" />
                            <div>
                              <p className="font-semibold">
                                {user.firstName} {user.lastName}
                              </p>
                            </div>
                          </UserLink>
                          <div>
                            <p className="text-xs text-ink/40">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 capitalize">{user.role}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${(user.status ?? "active") === "active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                        >
                          {user.status ?? "active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-ink/50">
                        {formatJoinDate(user)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditing({ ...user })}
                            className="rounded-full border border-ink/10 px-3 py-1.5 text-xs font-semibold hover:bg-mist"
                          >
                            Edit
                          </button>
                          {user.email !== currentUser?.email && getId(user) && (
                            <button
                              onClick={() =>
                                setDeleteTarget({
                                  type: "user",
                                  id: user._id ?? user.id ?? user.email,
                                  name: `${user.firstName}'s account`,
                                })
                              }
                              className="rounded-full p-2 text-ink/35 hover:bg-red-50 hover:text-red-600"
                              aria-label={`Delete ${user.firstName}'s account`}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : tab === "blogs" ? (
            <div className="divide-y divide-ink/10">
              {blogsError && (
                <p className="p-6 text-sm text-red-600">{blogsError}</p>
              )}
              {blogs.length === 0 && !blogsError && (
                <p className="p-6 text-sm text-ink/50">No stories found.</p>
              )}
              {blogs.map((blog) => {
                const storyAuthor = getAuthor(blog);
                const authorId = getId(storyAuthor) ?? blog.authorId ?? blog.author;
                const author =
                  users.find(
                    (user) => String(getId(user)) === String(authorId),
                  ) ?? storyAuthor;
                const authorName = author
                  ? `${author.firstName} ${author.lastName}`
                  : "Deleted user";
                return (
                  <div
                    key={getId(blog)}
                    className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="text-xs font-semibold text-coral">
                        <RelativeTime value={blog.createdAt} />
                      </p>
                      <p className="mt-1 font-display text-xl">{blog.title}</p>
                      <p className="mt-1 text-xs text-ink/45">
                        By {author ? <UserLink user={author}>{authorName}</UserLink> : authorName}
                      </p>
                      {blog.snippet && (
                        <p className="mt-3 text-sm text-ink/65">{blog.snippet}</p>
                      )}
                      {blog.content && (
                        <details className="mt-3 text-sm text-ink/65">
                          <summary className="cursor-pointer font-semibold text-ink/70">
                            Read full story
                          </summary>
                          <p className="mt-2 whitespace-pre-line leading-6">
                            {blog.content}
                          </p>
                        </details>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        setDeleteTarget({
                          type: "story",
                          id: getId(blog),
                          name: "this story",
                        })
                      }
                      className="flex items-center gap-2 self-start rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-600"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="divide-y divide-ink/10">
              {commentsError && (
                <p className="p-6 text-sm text-red-600">{commentsError}</p>
              )}
              {comments.length === 0 && !commentsError && (
                <p className="p-6 text-sm text-ink/50">No comments found.</p>
              )}
              {comments.map((comment) => {
                const commentAuthor = getAuthor(comment);
                const authorId = getId(commentAuthor) ?? comment.author;
                const author =
                  users.find(
                    (user) => String(getId(user)) === String(authorId),
                  ) ?? commentAuthor;
                const postId =
                  getId(comment.post) ??
                  (typeof comment.post === "string" ? comment.post : null);
                const post =
                  blogs.find((blog) => String(getId(blog)) === String(postId)) ??
                  (typeof comment.post === "object" ? comment.post : null);

                return (
                  <article
                    key={getId(comment)}
                    className="flex items-start gap-3 p-6"
                  >
                    {author && (
                      <UserLink user={author}>
                        <Avatar user={author} size="sm" />
                      </UserLink>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        {author
                          ? <UserLink user={author}>{author.firstName} {author.lastName}</UserLink>
                          : "Deleted member"}
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink/75">
                        {comment.text}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink/45">
                        <RelativeTime value={comment.createdAt} />
                        <span aria-hidden="true">·</span>
                        {postId ? (
                          <Link
                            to={`/blogs/${postId}`}
                            className="hover:text-coral"
                          >
                            {post?.title || "View story"}
                          </Link>
                        ) : (
                          <span>Story unavailable</span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-5">
          <form
            onSubmit={saveEdit}
            className="w-full max-w-md rounded-[1.75rem] bg-paper p-7"
          >
            <h2 className="font-display text-3xl">Change member role</h2>
            <div className="mt-6">
              <label className="label" htmlFor="member-role">Role</label>
              <select
                id="member-role"
                className="field"
                value={editing.role}
                onChange={(event) =>
                  setEditing({ ...editing, role: event.target.value })
                }
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {editError && (
              <p className="mt-4 text-sm text-red-600">{editError}</p>
            )}
            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setEditError("");
                }}
                className="btn-secondary"
                disabled={savingEdit}
              >
                Cancel
              </button>
              <button className="btn-primary" type="submit" disabled={savingEdit}>
                {savingEdit ? "Saving..." : "Save role"}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirmation
          itemName={deleteTarget.name}
          error={deleteError}
          isDeleting={isDeleting}
          onCancel={() => {
            setDeleteTarget(null);
            setDeleteError("");
          }}
          onConfirm={confirmDelete}
        />
      )}
    </section>
  );
}

export default AdminPage;
