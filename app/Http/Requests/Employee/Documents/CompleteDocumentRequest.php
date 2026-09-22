<?php

namespace App\Http\Requests\Employee\Documents;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

/**
 * Step 2 of registering a referral — completing a draft that Step 1
 * already gave a tracking number and QR code to.
 */
class CompleteDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $document = $this->route('document');
        $employee = Auth::guard('employee')->user();

        if (! $document || ! $employee) {
            return false;
        }

        // Only the employee who generated the QR can complete it,
        // and only while it is still a draft.
        return (int) $document->status_id === 0
            && (int) $document->created_by === (int) $employee->employee_id;
    }

    public function rules(): array
    {
        return [

            'document_date' => ['required', 'date'],

            'taxpayer_name' => ['required', 'string', 'max:255'],

            'concerns' => ['required', 'array', 'min:1'],
            'concerns.*' => ['string', Rule::in(config('referral.concerns'))],
            'concern_other' => [
                Rule::requiredIf(fn () => $this->ticked('concerns', 'Other')),
                'nullable', 'string', 'max:150',
            ],

            'referred_for' => ['required', 'array', 'min:1'],
            'referred_for.*' => ['string', Rule::in(config('referral.referred_for'))],
            'referred_for_other' => [
                Rule::requiredIf(fn () => $this->ticked('referred_for', 'Other')),
                'nullable', 'string', 'max:150',
            ],

            'remarks' => ['required', 'string', Rule::in(config('referral.remarks'))],
            'remarks_other' => [
                Rule::requiredIf(fn () => $this->input('remarks') === 'Other'),
                'nullable', 'string', 'max:1000',
            ],

            'destination_section_id' => ['required', Rule::exists('sections', 'section_id')],

            'addressee' => ['required', 'string', Rule::in(config('referral.addressees'))],

        ];
    }

    public function messages(): array
    {
        return [
            'document_date.required' => 'Please enter the date issued.',
            'document_date.date' => 'That is not a valid date.',
            'taxpayer_name.required' => 'Please enter the taxpayer\'s name.',
            'concerns.required' => 'Please tick at least one concern.',
            'concern_other.required' => 'Please say what the other concern is.',
            'referred_for.required' => 'Please tick at least one action for the receiving office.',
            'referred_for_other.required' => 'Please say what the other action is.',
            'remarks.required' => 'Please choose a remark.',
            'remarks_other.required' => 'Please describe the status.',
            'destination_section_id.required' => 'Please choose the receiving section.',
            'addressee.required' => 'Please choose who in that section should receive it.',
        ];
    }

    protected function ticked(string $field, string $option): bool
    {
        $values = $this->input($field);

        return is_array($values) && in_array($option, $values, true);
    }
}