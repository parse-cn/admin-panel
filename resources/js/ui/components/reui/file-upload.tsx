import { CircleAlertIcon, ImageIcon, UploadIcon, XIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';

export type FileUploadProps = {
    accept?: string;
    className?: string;
    disabled?: boolean;
    error?: string;
    fileName?: string;
    maxSizeLabel?: string;
    onClear?: () => void;
    onFileSelect: (file: File) => void;
    previewUrl?: string;
    progress?: number;
    labels?: Partial<{
        title: string;
        description: string;
        requirements: (maxSize: string) => string;
        select: string;
        uploaded: string;
        complete: string;
        uploading: (progress: number) => string;
        remove: string;
    }>;
};

export function FileUpload({
    accept = '*',
    className,
    disabled = false,
    error,
    fileName,
    maxSizeLabel,
    onClear,
    onFileSelect,
    previewUrl,
    progress,
    labels,
}: FileUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    function selectFile(file: File | undefined) {
        if (file && !disabled) {
            onFileSelect(file);
        }
    }

    function handleDrop(event: DragEvent<HTMLDivElement>) {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        selectFile(event.dataTransfer.files[0]);
    }

    return (
        <div className={cn('w-full space-y-3', className)}>
            <div
                className={cn(
                    'relative rounded-lg border border-dashed p-6 text-center transition-colors',
                    isDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25 hover:border-muted-foreground/50',
                    disabled && 'pointer-events-none opacity-60',
                )}
                onDragEnter={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={(event) => {
                    event.preventDefault();

                    if (
                        !event.currentTarget.contains(
                            event.relatedTarget as Node,
                        )
                    ) {
                        setIsDragging(false);
                    }
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    className="sr-only"
                    disabled={disabled}
                    onChange={(event) => {
                        selectFile(event.target.files?.[0]);
                        event.target.value = '';
                    }}
                />

                <div className="flex flex-col items-center gap-3">
                    <div
                        className={cn(
                            'flex size-12 items-center justify-center rounded-full bg-muted',
                            isDragging && 'bg-primary/10',
                        )}
                    >
                        <UploadIcon
                            className={cn(
                                'size-5 text-muted-foreground',
                                isDragging && 'text-primary',
                            )}
                        />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium">
                            {labels?.title ?? 'Upload an image'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {labels?.description ??
                                'Drag and drop here, or select a file'}
                        </p>
                        {maxSizeLabel && (
                            <p className="text-xs text-muted-foreground">
                                {labels?.requirements?.(maxSizeLabel) ??
                                    `JPG, PNG or WebP up to ${maxSizeLabel}`}
                            </p>
                        )}
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={disabled}
                        onClick={() => inputRef.current?.click()}
                    >
                        <UploadIcon className="size-4" />
                        {labels?.select ?? 'Select image'}
                    </Button>
                </div>
            </div>

            {(previewUrl || fileName) && (
                <div className="rounded-lg border bg-card p-2.5">
                    <div className="flex items-center gap-2.5">
                        {previewUrl ? (
                            <img
                                src={previewUrl}
                                alt=""
                                className="size-12 shrink-0 rounded-lg border object-cover"
                            />
                        ) : (
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border text-muted-foreground">
                                <ImageIcon className="size-4" />
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                                {fileName ||
                                    labels?.uploaded ||
                                    'Uploaded image'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {progress === undefined
                                    ? (labels?.complete ?? 'Upload complete')
                                    : (labels?.uploading?.(progress) ??
                                      `Uploading ${progress}%`)}
                            </p>
                        </div>
                        {onClear && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground"
                                disabled={disabled}
                                onClick={onClear}
                                aria-label={labels?.remove ?? 'Remove image'}
                            >
                                <XIcon className="size-4" />
                            </Button>
                        )}
                    </div>
                    {progress !== undefined && (
                        <Progress value={progress} className="mt-2 h-1" />
                    )}
                </div>
            )}

            {error && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
