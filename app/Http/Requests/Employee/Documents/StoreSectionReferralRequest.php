<?php

namespace App\Http\Requests\Employee\Documents;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class StoreSectionReferralRequest extends FormRequest
{
    public function authorize(): bool
    {
        $employee = Auth::guard('employee')->user();

        if (! $employee) {
            return false;
        }

        return ! in_array(
            $employee->section?->section_name,
            config('referral.form_2309_sections', ['RDO']),
            true
        );
    }

    public function rules(): array
    {
        $employee = Auth::guard('employee')->user();

        return [
            'destination_section_id' => [
                'required',
                Rule::exists('sections', 'section_id'),
                Rule::notIn([$employee?->section_id]),
            ],

            'concern' => ['required', 'string', 'max:2000'],

            'addressee' => [
                'nullable',
                'string',
                Rule::in(config('referral.direct_send_options', [])),
            ],

            'archive' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'destination_section_id.required' => 'Please choose the receiving section.',
            'destination_section_id.exists' => 'That section does not exist.',
            'destination_section_id.not_in' => 'A referral cannot be sent to your own section.',

            'concern.required' => 'Please enter the details.',
            'concern.max' => 'The details may not exceed 2000 characters.',

            'addressee.in' => 'Please choose Chief or Archive.',
        ];
    }
}