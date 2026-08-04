<?php

namespace App\Http\Controllers\Admin\Sections;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Section;


class SectionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
         $sections = Section::orderBy('section_name')->get();

        return Inertia::render('Admin/Sections/Index', [
            'sections' => $sections,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
         $validated = $request->validate([
            'section_code' => [
                'required',
                'string',
                'max:20',
                 'unique:sections,section_code',
            ],

            'section_name' => [
                'required',
                'string',
                'max:100',
            ],

            'description' => [
                'nullable',
                'string',
                'max:255',
            ],

            'is_active' => [
                'required',
                'boolean',
            ],
        ]);

        Section::create($validated);

        return redirect()->back()->with('success', 'Section added successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Section $section)
    {
        $validated = $request->validate([
            'section_code' => 'required|string|max:20|unique:sections,section_code,' . $section->section_id . ',section_id',
            'section_name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'is_active' => 'required|boolean',
        ]);

        $section->update($validated);

        return redirect()->back()->with('success', 'Section updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Section $section)
    {
        $section->delete();

        return redirect()->back()->with('success', 'Section deleted successfully.');
    }
}
