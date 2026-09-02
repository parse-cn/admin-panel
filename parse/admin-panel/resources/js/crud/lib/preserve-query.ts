export function preserveCurrentQuery(url: string): string {
    if (typeof window === 'undefined' || window.location.search === '') {
        return url;
    }

    const [target, hash = ''] = url.split('#', 2);
    const separator = target.includes('?') ? '&' : '?';
    const query = window.location.search.slice(1);

    return `${target}${separator}${query}${hash ? `#${hash}` : ''}`;
}
