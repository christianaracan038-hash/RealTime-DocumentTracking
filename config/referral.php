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
    * What the referral is about. "Other" is stored as-is; the form does
    * not ask for a follow-up value.
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

];
