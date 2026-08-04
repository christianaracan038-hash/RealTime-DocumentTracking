<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmployeeAcc;
use App\Models\Role;
use App\Models\Section;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;


class EmployeeAccountController extends Controller
{
    public function index(): Response
    {
        $employees = EmployeeAcc::with(['section', 'role'])
            ->latest('employee_id')
            ->get();

        return Inertia::render('Admin/Employees/Index', [
            'employees' => $employees,
            'sections' => Section::where('is_active', true)->get(),
            'roles' => Role::where('is_active', true)->get(),
        ]);
    }

    public function sections(): Response
    {
        return Inertia::render('Admin/Sections/Index', [
            'sections' => Section::where('is_active', true)->get(),
        ]);
    }

    public function roles(): Response
    {
        return Inertia::render('Admin/Roles/Index', [
            'roles' => Role::where('is_active', true)->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'max:50', 'unique:employees_acc,username'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'section_id' => ['required', 'exists:sections,section_id'],
            'role_id' => ['required', 'exists:roles,role_id'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        EmployeeAcc::create($validated);

        return redirect()->route('admin.dashboard')->with('success', 'Employee account created successfully.');
    }
}
