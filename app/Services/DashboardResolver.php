<?php

namespace App\Services;

use App\Models\EmployeeAcc;

class DashboardResolver
{
    public static function resolve(EmployeeAcc $employee): ?string
    {
        /*
        * A counter account has no dashboard to land on - registering an
        * arrival is the whole of its work, so it opens there.
        */
        if ($employee->registersOnly()) {
            return route('registration.index');
        }

        $section = config('section')[$employee->section?->section_name] ?? null;

        return $section ? route($section['route']) : null;
    }
}
