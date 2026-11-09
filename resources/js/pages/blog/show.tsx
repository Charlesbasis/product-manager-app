import { Head, Link } from '@inertiajs/react';
import { Boxes, ArrowLeft, Calendar } from 'lucide-react';
import PublicFooter from '@/components/public-footer';

interface Post {
    id: number;
    title: string;
    content: string;
    date: string;
    featured_image: string | null;
}

export default function BlogPost({ post }: { post: Post }) {
    return (
        <>
            <Head title={`${post.title} | Blog`} />

            <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
                <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            <Link href="/" className="flex items-center">
                                <Boxes className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                <span className="ml-2 text-lg font-bold">Nexus Inventory</span>
                            </Link>
                            <Link href="/blog" className="inline-flex items-center text-sm font-medium hover:text-blue-600">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Blog
                            </Link>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
                    <article>
                        <header className="mb-8">
                            <div className="mb-4 flex items-center text-sm text-slate-500">
                                <Calendar className="mr-2 h-4 w-4" />
                                {post.date}
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                                {post.title}
                            </h1>
                        </header>

                        {post.featured_image && (
                            <div className="mb-10 overflow-hidden rounded-2xl shadow-lg">
                                <img
                                    src={post.featured_image}
                                    alt={post.title}
                                    className="w-full"
                                />
                            </div>
                        )}

                        <div
                            className="prose prose-lg dark:prose-invert prose-blue max-w-none prose-img:rounded-xl prose-headings:text-slate-900 dark:prose-headings:text-white"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                    </article>

                    <div className="mt-16 border-t border-slate-200 py-8 dark:border-slate-800">
                        <Link
                            href="/blog"
                            className="inline-flex items-center font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Return to Blog
                        </Link>
                    </div>
                </main>
                <PublicFooter />
            </div>
        </>
    );
}
