<?php

namespace App\Http\Requests\Employee\Documents;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Registering a referral (BIR Form 2309 - Reference Slip).
 *
 * The reference number, QR code, sending section and office code are
 * all produced by the system, so the form asks only for what the clerk
 * reads off the paper.
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

            'concern' => [
                'required',
                'string',
                Rule::in(config('referral.concerns')),
            ],

            'referred_for' => [
                'required',
                'string',
                Rule::in(config('referral.referred_for')),
            ],

            'remarks' => [
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

            'concern.required' => 'Please choose what this referral is about.',
            'concern.in' => 'That concern is not in the list.',

            'referred_for.required' => 'Please choose what the receiving office should do.',
            'referred_for.in' => 'That option is not in the list.',

            'remarks.max' => 'Remarks may not exceed 1000 characters.',

            'destination_section_id.required' => 'Please choose which section to send this to.',
            'destination_section_id.exists' => 'That section does not exist.',

            'addressee.required' => 'Please choose who in that section should receive it.',
            'addressee.in' => 'That option is not in the list.',

        ];
    }
}
