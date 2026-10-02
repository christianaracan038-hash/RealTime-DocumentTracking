<?php

namespace App\Http\Requests\Employee\Documents;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

/**
 * A section's own referral - everything except the RDO.
 *
 * Two fields: where it is going, and what it is about. No taxpayer,
 * because this is an internal docket rather than a taxpayer's referral;
 * no date, which the server stamps; no addressee, because it goes to the
 * Chief like everything else.
 *
 * Who prepared it is not asked for either - it is the section of
 * whoever is signed in, and asking would only let somebody answer wrong.
 */
class StoreSectionReferralRequest extends FormRequest
{
    public function authorize(): bool
    {
        $employee = Auth::guard('employee')->user();

        if (! $employee) {
            return false;
        }

        /*
        * The RDO issues BIR Form 2309 instead, through referrals.store.
        * Letting it through here would produce the wrong piece of paper
        * for a taxpayer's referral.
        */
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

                /*
                * Not back to ourselves. A slip whose Prepared and
                * Received lines name the same section records nothing.
                */
                Rule::notIn([$employee?->section_id]),
            ],

            'concern' => ['required', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'destination_section_id.required' => 'Please choose the receiving section.',
            'destination_section_id.exists' => 'That section does not exist.',
            'destination_section_id.not_in' => 'A referral cannot be sent to your own section.',

            'concern.required' => 'Please enter the details.',
            'concern.max' => 'The details may not exceed 1000 characters.',
        ];
    }
}
