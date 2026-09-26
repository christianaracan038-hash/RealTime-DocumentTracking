<?php

namespace App\Http\Requests\Employee\Documents;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

/**
 * Step 2 - filling in a referral's details.
 *
 * The whole point of the split is that a different person does this,
 * later, so it is NOT limited to whoever registered the arrival. Any
 * employee of a section listed in config('referral.details_completion_sections')
 * may complete any referral awaiting its details.
 *
 * The routing fields are asked for again only when they are missing,
 * which happens for referrals created by the earlier draft flow that
 * recorded nothing but a tracking number.
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

        // Nothing to do if the details are already in.
        if ($document->details_completed_at) {
            return false;
        }

        return in_array(
            $employee->section?->section_name,
            config('referral.details_completion_sections', ['RDO']),
            true
        );
    }

    public function rules(): array
    {
        return [

            'concerns' => ['required', 'array', 'min:1'],
            'concerns.*' => ['string', Rule::in(config('referral.concerns'))],
            'concern_other' => [
                Rule::requiredIf(fn () => $this->ticked('concerns', 'Other')),
                'nullable', 'string', 'max:150',
            ],

            'remarks' => ['required', 'string', Rule::in(config('referral.remarks'))],
            'remarks_other' => [
                Rule::requiredIf(fn () => $this->input('remarks') === 'Other'),
                'nullable', 'string', 'max:1000',
            ],

            /*
            * Only asked for when step 1 did not record them.
            */
            'taxpayer_name' => [
                Rule::requiredIf(fn () => $this->documentLacks('taxpayer_name')),
                'nullable', 'string', 'max:255',
            ],
            'document_date' => [
                Rule::requiredIf(fn () => $this->documentLacks('document_date')),
                'nullable', 'date',
            ],
            'destination_section_id' => [
                Rule::requiredIf(fn () => $this->documentLacks('destination_section_id')),
                'nullable', Rule::exists('sections', 'section_id'),
            ],
            'addressee' => [
                Rule::requiredIf(fn () => $this->documentLacks('addressee')),
                'nullable', 'string', Rule::in(config('referral.addressees')),
            ],

        ];
    }

    public function messages(): array
    {
        return [
            'concerns.required' => 'Please tick at least one concern.',
            'concerns.*.in' => 'That concern is not in the list.',
            'concern_other.required' => 'Please say what the other concern is.',

            'remarks.required' => 'Please choose a remark.',
            'remarks.in' => 'That remark is not in the list.',
            'remarks_other.required' => 'Please describe the status.',
            'remarks_other.max' => 'Remarks may not exceed 1000 characters.',

            'taxpayer_name.required' => 'Please enter the taxpayer\'s name.',
            'document_date.required' => 'Please enter the date issued.',
            'destination_section_id.required' => 'Please choose the receiving section.',
            'addressee.required' => 'Please choose who in that section should receive it.',
        ];
    }

    /**
     * Whether the document still lacks a field step 1 should have set.
     *
     * Not named missing() - Illuminate\Http\Request already has one.
     */
    protected function documentLacks(string $field): bool
    {
        return blank($this->route('document')?->{$field});
    }

    /**
     * Whether an option was ticked in a list field.
     */
    protected function ticked(string $field, string $option): bool
    {
        $values = $this->input($field);

        return is_array($values) && in_array($option, $values, true);
    }
}
