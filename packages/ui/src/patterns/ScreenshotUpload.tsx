import { ChangeEvent, useRef } from 'react';

import { Text } from '../primitives/Text';
import { RemovableThumbnail } from './RemovableThumbnail';

export interface ScreenshotUploadProps {
    files: File[];
    onChange: (files: File[]) => void;
    max?: number;
    errors?: string[];
}

/** Pick up to `max` images, preview them locally, remove before upload. No knowledge of already-uploaded files. */
export function ScreenshotUpload({ files, onChange, max = 3, errors }: ScreenshotUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const full = files.length >= max;

    function handleSelect(event: ChangeEvent<HTMLInputElement>) {
        const picked = Array.from(event.target.files ?? []);
        onChange([...files, ...picked].slice(0, max));
        event.target.value = '';
    }

    function removeAt(index: number) {
        onChange(files.filter((_, i) => i !== index));
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
                {files.map((file, index) => (
                    <RemovableThumbnail key={`${file.name}-${index}`} src={URL.createObjectURL(file)} onRemove={() => removeAt(index)} />
                ))}
                {!full && (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-accent-secondary hover:text-foreground"
                    >
                        <span className="text-lg leading-none">+</span>
                        Add
                    </button>
                )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={handleSelect} />
            <Text variant="muted">
                {files.length}/{max} screenshots
            </Text>
            {errors?.map((message) => (
                <Text key={message} variant="body" className="text-destructive">
                    {message}
                </Text>
            ))}
        </div>
    );
}
