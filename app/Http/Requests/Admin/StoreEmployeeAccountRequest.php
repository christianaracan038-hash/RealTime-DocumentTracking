<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Creating an employee account.
 *
 * The administrator sets the first password, since there is no email on
 * file to send a reset link to and the account is usually handed over in
 * person anyway.
 */
class StoreEmployeeAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        // The route is behind the admin guard.
        return true;
    }

    public function rules(): array
    {
        return [
            'username' => [
                'required', 'string', 'max:50',
                Rule::unique('employees_acc', 'username'),
            ],

            'full_name' => ['required', 'string', 'max:255'],

            'position' => ['nullable', 'string', 'max:100'],

            'email' => [
                'nullable', 'email', 'max:255',
                Rule::unique('employees_acc', 'email'),
            ],

            'password' => ['required', 'string', 'min:8', 'confirmed'],

            'section_id' => ['required', Rule::exists('sections', 'section_id')],

            'role_id' => ['required', Rule::exists('roles', 'role_id')],

            'is_active' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'username.required' => 'Please enter a username for signing in.',
            'username.unique' => 'That username is already taken.',

            'full_name.required' => 'Please enter the employee\'s full name.',

            'email.unique' => 'Another account already uses that email address.',

            'password.required' => 'Please set a first password.',
            'password.min' => 'The password must be at least 8 characters.',
            'password.confirmed' => 'The two passwords do not match.',

            'section_id.required' => 'Please choose the section this person works in.',
            'role_id.required' => 'Please choose a role.',
        ];
    }
}
