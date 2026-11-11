import PublicFooter from '@/components/public-footer';
import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart,
    Boxes,
    Cloud,
    Layers,
    Shield,
    Zap,
} from 'lucide-react';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;

    // SEO Metadata
    const pageTitle = 'Nexus Inventory | Inventory Management & Analytics';
    const pageDescription =
        'Track stock levels, inventory value, and product performance from one intuitive dashboard. Manage quantities, statuses, tags, and bulk imports with confidence.';
    const pageKeywords =
        'inventory management application, stock tracking, inventory value, product database, admin dashboard, SaaS tool';

    return (
        <>
            <Head title={pageTitle}>
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700"
                    rel="stylesheet"
                />
                <meta name="description" content={pageDescription} />
                <meta name="keywords" content={pageKeywords} />
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={pageDescription} />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={pageTitle} />
                <meta name="twitter:description" content={pageDescription} />
                <script type="application/ld+json">
                    {JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'SoftwareApplication',
                        name: 'Nexus Inventory',
                        description: pageDescription,
                        applicationCategory: 'BusinessApplication',
                        offers: {
                            '@type': 'Offer',
                            price: '0',
                            priceCurrency: 'USD',
                        },
                        featureList: [
                            'Real-time Stock Quantity Tracking',
                            'Inventory Value Analytics',
                            'Bulk Import/Export',
                            'Smart Filtering & Sorting',
                            'Secure Data Management',
                            'Responsive Dashboard',
                        ],
                    })}
                </script>
            </Head>

            <div className="min-h-screen bg-linear-to-br from-gray-50 to-white text-gray-900 dark:from-gray-900 dark:to-gray-950 dark:text-gray-100">
                {/* Navigation */}
                <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            {/* Logo Section */}
                            <div className="flex shrink-0 items-center">
                                <Boxes className="h-6 w-6 text-blue-600 sm:h-8 sm:w-8 dark:text-blue-400" />
                                <span className="ml-2 text-lg font-bold sm:text-xl">
                                    Nexus Inventory
                                </span>
                            </div>

                            {/* Navigation Section */}
                            <nav className="flex items-center space-x-2 sm:space-x-4">
                                <Link
                                    href="/blog"
                                    className="rounded-lg px-2 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 sm:px-4 dark:text-gray-300"
                                >
                                    Blog
                                </Link>
                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700 sm:px-4"
                                    >
                                        <span className="hidden sm:inline">
                                            Go to Dashboard
                                        </span>
                                        <span className="sm:hidden">
                                            Dashboard
                                        </span>
                                        <ArrowRight className="ml-1 h-4 w-4 sm:ml-2" />
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={login()}
                                            className="rounded-lg px-2 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 sm:px-4 dark:text-gray-300"
                                        >
                                            Sign In
                                        </Link>
                                        {canRegister && (
                                            <Link
                                                href={register()}
                                                className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700 sm:px-4"
                                            >
                                                {/* Text changes on mobile to save space */}
                                                <span className="hidden sm:inline">
                                                    Get Started Free
                                                </span>
                                                <span className="sm:hidden">
                                                    Join
                                                </span>
                                                <ArrowRight className="ml-1 h-4 w-4 sm:ml-2" />
                                            </Link>
                                        )}
                                    </>
                                )}
                            </nav>
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <main>
                    <section className="relative overflow-hidden pt-20 pb-32 sm:pt-32">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="text-center">
                                <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                                    Master Your
                                    <span className="block text-blue-600 dark:text-blue-400">
                                        Inventory Universe
                                    </span>
                                </h1>
                                <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
                                    Track stock, inventory value, and product
                                    performance from one intuitive dashboard.
                                    Built for teams that need accurate numbers,
                                    not guesswork.
                                </p>
                                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                                    <Link
                                        href={
                                            canRegister ? register() : login()
                                        }
                                        className="inline-flex items-center rounded-xl bg-blue-600 px-8 py-3 text-base font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                                    >
                                        Start Free Trial
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                    <Link
                                        href="#features"
                                        className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-8 py-3 text-base font-semibold text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                                    >
                                        View Features
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Features Section */}
                    <section
                        id="features"
                        className="bg-gray-50 py-20 dark:bg-gray-900"
                    >
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="text-center">
                                <h2 className="text-3xl font-bold sm:text-4xl">
                                    Everything You Need for Inventory Management
                                </h2>
                                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                                    Packed with features that make inventory
                                    management effortless
                                </p>
                            </div>

                            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                                <FeatureCard
                                    icon={
                                        <Boxes className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                    }
                                    title="Complete Inventory Operations"
                                    description="Create, read, update, and delete products with stock quantities, statuses, and real-time validation."
                                />
                                <FeatureCard
                                    icon={
                                        <BarChart className="h-8 w-8 text-green-600 dark:text-green-400" />
                                    }
                                    title="Advanced Filtering & Sorting"
                                    description="Smart search, price range filters, and multi-field sorting for efficient product discovery."
                                />
                                <FeatureCard
                                    icon={
                                        <Layers className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                                    }
                                    title="Bulk Import/Export"
                                    description="Import products via CSV/Excel and export data in multiple formats for seamless integration."
                                />
                                <FeatureCard
                                    icon={
                                        <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
                                    }
                                    title="Secure & Reliable"
                                    description="Enterprise-grade security with role-based access control and data encryption."
                                />
                                <FeatureCard
                                    icon={
                                        <Zap className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                                    }
                                    title="Lightning Fast"
                                    description="Optimized for performance with instant search results and smooth navigation."
                                />
                                <FeatureCard
                                    icon={
                                        <Cloud className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                                    }
                                    title="Cloud Ready"
                                    description="Access your product data anywhere, anytime. Automatic backups and sync across devices."
                                />
                            </div>
                        </div>
                    </section>

                    {/* How It Works */}
                    <section className="py-20">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="text-center">
                                <h2 className="text-3xl font-bold sm:text-4xl">
                                    Simple Yet Powerful Workflow
                                </h2>
                                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                                    Get started in minutes, master in hours
                                </p>
                            </div>

                            <div className="mt-16">
                                <div className="grid gap-8 lg:grid-cols-3">
                                    <StepCard
                                        number="01"
                                        title="Add Your Products"
                                        description="Easily add products with images, descriptions, prices, quantities, statuses, and tags. Bulk import available."
                                    />
                                    <StepCard
                                        number="02"
                                        title="Organize & Manage"
                                        description="Use advanced filtering, sorting, and search to manage your inventory efficiently."
                                    />
                                    <StepCard
                                        number="03"
                                        title="Analyze & Export"
                                        description="Generate reports, export data, and gain insights into your product catalog."
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="bg-linear-to-r from-blue-600 to-indigo-600 py-20">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="text-center">
                                <h2 className="text-3xl font-bold text-white sm:text-4xl">
                                    Ready to Transform Your Inventory
                                    Management?
                                </h2>
                                <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">
                                    Join thousands of businesses managing their
                                    products efficiently with our platform.
                                </p>
                                <div className="mt-10">
                                    <Link
                                        href={
                                            canRegister ? register() : login()
                                        }
                                        className="inline-flex items-center rounded-xl bg-white px-8 py-3 text-base font-semibold text-blue-600 hover:bg-blue-50"
                                    >
                                        Start Your Free Trial
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                {/* Footer */}
                <PublicFooter />
            </div>
        </>
    );
}

// Feature Card Component
function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4">{icon}</div>
            <h3 className="mb-2 text-xl font-semibold">{title}</h3>
            <p className="text-gray-600 dark:text-gray-300">{description}</p>
        </div>
    );
}

// Step Card Component
function StepCard({
    number,
    title,
    description,
}: {
    number: string;
    title: string;
    description: string;
}) {
    return (
        <div className="relative rounded-xl bg-white p-8 shadow-sm dark:bg-gray-800">
            <div className="absolute -top-4 left-8 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white dark:bg-blue-500">
                <span className="text-lg font-bold">{number}</span>
            </div>
            <h3 className="mt-8 text-xl font-semibold">{title}</h3>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
                {description}
            </p>
        </div>
    );
}
