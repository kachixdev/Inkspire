import {
  ArrowDownRight,
  ArrowRight,
  BookOpen,
  Feather,
  MessageCircle,
} from 'lucide-react';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import BlogCard from '../components/blog/BlogCard';
import RelativeTime from '../components/common/RelativeTime';
import UserLink from '../components/common/UserLink';
import { apiRequest, getId, newestFirst } from '../utils/api';

const features = [
  {
    Icon: Feather,
    title: 'Write a post',
    text: 'Draft and publish your own stories and ideas.',
  },
  {
    Icon: BookOpen,
    title: 'Read stories',
    text: 'Browse posts shared by other members.',
    iconClassName: 'group-hover:rotate-3',
  },
  {
    Icon: MessageCircle,
    title: 'Join discussions',
    text: 'Comment on posts and share your perspective.',
  },
];

const reveal = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const recentStoriesViewport = { once: true, amount: 0.15 };

function LandingPage() {
  const shouldReduceMotion = useReducedMotion();
  const [blogs, setBlogs] = useState([]);
  const [blogsError, setBlogsError] = useState('');
  const featuredBlog = blogs[0];
  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.65, ease: [0.22, 1, 0.36, 1] };
  const staggerChildren = shouldReduceMotion ? 0 : 0.12;
  const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren } },
  };

  useEffect(() => {
    async function loadStories() {
      try {
        const data = await apiRequest('/posts/getallpost');
        if (!Array.isArray(data)) {
          throw new Error('The server returned an invalid stories list.');
        }
        setBlogs(newestFirst(data));
      } catch (error) {
        console.error('Error loading landing page stories:', error);
        setBlogsError(error.message);
      }
    }

    loadStories();
  }, []);

  return (
    <>
      <section className="page-shell pt-6 sm:pt-10">
        <div className="hero-glow relative isolate overflow-hidden rounded-[2rem] text-white shadow-soft sm:rounded-[2.75rem]">
          <div className="relative grid min-h-[620px] items-center gap-12 px-6 py-16 sm:px-12 sm:py-20 lg:grid-cols-[1.05fr_.95fr] lg:px-16">
            <div className="relative z-10">
              <div className="reveal-up mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-4 py-2 text-xs font-semibold tracking-wide text-white/75 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                A place to write and read
              </div>
              <h1 className="reveal-up reveal-delay-1 max-w-3xl font-display text-6xl leading-[.98] tracking-tight sm:text-7xl lg:text-8xl">
                Share what matters to you.
              </h1>
              <p className="reveal-up reveal-delay-2 mt-7 max-w-xl text-base leading-7 text-white/65 sm:text-lg sm:leading-8">
                Publish your stories, discover posts from other writers, and take part in the conversation.
              </p>
              <div className="reveal-up reveal-delay-3 mt-9 flex flex-wrap gap-3">
                <Link to="/signup" className="hero-signup-button btn-primary !bg-none !bg-white !text-black !shadow-none hover:!bg-cyan-100">
                  Create an account <ArrowRight size={17} />
                </Link>
                <Link to="/feed" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[.06] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/[.12]">
                  Browse stories <ArrowDownRight size={17} />
                </Link>
              </div>
              <div className="mt-10 flex items-center gap-4 text-sm text-white/55">
                <div className="flex -space-x-2">
                  {blogs.slice(0, 3).map((blog, index) => {
                    const author = blog.author;
                    const initials = `${author?.firstName?.[0] || ''}${author?.lastName?.[0] || ''}`;
                    const colors = ['bg-cyan-200', 'bg-violet-200', 'bg-rose-200'];
                    return (
                      <UserLink
                        key={getId(blog)}
                        user={author}
                        className={`grid h-9 w-9 place-items-center rounded-full border-2 border-[#141a30] text-[10px] font-bold text-ink ${colors[index]}`}
                      >
                        {initials || '?'}
                      </UserLink>
                    );
                  })}
                </div>
                <p>Writing and reading, in one place</p>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md py-5 lg:ml-auto">
              <div aria-hidden="true" className="float-slow absolute -left-7 top-2 h-24 w-24 rounded-full bg-cyan-300/20 blur-2xl sm:-left-12 sm:h-36 sm:w-36" />
              <article className="relative rotate-1 rounded-[2rem] border border-white/15 bg-white/[.08] p-3 shadow-2xl backdrop-blur-xl">
                <div className="featured-story-card rounded-[1.45rem] border border-white/10 bg-[#151d35]/90 p-6 sm:p-8">
                  <div className="mb-12 flex items-center justify-between text-xs font-semibold tracking-[.18em] text-white/45">
                    <span>FEATURED STORY</span>
                    <Feather size={17} className="text-cyan-200" />
                  </div>
                  <h2 className="font-display text-3xl leading-tight sm:text-4xl">
                    {featuredBlog?.title || 'Your next favorite story awaits.'}
                  </h2>
                  <p className="mt-4 text-sm leading-6 text-white/65">
                    {featuredBlog?.snippet || 'Discover stories from the Inkspire community.'}
                  </p>
                  <div className="mt-9 flex items-center justify-between border-t border-white/10 pt-5 text-xs">
                    {featuredBlog?.author ? (
                      <UserLink
                        user={featuredBlog.author}
                        className="font-semibold tracking-wider text-white/75"
                      >
                        {`${featuredBlog.author.firstName} ${featuredBlog.author.lastName}`}
                      </UserLink>
                    ) : (
                      <span className="font-semibold tracking-wider text-white/75">
                        INKSPIRE COMMUNITY
                      </span>
                    )}
                    <span className="text-white/40">
                      {featuredBlog ? <RelativeTime value={featuredBlog.createdAt} /> : 'READ STORIES'}
                    </span>
                  </div>
                </div>
              </article>
              <Link
                to={featuredBlog ? `/blogs/${getId(featuredBlog)}` : '/feed'}
                className="hero-feature-chip float-delayed absolute -bottom-5 -left-2 rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-ink shadow-soft backdrop-blur transition hover:-translate-y-1 sm:-left-8"
              >
                <span className="block text-[10px] font-bold uppercase tracking-[.18em] text-coral ">Featured story</span>
                <span className="mt-1 block font-display text-lg">Read the story</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Motion.section
        className="page-shell py-20 sm:py-24"
        initial="hidden"
        whileInView="visible"
        viewport={recentStoriesViewport}
        variants={reveal}
        transition={transition}
      >
        <Motion.div className="mb-10 flex items-end justify-between gap-6" variants={reveal} transition={transition}>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-coral">From the community</p>
            <h2 className="font-display text-4xl sm:text-5xl">Recent stories</h2>
          </div>
          <Link to="/feed" className="hidden items-center text-sm font-semibold text-ink/70 transition hover:text-coral sm:flex">
            View all stories <ArrowRight className="ml-2" size={16} />
          </Link>
        </Motion.div>
        <Motion.div
          className="grid gap-6 lg:grid-cols-3"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={recentStoriesViewport}
        >
          {blogsError ? (
            <p role="alert" className="text-sm text-red-600">{blogsError}</p>
          ) : blogs.length ? (
            blogs.slice(0, 3).map((blog) => (
              <BlogCard blog={blog} key={getId(blog)} />
            ))
          ) : (
            <p className="text-sm text-ink/50">No stories have been published yet.</p>
          )}
        </Motion.div>
      </Motion.section>

      <Motion.section
        className="page-shell pb-20 sm:pb-24"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={reveal}
        transition={transition}
      >
        <Motion.div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/60 p-6 shadow-soft backdrop-blur-xl sm:p-12" variants={reveal} transition={transition}>
          <div className="mb-10 max-w-xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-coral">What you can do</p>
            <h2 className="font-display text-4xl sm:text-5xl">Share and discover stories.</h2>
          </div>
          <Motion.div
            className="grid gap-8 md:grid-cols-3"
            variants={stagger}
          >
            {features.map(({ Icon, title, text, iconClassName = '' }) => (
              <Motion.div key={title} className="group" variants={reveal} transition={transition}>
                <span className={`mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-sage/70 text-coral transition duration-300 group-hover:-translate-y-1 group-hover:scale-105 ${iconClassName}`}>
                  <Icon size={22} />
                </span>
                <h3 className="font-display text-2xl">{title}</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-ink/60">{text}</p>
              </Motion.div>
            ))}
          </Motion.div>
        </Motion.div>
      </Motion.section>

      <Motion.section
        className="page-shell pb-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        variants={reveal}
        transition={transition}
      >
        <Motion.div className="relative isolate overflow-hidden rounded-[2rem] bg-[#10172b] px-6 py-14 text-center text-white shadow-soft sm:px-12 sm:py-16" variants={reveal} transition={transition}>
          <div aria-hidden="true" className="absolute -right-20 -top-32 -z-10 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-40 -left-16 -z-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="relative mx-auto max-w-3xl rounded-3xl bg-[#d0d2da] px-6 py-10 text-black shadow-xl sm:px-12 sm:py-12">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-black">Get started</p>
            <h2 className="mx-auto mt-4 max-w-2xl font-display text-4xl text-black sm:text-5xl">Create an account to publish and discuss stories.</h2>
            <Link to="/signup" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-cyan-100">
              Create an account <ArrowRight size={16} />
            </Link>
          </div>
        </Motion.div>
      </Motion.section>
    </>
  );
}

export default LandingPage;
