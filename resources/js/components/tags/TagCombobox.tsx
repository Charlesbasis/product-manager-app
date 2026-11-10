import { TagComboboxProps } from '@/types';
import {
    Combobox,
    ComboboxInput,
    ComboboxOption,
    ComboboxOptions,
} from '@headlessui/react';
import { X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';

export const TagCombobox = ({
    initialTags,
    availableTags,
    onTagsChange,
    isViewMode = false,
    isSubmitting = false,
    maxTags = 20,
    errors,
}: TagComboboxProps) => {
    const [tags, setTags] = useState<string[]>(initialTags);
    const [query, setQuery] = useState('');

    const filteredAvailableTags = availableTags.filter(
        (tag) =>
            !tags.includes(tag) &&
            tag.toLowerCase().includes(query.toLowerCase()),
    );

    const handleAddTag = (newTag: string) => {
        if (isSubmitting || tags.length >= maxTags) return;

        const trimmedTag = newTag.trim();
        if (!trimmedTag || tags.includes(trimmedTag)) return;

        const newTags = [...tags, trimmedTag];
        setTags(newTags);
        onTagsChange(newTags);
        setQuery('');
    };

    const handleRemoveTag = (tagToRemove: string) => {
        const newTags = tags.filter((tag) => tag !== tagToRemove);
        setTags(newTags);
        onTagsChange(newTags);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();

            if (query.trim()) {
                handleAddTag(query);
            } else if (filteredAvailableTags.length > 0) {
                handleAddTag(filteredAvailableTags[0]);
            }
        }
    };

    if (isViewMode) {
        return (
            <div className="space-y-2">
                <Label className="block text-sm font-medium text-gray-700">
                    Product Tags
                </Label>
                <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Combobox
                value={null}
                onChange={(value) => value && handleAddTag(value)}
            >
                {({ open }) => (
                    <>
                        <div className="relative">
                            <ComboboxInput
                                type="text"
                                value={query}
                                onChange={(event) =>
                                    setQuery(event.target.value)
                                }
                                onKeyDown={handleKeyDown}
                                onFocus={() => {
                                    if (!open) {
                                        const Button = document.querySelector(
                                            '[data-headlessui-state]',
                                        );
                                        Button?.dispatchEvent(
                                            new MouseEvent('click'),
                                        );
                                    }
                                }}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                placeholder="Type a tag or select from list..."
                                disabled={isSubmitting}
                            />
                        </div>

                        <ComboboxOptions className="ring-opacity-5 absolute z-10 mt-1 max-h-60 w-fit overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black focus:outline-none sm:text-sm">
                            {filteredAvailableTags.length === 0 ? (
                                <div className="relative cursor-default px-4 py-2 text-gray-700 select-none">
                                    No tags found. Press Enter to create "
                                    {query}"
                                </div>
                            ) : (
                                filteredAvailableTags.map((tag) => (
                                    <ComboboxOption
                                        key={tag}
                                        value={tag}
                                        className={({ focus }) =>
                                            `relative cursor-default py-2 pr-9 pl-3 select-none ${
                                                focus
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'text-gray-900'
                                            }`
                                        }
                                    >
                                        {tag}
                                    </ComboboxOption>
                                ))
                            )}
                        </ComboboxOptions>
                    </>
                )}
            </Combobox>

            {/* Display current tags */}
            <div>
                <Label className="mb-2 block text-sm font-medium text-gray-700">
                    Current Tags{' '}
                    {tags.length > 0 && `(${tags.length}/${maxTags})`}
                </Label>
                {tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-sm font-medium text-blue-800"
                            >
                                {tag}
                                <Button
                                    onClick={() => handleRemoveTag(tag)}
                                    disabled={isSubmitting}
                                    className="flex h-fit w-fit cursor-pointer items-center justify-center rounded-full bg-red-600"
                                >
                                    <X size={12} />
                                </Button>
                            </span>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-md border border-dashed border-gray-300 p-2 text-center text-sm text-gray-500">
                        No tags added yet. Type above and press Enter to add
                        tags.
                    </div>
                )}
            </div>

            {errors && <div className="text-sm text-red-600">{errors}</div>}
        </div>
    );
};
