import { ArrowUpRight, MessageCircle, Trash2 } from 'lucide-react';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';
import RelativeTime from '../common/RelativeTime';
import UserLink from '../common/UserLink';
import { getAuthor, getId } from '../../utils/api';

function BlogCard({ blog, featured = false, canDelete = false, onDelete }) {
  const shouldReduceMotion = useReducedMotion();
  const author = getAuthor(blog);
  const blogId = getId(blog);

  return (
    <Motion.article
      className={`group overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/80 shadow-[0_12px_40px_rgba(35,48,78,0.06)] backdrop-blur transition-colors duration-300 hover:border-coral/20 hover:shadow-soft ${
        featured ? 'md:grid md:grid-cols-[1.05fr_.95fr]' : ''
      }`}
      variants={{
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 24 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileHover={shouldReduceMotion ? undefined : { y: -6 }}
      whileInView="visible"
      initial="hidden"
      viewport={{ once: true, amount: 0.15 }}
    >
      <div
        className={`bg-sage relative min-h-48 overflow-hidden p-7 ${
          featured ? 'md:min-h-80' : ''
        }`}
      >
        <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full border-[24px] border-white/35 transition duration-500 group-hover:scale-110" />
        <div className="absolute -bottom-10 left-10 h-24 w-24 rotate-12 rounded-3xl bg-white/30 transition duration-500 group-hover:rotate-45" />
        <span className="story-art-label absolute left-7 top-7 rounded-full border border-white/50 bg-white/30 px-3 py-1 text-[10px] font-bold uppercase tracking-[.18em] text-ink/55 backdrop-blur">
          Community story 
        </span>
        <p className="absolute bottom-3 left-7 font-display text-7xl text-ink/10">“</p>
      </div>

      <div className="flex flex-col p-6 sm:p-7">
        <div className="mb-5 flex items-center gap-3 text-xs text-ink/50">
          <UserLink user={author} className="flex items-center gap-3">
            <Avatar user={author} size="sm" />
            <p className="font-semibold text-ink">
              {author?.firstName} {author?.lastName}
            </p>
          </UserLink>
          <p><RelativeTime value={blog.createdAt} /></p>
        </div>
        <h2
          className={`${
            featured ? 'text-3xl sm:text-4xl' : 'text-2xl'
          } font-display leading-tight transition-colors group-hover:text-coral`}
        >
          {blog.title}
        </h2>
        <p className="mt-3 flex-1 text-sm leading-6 text-ink/60">{blog.snippet}</p>
        <div className="mt-6 flex items-center justify-between border-t border-ink/10 pt-5">
          <span className="flex items-center gap-1.5 text-xs text-ink/50">
            <MessageCircle size={15} /> Join the conversation
          </span>
          <div className="flex items-center gap-4">
            {canDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-1.5 text-xs font-semibold text-ink/40 transition-colors hover:text-red-600"
                aria-label="Delete story"
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
            <Link
              to={`/blogs/${blogId}`}
              className="flex items-center gap-2 text-sm font-semibold transition-colors hover:text-coral"
            >
              Read story
              <ArrowUpRight
                size={16}
                className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </div>
        </div>
      </div>
    </Motion.article>
  );
}

export default BlogCard;
