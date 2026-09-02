import { router } from '@inertiajs/react';
import { LoaderCircleIcon, SearchIcon } from 'lucide-react';
import {
    type KeyboardEvent as ReactKeyboardEvent,
    type ReactNode,
    useEffect,
    useId,
    useMemo,
    useState,
} from 'react';
import { Button } from '../ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { RemixIcon } from '../ui/remix-icon';

type GlobalSearchResult = {
    details: Record<string, string | null>;
    icon: string | null;
    image: string | null;
    key: string | number;
    title: string;
    url: string;
};

type GlobalSearchGroup = {
    icon: string | null;
    resource: string;
    results: GlobalSearchResult[];
    title: string;
};

type GlobalSearchLabels = {
    keyboardHint: string;
    loadError: string;
    loading: string;
    noResults: string;
    startTyping: string;
};

export function GlobalSearch({
    collapsed = false,
    description,
    labels,
    minimumQueryLength,
    onOpenChange,
    onQueryChange,
    open,
    placeholder,
    query,
    searchUrl,
}: {
    collapsed?: boolean;
    description: string;
    labels: GlobalSearchLabels;
    minimumQueryLength: number;
    onOpenChange: (open: boolean) => void;
    onQueryChange: (query: string) => void;
    open: boolean;
    placeholder: string;
    query: string;
    searchUrl: string;
}) {
    const searchInputId = useId();
    const [groups, setGroups] = useState<GlobalSearchGroup[]>([]);
    const [loading, setLoading] = useState(false);
    const [failed, setFailed] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const normalizedQuery = query.trim();
    const results = useMemo(
        () => groups.flatMap((group) => group.results),
        [groups],
    );

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (
                event.key.toLowerCase() === 'k' &&
                (event.metaKey || event.ctrlKey)
            ) {
                event.preventDefault();
                onOpenChange(true);
            }
        };

        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onOpenChange]);

    useEffect(() => {
        if (!open || normalizedQuery.length < minimumQueryLength) {
            setGroups([]);
            setLoading(false);
            setFailed(false);
            setActiveIndex(0);

            return;
        }

        const abortController = new AbortController();
        const timeout = window.setTimeout(async () => {
            setLoading(true);
            setFailed(false);

            try {
                const url = new URL(searchUrl, window.location.origin);
                url.searchParams.set('query', normalizedQuery);
                const response = await fetch(url, {
                    headers: { Accept: 'application/json' },
                    signal: abortController.signal,
                });

                if (!response.ok) {
                    throw new Error(`Global search failed: ${response.status}`);
                }

                const payload = (await response.json()) as {
                    groups?: GlobalSearchGroup[];
                };
                setGroups(payload.groups ?? []);
                setActiveIndex(0);
            } catch (error) {
                if (!abortController.signal.aborted) {
                    setGroups([]);
                    setFailed(true);
                }
            } finally {
                if (!abortController.signal.aborted) {
                    setLoading(false);
                }
            }
        }, 250);

        return () => {
            window.clearTimeout(timeout);
            abortController.abort();
        };
    }, [minimumQueryLength, normalizedQuery, open, searchUrl]);

    const visit = (result: GlobalSearchResult) => {
        onOpenChange(false);
        router.visit(result.url);
    };

    const onResultsKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
        if (results.length === 0) {
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((current) => (current + 1) % results.length);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex(
                (current) => (current - 1 + results.length) % results.length,
            );
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const result = results[activeIndex] ?? results[0];

            if (result) {
                visit(result);
            }
        }
    };

    let resultIndex = -1;

    return (
        <>
            <Button
                type="button"
                variant="outline"
                aria-label={placeholder}
                className="h-8 w-full justify-start gap-2 pl-2.5 font-normal transition-[width] duration-200 ease-linear hover:bg-background in-data-[state=collapsed]:w-8! in-data-[state=collapsed]:justify-center in-data-[state=collapsed]:gap-0 in-data-[state=collapsed]:p-0!"
                onClick={() => onOpenChange(true)}
            >
                <SearchIcon
                    aria-hidden="true"
                    className="size-3.5 shrink-0 opacity-50"
                />
                {!collapsed && placeholder}
                {!collapsed && (
                    <kbd className="ml-auto rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {labels.keyboardHint}
                    </kbd>
                )}
            </Button>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="flex h-[82vh] max-h-[82vh] min-h-0 w-[calc(100vw-2rem)] max-w-none flex-col gap-0 overflow-hidden p-0 **:data-[slot=dialog-close]:top-4 **:data-[slot=dialog-close]:right-4 sm:w-[min(78vw,64rem)] sm:max-w-none!">
                    <DialogHeader className="sr-only">
                        <DialogTitle>{placeholder}</DialogTitle>
                        <DialogDescription>{description}</DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center gap-3 border-b px-4 pr-12">
                        <SearchIcon
                            aria-hidden="true"
                            className="size-4 shrink-0 text-muted-foreground"
                        />
                        <Input
                            id={searchInputId}
                            autoFocus
                            className="h-14 border-none p-0 text-base shadow-none outline-none focus-visible:ring-0"
                            placeholder={placeholder}
                            value={query}
                            onChange={(event) =>
                                onQueryChange(event.target.value)
                            }
                            onKeyDown={onResultsKeyDown}
                            aria-label={placeholder}
                        />
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto p-2">
                        {normalizedQuery.length < minimumQueryLength && (
                            <SearchState message={labels.startTyping} />
                        )}
                        {loading && (
                            <SearchState
                                icon={
                                    <LoaderCircleIcon className="size-4 animate-spin" />
                                }
                                message={labels.loading}
                            />
                        )}
                        {!loading && failed && (
                            <SearchState message={labels.loadError} />
                        )}
                        {!loading &&
                            !failed &&
                            normalizedQuery.length >= minimumQueryLength &&
                            groups.length === 0 && (
                                <SearchState message={labels.noResults} />
                            )}
                        {!loading &&
                            !failed &&
                            groups.map((group) => (
                                <section key={group.resource}>
                                    <div className="flex items-center gap-2 px-2 pt-3 pb-1 text-xs font-medium text-muted-foreground first:pt-1">
                                        {group.icon && (
                                            <RemixIcon
                                                className="size-3.5"
                                                name={group.icon}
                                            />
                                        )}
                                        {group.title}
                                    </div>
                                    {group.results.map((result) => {
                                        resultIndex += 1;
                                        const currentIndex = resultIndex;

                                        return (
                                            <button
                                                type="button"
                                                className="flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left hover:bg-accent data-[active=true]:bg-accent"
                                                data-active={
                                                    currentIndex === activeIndex
                                                }
                                                key={`${group.resource}-${result.key}`}
                                                onClick={() => visit(result)}
                                                onMouseEnter={() =>
                                                    setActiveIndex(currentIndex)
                                                }
                                            >
                                                <ResultVisual result={result} />
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-sm font-medium">
                                                        {result.title}
                                                    </span>
                                                    <span className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                                                        {Object.entries(
                                                            result.details,
                                                        ).map(
                                                            ([label, value]) =>
                                                                value ? (
                                                                    <span
                                                                        key={
                                                                            label
                                                                        }
                                                                    >
                                                                        {label}:{' '}
                                                                        {value}
                                                                    </span>
                                                                ) : null,
                                                        )}
                                                    </span>
                                                </span>
                                                <RemixIcon
                                                    className="size-4 shrink-0 text-muted-foreground"
                                                    name="arrow-right-s-line"
                                                />
                                            </button>
                                        );
                                    })}
                                </section>
                            ))}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

function ResultVisual({ result }: { result: GlobalSearchResult }) {
    if (result.image) {
        return (
            <img
                alt=""
                className="size-9 shrink-0 rounded-full object-cover"
                src={result.image}
            />
        );
    }

    return (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <RemixIcon name={result.icon ?? 'file-list-3-line'} />
        </span>
    );
}

function SearchState({ icon, message }: { icon?: ReactNode; message: string }) {
    return (
        <div className="flex h-28 items-center justify-center gap-2 text-sm text-muted-foreground">
            {icon}
            {message}
        </div>
    );
}
