<?php

namespace App\Http\Requests\Employee\Documents;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Registering a referral (BIR Form 2309 - Reference Slip).
 *
 * Concerns and For arrive as arrays of ticked options; Remarks as one
 * choice. Ticking "Other" in any of them requires the matching free
 * text. The reference number, QR code, sending section and office code
 * are all produced by the system, so the form asks only for what the
 * clerk reads off the paper.
 */
class StoreDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'document_date' => [
                'required',
                'date',
            ],

            'taxpayer_name' => [
                'required',
                'string',
                'max:255',
            ],

            'concerns' => [
                'required',
                'array',
                'min:1',
            ],
            'concerns.*' => [
                'string',
                Rule::in(config('referral.concerns')),
            ],
            'concern_other' => [
                Rule::requiredIf(fn () => $this->ticked('concerns', 'Other')),
                'nullable',
                'string',
                'max:150',
            ],

            'referred_for' => [
                'required',
                'array',
                'min:1',
            ],
            'referred_for.*' => [
                'string',
                Rule::in(config('referral.referred_for')),
            ],
            'referred_for_other' => [
                Rule::requiredIf(fn () => $this->ticked('referred_for', 'Other')),
                'nullable',
                'string',
                'max:150',
            ],

            'remarks' => [
                'required',
                'string',
                Rule::in(config('referral.remarks')),
            ],
            'remarks_other' => [
                Rule::requiredIf(fn () => $this->input('remarks') === 'Other'),
                'nullable',
                'string',
                'max:1000',
            ],

            'destination_section_id' => [
                'required',
                Rule::exists('sections', 'section_id'),
            ],

            'addressee' => [
                'required',
                'string',
                Rule::in(config('referral.addressees')),
            ],

        ];
    }

    public function messages(): array
    {
        return [

            'document_date.required' => 'Please enter the date issued.',
            'document_date.date' => 'That is not a valid date.',

            'taxpayer_name.required' => 'Please enter the taxpayer\'s name.',
            'taxpayer_name.max' => 'The taxpayer\'s name may not exceed 255 characters.',

            'concerns.required' => 'Please tick at least one concern.',
            'concerns.*.in' => 'That concern is not in the list.',
            'concern_other.required' => 'Please say what the other concern is.',

            'referred_for.required' => 'Please tick at least one action for the receiving office.',
            'referred_for.*.in' => 'That option is not in the list.',
            'referred_for_other.required' => 'Please say what the other action is.',

            'remarks.required' => 'Please choose a remark.',
            'remarks.in' => 'That remark is not in the list.',
            'remarks_other.required' => 'Please describe the status.',
            'remarks_other.max' => 'Remarks may not exceed 1000 characters.',

            'destination_section_id.required' => 'Please choose the receiving section.',
            'destination_section_id.exists' => 'That section does not exist.',

            'addressee.required' => 'Please choose who in that section should receive it.',
            'addressee.in' => 'That option is not in the list.',

        ];
    }

    /**
     * Whether "Other" (or any given option) was ticked in a list field.
     */
    protected function ticked(string $field, string $option): bool
    {
        $values = $this->input($field);

        return is_array($values) && in_array($option, $values, true);
    }
}
