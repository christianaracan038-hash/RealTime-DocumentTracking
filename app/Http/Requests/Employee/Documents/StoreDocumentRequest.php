<?php

namespace App\Http\Requests\Employee\Documents;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Step 1 - registering a document's arrival.
 *
 * One field. The taxpayer is standing at the counter, and a name is all
 * anybody has time to type.
 *
 * The date is NOT accepted here, deliberately. It is stamped by the
 * server at the moment of saving - see DocumentService::register(). The
 * office wanted a date nobody can set, and a date the browser sends is a
 * date the browser chose: greying the field out would stop an honest
 * clerk and nobody else.
 *
 * Where it goes and who it is addressed to are decided in step 2 - see
 * CompleteDocumentRequest, which asks for whatever is still missing.
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

            'taxpayer_name.required' => 'Please enter the taxpayer\'s name.',
            'taxpayer_name.max' => 'The taxpayer\'s name may not exceed 255 characters.',

        ];
    }
}
