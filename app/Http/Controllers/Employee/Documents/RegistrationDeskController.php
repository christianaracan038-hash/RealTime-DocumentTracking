<?php

namespace App\Http\Controllers\Employee\Documents;

use App\Http\Controllers\Controller;
use App\Services\DocumentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The registration desk - step 1, and nothing else.
 *
 * One screen for the account at the counter: register the arrival, and
 * see what has been registered so far today. Two fields and a button,
 * because this is done with a taxpayer waiting.
 *
 * What it deliberately does not show: the receiving section, the
 * concerns, the remarks. Those need the document read properly, which
 * is step 2's job on the Referrals page.
 */
class RegistrationDeskController extends Controller
{
    public function index(
        Request $request,
        DocumentService $documentService
    ): Response {
        $employee = Auth::guard('employee')->user();

        $search = $request->string('search')->toString();

        return Inertia::render('Employees/Registration/Desk', [
            /*
            * Only what this account registered. The counter's own record
            * of its morning, not the section's workload.
            */
            'registered' => $documentService->getRegisteredDocuments(
                $employee,
                $search,
                perPage: 10
            ),

            /*
            * Printed as the "From" line, so the counter can see which
            * section it is registering on behalf of.
            */
            'fromSection' => $employee->section?->only([
                'section_id',
                'section_name',
                'section_code',
                'description',
            ]),

            'filters' => [
                'search' => $search,
            ],

            /*
            * Open the form on arrival, so signing in at the counter
            * puts the cursor where it is needed.
            */
            'openForm' => $request->boolean('new'),
        ]);
    }
}
