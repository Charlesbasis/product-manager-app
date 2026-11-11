import { Link } from '@inertiajs/react';
import { Boxes } from 'lucide-react';

export default function PublicFooter() {
    return (
        <footer className="border-t border-gray-200 bg-gray-50 py-12 dark:border-gray-800 dark:bg-gray-900">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                    <div className="flex items-center">
                        <Boxes className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        <span className="ml-2 text-lg font-bold">
                            Nexus Inventory
                        </span>
                    </div>

                    <div className="flex flex-col items-center gap-4 text-sm text-gray-600 md:flex-row md:gap-8 dark:text-gray-400">
                        <p>
                            © {new Date().getFullYear()} Nexus Inventory by{' '}
                            <a
                                href="https://www.cvhowlader.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold hover:text-blue-600"
                            >
                                CVHowlader
                            </a>
                            . All rights reserved.
                        </p>
                        <nav className="flex gap-4">
                            <Link
                                href="/privacy-policy"
                                className="transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                            >
                                Privacy Policy
                            </Link>
                            <Link
                                href="/terms-of-service"
                                className="transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                            >
                                Terms of Service
                            </Link>
                            <Link
                                href="/cookie-policy"
                                className="transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                            >
                                Cookie Policy
                            </Link>
                        </nav>
                    </div>
                </div>
            </div>
        </footer>
    );
}
