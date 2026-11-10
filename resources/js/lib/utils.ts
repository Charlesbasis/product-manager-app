import { InertiaLinkProps } from '@inertiajs/react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function isSameUrl(
    url1: NonNullable<InertiaLinkProps['href']>,
    url2: NonNullable<InertiaLinkProps['href']>,
) {
    return resolveUrl(url1) === resolveUrl(url2);
}

export function resolveUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

export const normalizeTag = (tag: string) => tag.trim().toLowerCase();

export const generateTagSlug = (tag: string) => {
    return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export const validateTagName = (tag: string) : { isValid: boolean, errors: string[] } => {
    const errors: string[] = [];

    if (!tag.trim()) {
        errors.push("Tag cannot be empty");
    }

    if (tag.length > 50) {
        errors.push("Tag cannot be longer than 20 characters");
    }

    if (!/^[a-z0-9-_]+$/i.test(tag.trim())) {
        errors.push("Tag can only contain letters, numbers, dashes, and underscores");
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

export const exportToCsv = (data: Parameters<typeof Papa.unparse>[0], filename: string) => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}_${Date.now()}.csv`);
};

export const parseCSV = (file: File): Promise<Record<string, unknown>[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse<Record<string, unknown>>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                resolve(results.data);
            },
            error: (error) => {
                reject(error);
            },
        });
    });
};

export const validateImportData = (data: Array<Record<string, unknown>>) => {
    const errors: string[] = [];

    data.forEach((row, index) => {
        const rowNumber = index + 2;
        const name = typeof row.name === 'string' ? row.name.trim() : '';
        const price = typeof row.price === 'string' ? row.price.trim() : row.price;
        const priceNumber = typeof price === 'number' ? price : Number(price);

        if (name === '') {
            errors.push(`Row ${rowNumber}: Name cannot be empty`);
        }

        if (price === undefined || price === null || price === '') {
            errors.push(`Row ${rowNumber}: Price cannot be empty`);
        } else if (isNaN(priceNumber)) {
            errors.push(`Row ${rowNumber}: Price must be a number`);
        } else if (priceNumber < 0) {
            errors.push(`Row ${rowNumber}: Price cannot be negative`);
        }

        if (row.image_url && typeof row.image_url !== 'string') {
            errors.push(`Row ${rowNumber}: Image URL must be a string`);
        }
    });

    return errors;
};

export const isValidUrl = (url: string) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};
