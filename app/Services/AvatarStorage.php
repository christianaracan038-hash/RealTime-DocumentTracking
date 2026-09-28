<?php

namespace App\Services;

use App\Models\EmployeeAcc;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Employee photographs.
 *
 * Every photo is squared off and shrunk to 256px before it is stored.
 * These arrive from phone cameras at three or four megabytes, and an
 * avatar is displayed at forty pixels: storing the original would mean
 * sending several megabytes per face on a page that lists a dozen of
 * them, over the mobile connections this office actually uses.
 *
 * Resizing uses GD, which is already enabled - there is no ImageMagick on
 * these machines, and this is not enough work to justify a dependency.
 *
 * Which disk it writes to is config('filesystems.avatars'), so moving
 * from a local folder to Supabase Storage is a change in .env. Paths are
 * stored, never URLs, so nothing has to be rewritten when that happens.
 */
class AvatarStorage
{
    /**
     * The side of the stored square, in pixels.
     *
     * Twice the largest size it is displayed at, so it stays sharp on the
     * phone screens this is mostly read on.
     */
    protected const SIZE = 256;

    protected const FOLDER = 'avatars';

    /**
     * Store a new photograph for this employee, replacing any old one.
     */
    public function store(EmployeeAcc $employee, UploadedFile $file): string
    {
        $image = $this->square($file);

        $path = self::FOLDER.'/'.Str::uuid()->toString().'.jpg';

        try {
            ob_start();
            imagejpeg($image, null, 82);
            $jpeg = ob_get_clean();
        } finally {
            imagedestroy($image);
        }

        $this->disk()->put($path, $jpeg, 'public');

        /*
        * Only once the new one is safely written. A failed upload should
        * leave the old photo in place rather than no photo at all.
        */
        $this->forget($employee);

        $employee->update(['avatar_path' => $path]);

        return $path;
    }

    /**
     * Remove this employee's photograph.
     */
    public function remove(EmployeeAcc $employee): void
    {
        $this->forget($employee);

        $employee->update(['avatar_path' => null]);
    }

    /**
     * Where the browser should fetch it from, or null if there is none.
     *
     * Deliberately does not check that the file exists. On a local disk
     * that would be a filesystem call per face; on Supabase it would be a
     * network round trip per face, on every page load. The interface
     * falls back to initials when the image fails to load, which covers
     * the real case - a photo uploaded on another machine, when the disk
     * is still local.
     */
    public function url(?EmployeeAcc $employee): ?string
    {
        if (blank($employee?->avatar_path)) {
            return null;
        }

        return $this->disk()->url($employee->avatar_path);
    }

    /**
     * Delete the stored file, leaving the column alone.
     */
    protected function forget(EmployeeAcc $employee): void
    {
        if (blank($employee->avatar_path)) {
            return;
        }

        /*
        * A photo that cannot be deleted - already gone, or on another
        * machine's disk - must not stop a new one being set.
        */
        rescue(fn () => $this->disk()->delete($employee->avatar_path), report: false);
    }

    protected function disk(): Filesystem
    {
        return Storage::disk(config('filesystems.avatars', 'public'));
    }

    /**
     * Centre-crop to a square, then shrink to SIZE.
     *
     * Centre rather than top: a photograph of a person is framed with the
     * face in the middle, and cropping from the top removes the chin.
     */
    protected function square(UploadedFile $file): \GdImage
    {
        $source = $this->read($file);

        $width = imagesx($source);
        $height = imagesy($source);

        $side = min($width, $height);

        $square = imagecreatetruecolor(self::SIZE, self::SIZE);

        $ok = imagecopyresampled(
            $square,
            $source,
            0, 0,
            (int) (($width - $side) / 2),
            (int) (($height - $side) / 2),
            self::SIZE, self::SIZE,
            $side, $side
        );

        imagedestroy($source);

        if (! $ok) {
            imagedestroy($square);

            throw new RuntimeException('That image could not be resized.');
        }

        return $square;
    }

    /**
     * Decode the upload, whatever the browser sent.
     */
    protected function read(UploadedFile $file): \GdImage
    {
        $contents = file_get_contents($file->getRealPath());

        $image = $contents === false ? false : @imagecreatefromstring($contents);

        if (! $image) {
            /*
            * The validator already checked the mime type, so reaching
            * here means the file is corrupt or a mislabelled format that
            * GD was built without.
            */
            throw new RuntimeException('That image could not be read.');
        }

        return $image;
    }
}
