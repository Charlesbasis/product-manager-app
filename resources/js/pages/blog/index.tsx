import { Head, Link } from '@inertiajs/react';
import { Boxes, ArrowRight, Calendar } from 'lucide-react';
import PublicFooter from '@/components/public-footer';

interface Post {
    id: number;
    title: string;
    excerpt: string;
    date: string;
    slug: string;
    featured_image: string | null;
}

export default function BlogIndex({ posts, error }: { posts: Post[], error?: string }) {
    return (
        <>
            <Head title="Blog | Nexus Inventory" />

            <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
                {/* Simple Nav */}
                <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            <Link href="/" className="flex items-center">
                                <Boxes className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                <span className="ml-2 text-lg font-bold">Nexus Inventory</span>
                            </Link>
                            <Link href="/" className="text-sm font-medium hover:text-blue-600">Home</Link>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                    <div className="mb-12 text-center">
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white sm:text-5xl">Latest from our Blog</h1>
                        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">Insights, updates, and guides from the Nexus Inventory team.</p>
                    </div>

                    {error && (
                        <div className="rounded-lg bg-red-50 p-4 text-center text-red-600 dark:bg-red-900/20 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {posts.map((post) => (
                            <article key={post.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                                {post.featured_image && (
                                    <div className="aspect-video w-full overflow-hidden">
                                        <img
                                            src={post.featured_image}
                                            alt={post.title}
                                            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                                        />
                                    </div>
                                )}
                                <div className="flex flex-1 flex-col p-6">
                                    <div className="mb-3 flex items-center text-sm text-slate-500">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        {post.date}
                                    </div>
                                    <h2 className="mb-4 text-xl font-bold leading-tight text-slate-900 dark:text-white line-clamp-2">
                                        {post.title}
                                    </h2>
                                    <div
                                        className="mb-6 text-slate-600 dark:text-slate-400 line-clamp-3 prose prose-sm dark:prose-invert"
                                        dangerouslySetInnerHTML={{ __html: post.excerpt }}
                                    />
                                    <div className="mt-auto">
                                        <Link
                                            href={`/blog/${post.slug}`}
                                            className="inline-flex items-center font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            Read More
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    {posts.length === 0 && !error && (
                        <div className="py-20 text-center text-slate-500">
                            No posts found at the moment.
                        </div>
                    )}
                </main>
                <PublicFooter />
            </div>
        </>
    );
}
