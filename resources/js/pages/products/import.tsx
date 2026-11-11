import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle,
    FileSpreadsheet,
    Upload,
} from 'lucide-react';
import React, { useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Products',
        href: '/products',
    },
    {
        title: 'Import Products',
        href: '/products/import',
    },
];

export default function ImportProducts() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<{
        success: boolean;
        message: string;
        count?: number;
        errors?: string[];
    } | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setImportResult(null);
        }
    };

    const handleImport = async () => {
        if (!selectedFile) return;

        setIsImporting(true);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            router.post('/products/import', formData, {
                forceFormData: true,
                onSuccess: (page) => {
                    const flash = page.props.flash as
                        | { count?: number }
                        | undefined;

                    setImportResult({
                        success: true,
                        message: 'Products imported successfully!',
                        count: flash?.count,
                    });
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                },
                onError: (errors) => {
                    setImportResult({
                        success: false,
                        message:
                            'Import failed. Please check the errors below.',
                        errors: errors.file
                            ? Array.isArray(errors.file)
                                ? errors.file
                                : [errors.file]
                            : [],
                    });
                },
            });
        } catch {
            setImportResult({
                success: false,
                message: 'An unexpected error occurred. Please try again.',
            });
        } finally {
            setIsImporting(false);
        }
    };

    const downloadTemplate = () => {
        window.location.href = '/products/import/template';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Import Products" />

            <div className="container mx-auto max-w-4xl p-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload size={24} />
                            Import Products
                        </CardTitle>
                        <CardDescription>
                            Upload an Excel or CSV file to import products into
                            the system
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* File Upload Area */}
                        <div
                            className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-8 text-center transition-colors hover:border-gray-400"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept=".xlsx,.xls,.csv"
                                className="hidden"
                            />

                            <Upload
                                size={48}
                                className="mx-auto mb-4 text-gray-400"
                            />

                            {selectedFile ? (
                                <div>
                                    <p className="font-medium text-gray-700">
                                        {selectedFile.name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {(selectedFile.size / 1024).toFixed(2)}{' '}
                                        KB
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p className="font-medium text-gray-700">
                                        Click to select a file
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Supports .xlsx, .xls, .csv files (max
                                        5MB)
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Instructions */}
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                            <h3 className="mb-2 font-medium text-blue-800">
                                Import Instructions:
                            </h3>
                            <ul className="list-inside list-disc space-y-1 text-sm text-blue-700">
                                <li>
                                    Download the template file first to see the
                                    required format
                                </li>
                                <li>
                                    Required fields: <strong>Name</strong> and{' '}
                                    <strong>Price</strong>
                                </li>
                                <li>Price must be a number (e.g., 19.99)</li>
                                <li>
                                    Quantity must be a whole number (optional,
                                    defaults to 1)
                                </li>
                                <li>
                                    Status must be active, draft, or archived
                                    (optional, defaults to active)
                                </li>
                                <li>
                                    Image URL must be a valid URL (optional)
                                </li>
                                <li>
                                    Tags can be comma-separated values
                                    (optional)
                                </li>
                                <li>
                                    Do not modify the header row in the template
                                </li>
                            </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3">
                            <Button
                                onClick={downloadTemplate}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <FileSpreadsheet size={16} />
                                Download Template
                            </Button>

                            <Button
                                onClick={handleImport}
                                disabled={!selectedFile || isImporting}
                                className="flex items-center gap-2"
                            >
                                {isImporting ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={16} />
                                        Import Products
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Import Results */}
                        {importResult && (
                            <div
                                className={`rounded-lg border p-4 ${
                                    importResult.success
                                        ? 'border-green-200 bg-green-50 text-green-800'
                                        : 'border-red-200 bg-red-50 text-red-800'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    {importResult.success ? (
                                        <CheckCircle
                                            size={20}
                                            className="mt-0.5 flex-shrink-0"
                                        />
                                    ) : (
                                        <AlertCircle
                                            size={20}
                                            className="mt-0.5 flex-shrink-0"
                                        />
                                    )}
                                    <div>
                                        <p className="font-medium">
                                            {importResult.message}
                                        </p>
                                        {importResult.count && (
                                            <p className="mt-1 text-sm">
                                                Successfully imported{' '}
                                                {importResult.count} product(s)
                                            </p>
                                        )}
                                        {importResult.errors &&
                                            importResult.errors.length > 0 && (
                                                <div className="mt-2">
                                                    <p className="text-sm font-medium">
                                                        Errors:
                                                    </p>
                                                    <ul className="mt-1 list-inside list-disc text-sm">
                                                        {importResult.errors.map(
                                                            (error, index) => (
                                                                <li key={index}>
                                                                    {error}
                                                                </li>
                                                            ),
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
