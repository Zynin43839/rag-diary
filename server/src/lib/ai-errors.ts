/**
 * Maps an image-provider failure to the HTTP status and body the client relies
 * on. A 429 from the provider means the plan has no image quota, which is a
 * "feature unavailable" case rather than a generic upstream failure.
 */
export type ImageFailure = {
    status: 503 | 502;
    body: { error: string; code: 'image_unavailable' | 'image_provider_error' };
};

export function imageFailure(providerStatus: number, detail: string): ImageFailure {
    if (providerStatus === 429) {
        return {
            status: 503,
            body: {
                error: 'Image generation is not available on the current AI plan',
                code: 'image_unavailable',
            },
        };
    }

    return {
        status: 502,
        body: {
            error: `Image provider failed: ${detail}`,
            code: 'image_provider_error',
        },
    };
}
