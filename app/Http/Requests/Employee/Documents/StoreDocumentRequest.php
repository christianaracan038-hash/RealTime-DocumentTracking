<?php

namespace App\Http\Requests\Employee\Documents;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDocumentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation Rules
     */
    public function rules(): array
    {
        return [

            'document_date' => [
                'required',
                'date',
            ],

            'description' => [
                'required',
                'string',
                'max:1000',
            ],

            'reference_number' => [
                'nullable',
                'string',
                'max:100',
            ],

            'destination_section_id' => [
                'required',
                Rule::exists('sections', 'section_id'),
            ],

        ];
    }

    /**
     * Custom Validation Messages
     */
    public function messages(): array
    {
        return [

            'document_date.required' =>
                'Please select the document date.',

            'document_date.date' =>
                'Invalid document date.',

            'description.required' =>
                'Please enter the document description.',

            'description.max' =>
                'Description may not exceed 1000 characters.',

            'destination_section_id.required' =>
                'Please select the destination section.',

            'destination_section_id.exists' =>
                'Selected destination section is invalid.',

        ];
    }
}