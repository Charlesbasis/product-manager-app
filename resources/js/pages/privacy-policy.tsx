import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Boxes } from 'lucide-react';

export default function PrivacyPolicy() {
    const pageTitle = 'Privacy Policy | Nexus Inventory';
    const pageDescription =
        'Learn how we handle and protect your personal data at Nexus Inventory.';

    return (
        <>
            <Head title={pageTitle}>
                <meta name="description" content={pageDescription} />
                <meta name="robots" content="index, follow" />
            </Head>

            <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
                <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            <Link
                                href="/"
                                className="flex shrink-0 items-center"
                            >
                                <Boxes className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                <span className="ml-2 text-lg font-bold">
                                    Nexus Inventory
                                </span>
                            </Link>
                            <Link
                                href="/"
                                className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
                    <article className="prose prose-blue dark:prose-invert max-w-none">
                        <h1 className="mb-8 border-b pb-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                            Privacy Policy
                        </h1>
                        <p className="mb-8 text-gray-600 italic dark:text-gray-400">
                            Last Updated: March 1, 2026
                        </p>

                        <section className="mb-10">
                            <h2 className="mb-4 text-2xl font-bold">
                                1. Introduction
                            </h2>
                            <p>
                                Welcome to Nexus Inventory. We respect your
                                privacy and are committed to protecting your
                                personal data. This privacy policy will inform
                                you as to how we look after your personal data
                                when you visit our website and tell you about
                                your privacy rights and how the law protects
                                you.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="mb-4 text-2xl font-bold">
                                2. Data We Collect
                            </h2>
                            <p>
                                We may collect, use, store and transfer
                                different kinds of personal data about you which
                                we have grouped together as follows:
                            </p>
                            <ul className="mt-4 list-disc space-y-2 pl-5">
                                <li>
                                    <strong>Identity Data:</strong> includes
                                    first name, last name, username or similar
                                    identifier.
                                </li>
                                <li>
                                    <strong>Contact Data:</strong> includes
                                    email address and telephone numbers.
                                </li>
                                <li>
                                    <strong>Technical Data:</strong> includes
                                    internet protocol (IP) address, your login
                                    data, browser type and version, time zone
                                    setting and location.
                                </li>
                                <li>
                                    <strong>Usage Data:</strong> includes
                                    information about how you use our website,
                                    products and services.
                                </li>
                            </ul>
                        </section>

                        <section className="mb-10">
                            <h2 className="mb-4 text-2xl font-bold">
                                3. How We Use Your Data
                            </h2>
                            <p>
                                We will only use your personal data when the law
                                allows us to. Most commonly, we will use your
                                personal data in the following circumstances:
                            </p>
                            <ul className="mt-4 list-disc space-y-2 pl-5">
                                <li>
                                    Where we need to perform the contract we are
                                    about to enter into or have entered into
                                    with you.
                                </li>
                                <li>
                                    Where it is necessary for our legitimate
                                    interests and your interests and fundamental
                                    rights do not override those interests.
                                </li>
                                <li>
                                    Where we need to comply with a legal
                                    obligation.
                                </li>
                            </ul>
                        </section>

                        <section className="mb-10">
                            <h2 className="mb-4 text-2xl font-bold">
                                4. Data Security
                            </h2>
                            <p>
                                We have put in place appropriate security
                                measures to prevent your personal data from
                                being accidentally lost, used or accessed in an
                                unauthorized way, altered or disclosed.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="mb-4 text-2xl font-bold">
                                5. Contact Us
                            </h2>
                            <p>
                                If you have any questions about this privacy
                                policy or our privacy practices, please contact
                                us at:
                            </p>
                            <p className="mt-4 font-semibold">
                                Email: info@cvhowlader.com
                            </p>
                        </section>
                    </article>
                </main>

                <footer className="border-t border-gray-200 bg-gray-50 py-8 dark:border-gray-800 dark:bg-gray-900">
                    <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-600 dark:text-gray-400">
                        © {new Date().getFullYear()} Nexus Inventory. All rights
                        reserved.
                    </div>
                </footer>
            </div>
        </>
    );
}
