<?php

namespace App\Http\Requests\Employee\Documents;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Step 1 - registering a document's arrival.
 *
 * Asks only for what can be read off the paper in seconds: whose it is,
 * where it is going, and who it is addressed to. That is enough to route
 * the document, so it can be forwarded the same morning it arrives.
 *
 * The reference number, QR code, sending section and office code are
 * produced by the system. The descriptive fields - concerns, what is
 * being asked for, remarks - come later, in CompleteDocumentRequest.
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

            'destination_section_id.required' => 'Please choose the receiving section.',
            'destination_section_id.exists' => 'That section does not exist.',

            'addressee.required' => 'Please choose who in that section should receive it.',
            'addressee.in' => 'That option is not in the list.',

        ];
    }
}
