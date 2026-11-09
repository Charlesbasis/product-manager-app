import { PriceFilterProps } from "@/types";
import React from "react";
// import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export const PriceFilter = ({ min_price, max_price, onPriceChange, className }: PriceFilterProps) => {

    const minPriceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const maxPriceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleMinPriceChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // console.log('🔢 Min Price changed:', value);

        if (minPriceTimeoutRef.current) {
            clearTimeout(minPriceTimeoutRef.current);
        }

        minPriceTimeoutRef.current = setTimeout(() => {
            onPriceChange(value, max_price ?? '');
        }, 500);
    }, [onPriceChange, max_price]);

    const handleMaxPriceChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // console.log('🔢 Max Price changed:', value);

        if (maxPriceTimeoutRef.current) {
            clearTimeout(maxPriceTimeoutRef.current);
        }

        maxPriceTimeoutRef.current = setTimeout(() => {
            onPriceChange(min_price ?? '', value);
        }, 500);
    }, [onPriceChange, min_price]);

    const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // console.log('⏹️ Prevented form submission on Enter');

            if (minPriceTimeoutRef.current) {
                clearTimeout(minPriceTimeoutRef.current);
            }
            if (maxPriceTimeoutRef.current) {
                clearTimeout(maxPriceTimeoutRef.current);
            }
            onPriceChange(min_price ?? '', max_price ?? '');
        }
    }, [min_price, max_price, onPriceChange]);

    return (
        <div className={className}>
            {/* <Label
                htmlFor="min_price"
                className="block text-sm font-medium text-gray-700"
            >
                Price Range
            </Label> */}
            <div className="flex items-center gap-2">
                <div className="flex-1">
                    <Input
                        value={min_price}
                        onChange={handleMinPriceChange}
                        type="number"
                        name="min_price"
                        id="min_price"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        onKeyDown={handleKeyDown}
                        placeholder="Enter Min. Price"
                    />
                </div>
                <span className="text-gray-500">to</span>
                <div className="flex-1">
                    <Input
                        value={max_price}
                        onChange={handleMaxPriceChange}
                        type="number"
                        name="max_price"
                        id="max_price"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        onKeyDown={handleKeyDown}
                        placeholder="Enter Max. Price"
                    />
                </div>
            </div>
        </div>
    );
}
