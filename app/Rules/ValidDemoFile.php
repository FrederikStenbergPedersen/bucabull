<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;

/**
 * Rejects obviously-wrong uploads (a screenshot, a random file, a
 * CS:GO-era "HL2DEMO" demo) before we ever store the file or queue a
 * parse job for it, by checking the CS2 (Source 2) demo header.
 */
class ValidDemoFile implements ValidationRule
{
    private const MAGIC_HEADER = 'PBDEMS2';

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! $value instanceof UploadedFile) {
            $fail('The :attribute must be an uploaded file.');

            return;
        }

        $handle = @fopen($value->getRealPath(), 'rb');

        if ($handle === false) {
            $fail('The :attribute could not be read.');

            return;
        }

        $header = fread($handle, strlen(self::MAGIC_HEADER));
        fclose($handle);

        if ($header !== self::MAGIC_HEADER) {
            $fail('The :attribute is not a valid CS2 demo file.');
        }
    }
}
