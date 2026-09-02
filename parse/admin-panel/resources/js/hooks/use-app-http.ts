import { useHttp } from '@inertiajs/react';
import type {
    FormDataType,
    HttpResponse,
    UseHttpSubmitOptions,
} from '@inertiajs/core';
import { toast } from 'sonner';

import { getHttpErrorMessage } from '../lib/http-error';

export type UseAppHttpOptions = {
    fallbackMessage?: string;
    toastHttpErrors?: boolean;
    toastNetworkErrors?: boolean;
};

type AppHttpRequestOptions<TResponse, TForm> = UseHttpSubmitOptions<
    TResponse,
    TForm
>;

export function useAppHttp<
    TForm extends FormDataType<TForm>,
    TResponse = unknown,
>(data: TForm | (() => TForm), defaults: UseAppHttpOptions = {}) {
    const request = useHttp<TForm, TResponse>(data);
    const {
        fallbackMessage = 'Something went wrong. Please try again.',
        toastHttpErrors = true,
        toastNetworkErrors = true,
    } = defaults;

    const withDefaults = (
        options: AppHttpRequestOptions<TResponse, TForm> = {},
    ): AppHttpRequestOptions<TResponse, TForm> => ({
        ...options,
        onHttpException: (response: HttpResponse) => {
            const result = options.onHttpException?.(response);

            if (result === false) {
                return false;
            }

            if (toastHttpErrors) {
                toast.error(getHttpErrorMessage(response, fallbackMessage));
            }

            return result;
        },
        onNetworkError: (error: Error) => {
            const result = options.onNetworkError?.(error);

            if (result === false) {
                return false;
            }

            if (toastNetworkErrors) {
                toast.error('Network error. Please try again.');
            }

            return result;
        },
    });

    return {
        ...request,
        get: (url: string, options?: AppHttpRequestOptions<TResponse, TForm>) =>
            request.get(url, withDefaults(options)),
        post: (
            url: string,
            options?: AppHttpRequestOptions<TResponse, TForm>,
        ) => request.post(url, withDefaults(options)),
        put: (url: string, options?: AppHttpRequestOptions<TResponse, TForm>) =>
            request.put(url, withDefaults(options)),
        patch: (
            url: string,
            options?: AppHttpRequestOptions<TResponse, TForm>,
        ) => request.patch(url, withDefaults(options)),
        delete: (
            url: string,
            options?: AppHttpRequestOptions<TResponse, TForm>,
        ) => request.delete(url, withDefaults(options)),
    };
}
