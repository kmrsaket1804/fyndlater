import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, Tag } from 'lucide-react';
import { getAllPosts, getAllCategories, type BlogPostMeta } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Blog — FyndLater',
  description:
    'Tips, product updates, and ideas on saving, organizing, and retrieving your content with AI.',
};

function PostCard({ post }: { post: BlogPostMeta }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-3xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-violet-100 transition-all"
    >
      {post.image && (
        <div className="aspect-[16/9] bg-gradient-to-br from-violet-100 to-pink-50 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center text-violet-300 text-sm">
            {post.category}
          </div>
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-violet-700 font-medium">
            <Tag className="h-3 w-3" />
            {post.category}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {post.readingTime}
          </span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 group-hover:text-violet-700 transition-colors line-clamp-2">
          {post.title}
        </h2>
        <p className="mt-2 text-sm text-gray-600 line-clamp-3 flex-1">
          {post.description}
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
          <Calendar className="h-3 w-3" />
          {new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>
    </Link>
  );
}

function CategoryFilter({ categories }: { categories: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/blog"
        className="rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-sm font-medium text-violet-700 transition-colors hover:bg-violet-100"
      >
        All
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat}
          href={`/blog?category=${encodeURIComponent(cat)}`}
          className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
        >
          {cat}
        </Link>
      ))}
    </div>
  );
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const allPosts = getAllPosts();
  const categories = getAllCategories();
  const posts = category
    ? allPosts.filter((p) => p.category === category)
    : allPosts;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
          Blog
        </h1>
        <p className="mt-3 text-lg text-gray-600">
          Tips on saving smarter, product updates, and ideas for getting more
          from your content.
        </p>
      </div>

      <div className="mb-8">
        <CategoryFilter categories={categories} />
      </div>

      {posts.length === 0 ? (
        <p className="text-gray-500 text-center py-12">
          No posts found{category ? ` in "${category}"` : ''}.
        </p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </main>
  );
}
