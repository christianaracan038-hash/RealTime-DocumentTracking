<?php

/*
|--------------------------------------------------------------------------
| Referral (BIR Form 2309 - Reference Slip)
|--------------------------------------------------------------------------
|
| The choices offered when registering a referral. Each list feeds both
| the dropdown in the form and the server-side validation rule, so the
| two cannot drift apart. Add to these lists, do not hard-code elsewhere.
|
*/

return [

    /*
    * Every list below is shown as tick boxes. "Other" in any of them
    * reveals a text box, and what is typed there is stored in place of
    * the word "Other".
    *
    * Concerns and For allow more than one tick, as on the paper form.
    * Remarks is one choice, since a document has one status.
    */

    /*
    * What the referral is about.
    */
    'concerns' => [
        'Tax Assumption',
        'Promissory Note',
        'Request for Installment Payment of Open Cases',
        'Other',
    ],

    /*
    * The "FOR" block on the printed slip - what the receiving office is
    * being asked to do.
    */
    'referred_for' => [
        'Approval',
        'Comment',
        'Investigation',
        'Initial',
        'Signature',
        'As Requested',
        'Dissemination',
        'Necessary Action',
        'Other',
    ],

    /*
    * Who in the receiving section the referral is addressed to. Printed
    * as "<addressee>, <section>", e.g. "Chief, Compliance Section".
    */
    'addressees' => [
        'Chief',
        'Authorized & Chief',
    ],

    /*
    * Where the document stands when it is registered.
    */
    'remarks' => [
        'Complied',
        'Completed',
        'Processing',
        'Other',
    ],

];
