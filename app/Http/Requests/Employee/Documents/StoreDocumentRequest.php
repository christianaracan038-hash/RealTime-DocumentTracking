<?php

namespace App\Http\Requests\Employee\Documents;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Step 1 - registering a document's arrival.
 *
 * Two fields, because this happens with the taxpayer standing at the
 * counter: whose document it is, and the date on it. That is enough to
 * start the clock and mint the reference number, which is the whole
 * point of doing it now rather than at the end of the day.
 *
 * Where it goes and who it is addressed to are decided in step 2, by
 * someone reading the document properly - see CompleteDocumentRequest,
 * which asks for whatever is still missing.
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

        ];
    }

    public function messages(): array
    {
        return [

            'document_date.required' => 'Please enter the date issued.',
            'document_date.date' => 'That is not a valid date.',

            'taxpayer_name.required' => 'Please enter the taxpayer\'s name.',
            'taxpayer_name.max' => 'The taxpayer\'s name may not exceed 255 characters.',

        ];
    }
}
