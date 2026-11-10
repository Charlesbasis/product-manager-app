import { TagManagementProps, TagState } from '@/types';
import React, { useCallback } from 'react';

export const useTagManager = ({
    initialTags,
    onTagsChange,
    availableTags,
    isViewMode = false,
    isSubmitting = false,
    maxTags = 20,
}: TagManagementProps) => {
    const [state, setState] = React.useState<TagState>({
        tag: initialTags,
        inputValue: '',
        availableTags,
        // error: null,
        isDirty: false,
    });

    const validateTags = useCallback(
        (tag: string[]): { isValid: boolean; error?: string | null } => {
            const trimmedTags = tag.map((t) => t.trim());

            if (!trimmedTags) {
                return {
                    isValid: false,
                    error: 'Please enter at least one tag',
                };
            }

            if (trimmedTags.length > maxTags) {
                return {
                    isValid: false,
                    error: `You can only add up to ${maxTags} tags`,
                };
            }

            if (!/^([a-zA-Z0-9-_]+)$/.test(trimmedTags.join(''))) {
                return {
                    isValid: false,
                    error: 'Tags can only contain letters, numbers, dashes, and underscores',
                };
            }

            if (
                state.tag.some(
                    (existingTag) =>
                        existingTag.toLowerCase() ===
                        trimmedTags.join('').toLowerCase(),
                )
            ) {
                return { isValid: false, error: 'Tag already exists' };
            }

            if (state.tag.length === maxTags) {
                return {
                    isValid: false,
                    error: `You can only add up to ${maxTags} tags`,
                };
            }

            return { isValid: true };
        },
        [state.tag, maxTags],
    );

    const addTag = useCallback(
        (tag: string) => {
            const validation = validateTags([...state.tag, tag]);
            if (!validation.isValid) {
                setState((prev) => ({
                    ...prev,
                    error: validation.error || null,
                }));
                return false;
            }

            const newTag = tag.trim();
            setState((prev) => ({
                ...prev,
                tag: [...prev.tag, newTag],
                inputValue: '',
                error: null,
                isDirty: true,
            }));

            onTagsChange([...state.tag, newTag]);
            return true;
        },
        [state.tag, validateTags, onTagsChange],
    );

    const removeTag = useCallback(
        (tag: string) => {
            setState((prev) => ({
                ...prev,
                tag: prev.tag.filter((t) => t !== tag),
                error: null,
                isDirty: true,
            }));

            onTagsChange(state.tag);
        },
        [state.tag, onTagsChange],
    );

    const clearError = useCallback(() => {
        setState((prev) => ({
            ...prev,
            error: null,
        }));
    }, []);

    const filteredAvailableTags = React.useMemo(() => {
        return (
            state.availableTags?.filter(
                (availableTag) =>
                    !state.tag.includes(availableTag) &&
                    availableTag
                        .toLowerCase()
                        .includes(state.inputValue.toLowerCase()),
            ) || []
        );
    }, [state.availableTags, state.tag, state.inputValue]);

    return {
        tag: state.tag,
        addTag,
        removeTag,
        clearError,
        filteredAvailableTags,
        isViewMode,
        isSubmitting,
        validateTags,
        inputValue: state.inputValue,
        setInputValue: (value: string) =>
            setState((prev) => ({ ...prev, inputValue: value })),
    };
};
