<?php

namespace App\Http\Controllers\RDO;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Response;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\Document;


class DashboardController extends Controller
{
     public function index(): Response
    {
         $employee = Auth::guard('employee')->user();

        $documents = Document::query()
            ->with([
                'status',
                'currentSection',
                'destinationSection',
            ])
            ->where('destination_section_id', $employee->section_id)
            ->where('status_id', 1)
            ->latest('created_at')
            ->get();

        return Inertia::render('RDO/Dashboard', [
            'documents' => $documents,
        ]);
    }
}
