<?php

namespace App\Services;

use App\Models\EmployeeAcc;

class DashboardResolver
{
    public static function resolve(EmployeeAcc $employee): ?string
    {

        $section = config('section')[$employee->section?->section_name] ?? null;

        return $section ? route($section['route']) : null;
    }
}
