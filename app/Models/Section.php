<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class Section extends Model
{
    protected const CACHE_KEY = 'lookup.sections';

    protected $table = 'sections';

    protected $primaryKey = 'section_id';

    protected $fillable = [
        'section_code',
        'section_name',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function employees(): HasMany
    {
        return $this->hasMany(EmployeeAcc::class, 'section_id', 'section_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Cached lookup
    |--------------------------------------------------------------------------
    |
    | This table is tiny and almost never changes, and the database is in
    | Tokyo: every read of it costs about 290ms of network. Loading it on
    | every request to put one name in the header was a third of a second
    | of somebody waiting, for a row that had not changed in weeks.
    |
    | Held in the cache until a row is written, which the hooks below take
    | care of - so an edit in the super admin panel shows up at once
    | rather than after a timeout.
    |
    */

    public static function lookup(): Collection
    {
        /*
        * Plain rows in the cache, hydrated on the way out. Storing the
        * models themselves means serialising Eloquent objects, which
        * come back as __PHP_Incomplete_Class the moment anything about
        * the class changes.
        */
        $rows = Cache::rememberForever(
            static::CACHE_KEY,
            fn () => static::query()->get()->map->getAttributes()->all()
        );

        return static::hydrate($rows)->keyBy(static::make()->getKeyName());
    }

    public static function cached(int|string|null $id): ?static
    {
        return $id === null ? null : static::lookup()->get($id);
    }

    protected static function booted(): void
    {
        $forget = fn () => Cache::forget(static::CACHE_KEY);

        static::saved($forget);
        static::deleted($forget);
    }
}
