import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertCircle } from 'lucide-react';
import { Button } from './button';
import { saveAs } from 'file-saver';

interface ImportError {
    row: number;
    attribute: string;
    errors: string[];
    values: Record<string, unknown>;
}

interface ImportPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    errors: ImportError[];
    onConfirm?: () => void;
}

export function ImportPreviewModal({ isOpen, onClose, errors }: ImportPreviewModalProps) {
    if (!errors || errors.length === 0) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertCircle size={20} />
                        Import Validation Errors
                    </DialogTitle>
                    <DialogDescription>
                        Found {errors.length} error(s) in your import file. Please fix these and try again.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {errors.map((error, index) => (
                        <div key={index} className="p-3 border border-red-200 rounded-lg bg-red-50">
                            <div className="font-medium text-red-800">
                                Row {error.row}: {error.attribute}
                            </div>
                            <div className="mt-1 text-sm text-red-600">
                                {error.errors.map((err, i) => (
                                    <div key={i}>• {err}</div>
                                ))}
                            </div>
                            <div className="mt-2 text-xs text-gray-600">
                                <strong>Values:</strong> {JSON.stringify(error.values)}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    <Button variant="destructive" onClick={() => {
                        // Download errors as JSON for debugging
                        const blob = new Blob([JSON.stringify(errors, null, 2)], { type: 'application/json' });
                        saveAs(blob, `import_errors_${Date.now()}.json`);
                    }}>
                        Download Error Report
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
