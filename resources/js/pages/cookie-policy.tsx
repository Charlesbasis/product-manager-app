import { Head, Link } from '@inertiajs/react';
import { Boxes, ArrowLeft } from 'lucide-react';

export default function CookiePolicy() {
    const pageTitle = "Cookie Policy | Nexus Inventory";
    const pageDescription = "Information about how we use cookies and similar technologies on Nexus Inventory.";

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
                            <Link href="/" className="flex items-center shrink-0">
                                <Boxes className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                <span className="ml-2 text-lg font-bold">Nexus Inventory</span>
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
                    <article className="prose prose-blue max-w-none dark:prose-invert">
                        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-8 border-b pb-4">Cookie Policy</h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-8 italic">Last Updated: March 1, 2026</p>

                        <section className="mb-10">
                            <h2 className="text-2xl font-bold mb-4">1. What are Cookies?</h2>
                            <p>
                                Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the owners of the site.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-2xl font-bold mb-4">2. How We Use Cookies</h2>
                            <p>
                                We use cookies for several reasons, including:
                            </p>
                            <ul className="list-disc pl-5 mt-4 space-y-2">
                                <li><strong>Essential Cookies:</strong> Necessary for the website to function properly.</li>
                                <li><strong>Performance Cookies:</strong> Help us understand how visitors interact with our website.</li>
                                <li><strong>Functionality Cookies:</strong> Allow the website to remember choices you make (such as your user name).</li>
                                <li><strong>Targeting Cookies:</strong> Used to deliver advertisements more relevant to you and your interests.</li>
                            </ul>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-2xl font-bold mb-4">3. Managing Cookies</h2>
                            <p>
                                Most web browsers allow some control of most cookies through the browser settings. To find out more about cookies, including how to see what cookies have been set, visit <a href="https://www.aboutcookies.org" target="_blank" rel="noopener noreferrer">aboutcookies.org</a> or <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer">allaboutcookies.org</a>.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-2xl font-bold mb-4">4. Updates to This Policy</h2>
                            <p>
                                We may update this Cookie Policy from time to time in order to reflect changes to the cookies we use or for other operational, legal or regulatory reasons.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-2xl font-bold mb-4">5. Contact Us</h2>
                            <p>
                                If you have any questions about our use of cookies, please contact us at:
                            </p>
                            <p className="mt-4 font-semibold">
                                Email: info@cvhowlader.com
                            </p>
                        </section>
                    </article>
                </main>

                <footer className="border-t border-gray-200 bg-gray-50 py-8 dark:border-gray-800 dark:bg-gray-900">
                    <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-600 dark:text-gray-400">
                        © {new Date().getFullYear()} Nexus Inventory. All rights reserved.
                    </div>
                </footer>
            </div>
        </>
    );
}
