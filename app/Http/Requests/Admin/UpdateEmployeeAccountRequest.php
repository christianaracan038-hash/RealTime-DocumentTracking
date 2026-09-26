<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Editing an employee account.
 *
 * Deliberately has no password field. Changing somebody's password is a
 * separate, deliberate action - it should not be something that happens
 * as a side effect of correcting the spelling of their name.
 */
class UpdateEmployeeAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $employee = $this->route('employee');

        return [
            'username' => [
                'required', 'string', 'max:50',
                Rule::unique('employees_acc', 'username')
                    ->ignore($employee->employee_id, 'employee_id'),
            ],

            /*
            * Required here as well as on create, so an account that
            * predates the name columns gets one the first time anybody
            * edits it.
            */
            'full_name' => ['required', 'string', 'max:255'],

            'position' => ['nullable', 'string', 'max:100'],

            'email' => [
                'nullable', 'email', 'max:255',
                Rule::unique('employees_acc', 'email')
                    ->ignore($employee->employee_id, 'employee_id'),
            ],

            'section_id' => ['required', Rule::exists('sections', 'section_id')],

            'role_id' => ['required', Rule::exists('roles', 'role_id')],
        ];
    }

    public function messages(): array
    {
        return [
            'username.unique' => 'That username is already taken.',
            'full_name.required' => 'Please enter the employee\'s full name.',
            'email.unique' => 'Another account already uses that email address.',
            'section_id.required' => 'Please choose the section this person works in.',
            'role_id.required' => 'Please choose a role.',
        ];
    }
}
