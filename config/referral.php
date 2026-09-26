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
    * How long a document may sit with one section before it is late.
    *
    * The office wants every referral moved within two days. A document
    * waiting less than `fresh_until` hours shows green; up to
    * `aging_until` shows yellow; beyond that red; and past
    * `overdue_after` it is flagged overdue.
    */
    'aging' => [
        'fresh_until' => 6,
        'aging_until' => 24,
        'overdue_after' => 48,
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

    /*
    * Which section(s) may complete a draft's referral details
    * (Step 2) — regardless of who generated the QR in Step 1 or
    * which section currently holds the document.
    *
    * Must match `sections.section_name` EXACTLY (case, apostrophes,
    * spacing and all), since the check is a strict comparison. Add
    * more entries here if there is more than one RDO/ARDO section.
    */
    /*
    * Sections that may leave comments on documents held elsewhere, and
    * see the archive. Most transactions start and end at the RDO, so it
    * is the office that notices when something has stopped moving.
    */
    'oversight_sections' => [
        'RDO',
    ],

    'details_completion_sections' => [
        'RDO',
    ],

    /*
    * Roles whose accounts do step 1 and nothing else.
    *
    * The RDO runs the counter with two accounts: one registers arrivals
    * as taxpayers walk in, the other fills in the referral details
    * later. An account with one of these roles sees only the
    * registration desk - no dashboard, no queue, no history of other
    * sections' work - because at the counter there is no time to read
    * any of it.
    *
    * Must match `roles.role_name` exactly. The admin assigns the role
    * when creating the account; RoleSeeder creates the role itself.
    */
    'registration_roles' => [
        'Registration',
    ],

];
