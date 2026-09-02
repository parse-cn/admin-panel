export type HttpErrorPayload = {
    code?: string;
    errors?: unknown;
    message?: unknown;
    request_id?: string;
};

function parsePayload(value: unknown): HttpErrorPayload | null {
    if (typeof value === 'string') {
        try {
            return parsePayload(JSON.parse(value));
        } catch {
            return null;
        }
    }

    if (!value || typeof value !== 'object') {
        return null;
    }

    return value as HttpErrorPayload;
}

type HttpResponseLike = {
    data: string | Record<string, unknown>;
    status: number;
};

function responseFrom(value: unknown): HttpResponseLike | null {
    if (!value || typeof value !== 'object') {
        return null;
    }

    const candidate = value as {
        response?: unknown;
        status?: unknown;
        data?: unknown;
        headers?: unknown;
    };

    if (candidate.response && typeof candidate.response === 'object') {
        return responseFrom(candidate.response);
    }

    if (
        typeof candidate.status === 'number' &&
        (typeof candidate.data === 'string' ||
            (typeof candidate.data === 'object' && candidate.data !== null))
    ) {
        return candidate as HttpResponseLike;
    }

    return null;
}

export function getHttpErrorPayload(value: unknown): HttpErrorPayload | null {
    const response = responseFrom(value);

    return parsePayload(response?.data) ?? parsePayload(value);
}

export function getHttpErrorMessage(
    value: unknown,
    fallback = 'Something went wrong. Please try again.',
): string {
    const payload = getHttpErrorPayload(value);

    if (payload?.errors && typeof payload.errors === 'object') {
        const nestedMessage = (payload.errors as { message?: unknown }).message;

        if (typeof nestedMessage === 'string' && nestedMessage.trim()) {
            return nestedMessage;
        }

        for (const errorValue of Object.values(payload.errors)) {
            const message = Array.isArray(errorValue)
                ? errorValue[0]
                : errorValue;

            if (typeof message === 'string' && message.trim()) {
                return message;
            }
        }
    }

    if (typeof payload?.message === 'string' && payload.message.trim()) {
        return payload.message;
    }

    if (value instanceof Error && value.message.trim()) {
        return value.message;
    }

    if (typeof value === 'string' && value.trim()) {
        return value;
    }

    return fallback;
}
