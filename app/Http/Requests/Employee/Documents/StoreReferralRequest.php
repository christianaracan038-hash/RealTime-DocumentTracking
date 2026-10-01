<?php

namespace App\Http\Requests\Employee\Documents;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Registering a referral in one pass.
 *
 * The two-step split exists for the counter, where a taxpayer is standing
 * there and the only things anybody has time to take are a name and a
 * date. At a desk, with the document in front of you and time to read it,
 * splitting the work in two just means filling one form to unlock another.
 *
 * So this asks for everything at once. It always creates a new referral
 * and never touches an existing one, which is why it is open to any
 * section: config('referral.details_completion_sections') governs who may
 * complete somebody *else's* draft, and that is untouched here.
 */
class StoreReferralRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            /*
            * The arrival, as step 1 would have taken it - and like step
            * 1, the date is stamped by the server rather than accepted
            * here. An anti-backdating rule with one form that still
            * accepts a date is not a rule.
            */
            'taxpayer_name' => ['required', 'string', 'max:255'],

            // Where it goes.
            'destination_section_id' => [
                'required',
                Rule::exists('sections', 'section_id'),
            ],
            /*
            * No addressee. Everything is addressed to the Chief, so the
            * server writes it rather than asking - and if the Chief is
            * away, whoever receives it does so on their own account,
            * which the movement trail records.
            */

            // What it is about - free text, not a tick list.
            'concern' => ['required', 'string', 'max:1000'],

        ];
    }

    public function messages(): array
    {
        return [
            'taxpayer_name.required' => 'Please enter the taxpayer\'s name.',
            'taxpayer_name.max' => 'The taxpayer\'s name may not exceed 255 characters.',

            'destination_section_id.required' => 'Please choose the receiving section.',
            'destination_section_id.exists' => 'That section does not exist.',

            'concern.required' => 'Please enter the details.',
            'concern.max' => 'The details may not exceed 1000 characters.',
        ];
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
