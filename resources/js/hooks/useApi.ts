import axiosInstance from '@/lib/axios';
import { useCallback } from 'react';

export const useApi = () => {
    const uploadFile = useCallback(
        async (
            url: string,
            file: File,
            onProgress?: (percentage: number) => void,
        ) => {
            const formData = new FormData();
            formData.append('file', file);

            return axiosInstance.post(url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: onProgress
                    ? (progressEvent) => {
                          const percentCompleted = Math.round(
                              (progressEvent.loaded * 100) /
                                  (progressEvent.total || 1),
                          );
                          onProgress(percentCompleted);
                      }
                    : undefined,
            });
        },
        [],
    );

    const importProducts = useCallback(async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        return axiosInstance.put('/products/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }, []);

    return {
        uploadFile,
        importProducts,
        // Add other API methods as needed
        get: axiosInstance.get,
        post: axiosInstance.post,
        put: axiosInstance.put,
        delete: axiosInstance.delete,
    };
};
