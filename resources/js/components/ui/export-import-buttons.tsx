import axiosInstance from '@/lib/axios';
import axios from 'axios';
import { router } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Download, Upload, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { Button } from './button';

interface ExportImportButtonsProps {
    filters: {
        search?: string;
        min_price?: string;
        max_price?: string;
        sort?: string;
        direction?: string;
    };
}

interface ImportFailure {
    row?: number;
    attribute?: string;
    errors?: string[];
    values?: Record<string, unknown>;
}

type ImportError = ImportFailure | string;

interface ImportResult {
    success: boolean;
    message: string;
    errors?: ImportError[];
}

export function ExportImportButtons({ filters }: ExportImportButtonsProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);

    const handleExport = () => {
        // Build query string from filters
        const queryParams = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                queryParams.append(key, value.toString());
            }
        });
        
        window.location.href = `/products/export?${queryParams.toString()}`;
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setImportResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axiosInstance.post('/products/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                    console.log(`Upload Progress: ${percentCompleted}%`)
                },
            });

            const result = await response.data;
            
            setImportResult(result);

            if (result.success) {
                // Refresh the page to show imported products
                setTimeout(() => {
                    router.reload({ only: ['products'] });
                }, 1500);
            }
        } catch (error) {
            console.error('Error importing file:', error);

            if (axios.isAxiosError(error)) {
                const data = error.response?.data as { errors?: ImportError[] } | undefined;

                setImportResult({
                    success: false,
                    message: 'Failed to import file. Please try again.',
                    errors: data?.errors ?? [error.message],
                });
            } else {
                setImportResult({
                    success: false,
                    message: 'Failed to import file. Please try again.',
                    errors: [error instanceof Error ? error.message : String(error)],
                });
            }
        } finally {
            setIsImporting(false);
            // Clear file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="flex items-center gap-2">
            {/* Export Button */}
            <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="cursor-pointer flex items-center gap-2"
            >
                <Download size={16} />
                Export
            </Button>

            {/* Import Button */}
            <Button
                variant="outline"
                size="sm"
                onClick={handleImportClick}
                disabled={isImporting}
                className="cursor-pointer flex items-center gap-2"
            >
                <Upload size={16} />
                {isImporting ? 'Importing...' : 'Import'}
            </Button>

            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx,.xls,.csv"
                className="hidden"
            />

            {/* Import Result Messages */}
            {importResult && (
                <div className={`ml-2 p-2 rounded text-sm flex items-center gap-2 ${
                    importResult.success 
                        ? 'bg-green-50 text-green-800 border border-green-200' 
                        : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                    {importResult.success ? (
                        <CheckCircle size={16} className="text-green-600" />
                    ) : (
                        <AlertCircle size={16} className="text-red-600" />
                    )}
                    <span>{importResult.message}</span>
                    <button 
                        // onClick={clearResult}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                    >
                        <X size={16} className="mr-2" /> Clear
                    </button>
                </div>
            )}
        </div>
    );
}
