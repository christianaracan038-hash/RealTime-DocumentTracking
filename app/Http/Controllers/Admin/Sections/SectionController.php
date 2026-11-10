<?php

namespace App\Http\Controllers\Admin\Sections;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\EmployeeAcc;
use App\Models\Section;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SectionController extends Controller
{
    public function index()
    {
        return Inertia::render('SuperAdmin/Sections/Index', [
            'sections' => Section::orderBy('section_name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'section_code' => ['required', 'string', 'max:20', 'unique:sections,section_code'],
            'section_name' => ['required', 'string', 'max:100', 'unique:sections,section_name'],
            'description' => ['nullable', 'string', 'max:255'],
            'is_active' => ['required', 'boolean'],
        ]);

        Section::create($validated);

        return back()->with('success', 'Section added successfully.');
    }

    public function update(Request $request, Section $section)
    {
        $validated = $request->validate([
            'section_code' => [
                'required', 'string', 'max:20',
                Rule::unique('sections', 'section_code')->ignore($section->getKey(), $section->getKeyName()),
            ],
            'section_name' => [
                'required', 'string', 'max:100',
                Rule::unique('sections', 'section_name')->ignore($section->getKey(), $section->getKeyName()),
            ],
            'description' => ['nullable', 'string', 'max:255'],
            'is_active' => ['required', 'boolean'],
        ]);

        $renamed = $validated['section_name'] !== $section->section_name;

        if ($renamed && EmployeeAcc::where('section_id', $section->getKey())->exists()) {
            return back()->withErrors([
                'section_name' => 'This section has employee accounts, so its name cannot be changed.',
            ]);
        }

        $section->update($validated);

        return back()->with('success', 'Section updated.');
    }

    public function destroy(Section $section)
    {
        if (EmployeeAcc::where('section_id', $section->getKey())->exists()) {
            return back()->withErrors([
                'delete' => 'This section still has employee accounts. Move or switch them off first.',
            ]);
        }

        $hasDocuments = Document::where('current_section_id', $section->getKey())
            ->orWhere('destination_section_id', $section->getKey())
            ->exists();

        if ($hasDocuments) {
            return back()->withErrors([
                'delete' => 'This section still has documents on record and cannot be deleted. Mark it inactive instead.',
            ]);
        }

        $section->delete();

        return back()->with('success', 'Section deleted.');
    }
}