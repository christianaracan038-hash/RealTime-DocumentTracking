<?php

namespace App\Services;

use App\Models\EmployeeAcc;

class DashboardResolver
{
    public static function resolve(EmployeeAcc $employee): ?string
    {
        
        $route = config('section')[$employee->section->section_name] ?? null;
        return $route? route($route) : null;
    }
}