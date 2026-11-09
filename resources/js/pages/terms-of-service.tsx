import { Head, Link } from '@inertiajs/react';
import { Boxes, ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
    const pageTitle = "Terms of Service | Nexus Inventory";
    const pageDescription = "Read the terms and conditions for using Nexus Inventory services.";

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
                        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-8 border-b pb-4">Terms of Service</h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-8 italic">Last Updated: March 1, 2026</p>

                        <section className="mb-10">
                            <h2 className="text-2xl font-bold mb-4">1. Agreement to Terms</h2>
                            <p>
                                By accessing or using Nexus Inventory, you agree to be bound by these terms. If you do not agree to all the terms and conditions of this agreement, then you may not access the website or use any services.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
                            <p>
                                Nexus Inventory provides users with a comprehensive inventory management tool that allows them to create, read, update, and delete product data, track stock quantities, and perform bulk operations.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-2xl font-bold mb-4">3. User Obligations</h2>
                            <p>
                                You are responsible for ensuring your use of the website and services is in compliance with all applicable laws and regulations. You may not use Nexus Inventory for any illegal or unauthorized purpose.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-2xl font-bold mb-4">4. Intellectual Property</h2>
                            <p>
                                All content, trademarks, and logos displayed on Nexus Inventory are the property of their respective owners. You may not use, reproduce, or distribute any content without prior written permission.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-2xl font-bold mb-4">5. Disclaimer of Liability</h2>
                            <p>
                                Nexus Inventory is provided "as is" without any warranties. We shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the service.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-2xl font-bold mb-4">6. Changes to Terms</h2>
                            <p>
                                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any substantial changes on the website.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-2xl font-bold mb-4">7. Contact Us</h2>
                            <p>
                                If you have any questions about these Terms, please contact us at:
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
