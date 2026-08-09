<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Admin\Sections\SectionController;
use App\Http\Controllers\Admin\Roles\RoleController;
use App\Http\Controllers\RDO\DashboardController;
use App\Http\Controllers\Assessment\DashboardController as AssessmentDashboardController;
use App\Http\Controllers\Employee\Documents\DocumentController;



Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/admin', [\App\Http\Controllers\Admin\EmployeeAccountController::class, 'index'])->name('admin.dashboard');
    Route::post('/admin/employees', [\App\Http\Controllers\Admin\EmployeeAccountController::class, 'store'])->name('admin.employees.store');
    Route::resource('admin/sections', SectionController::class);
    Route::resource('admin/roles', RoleController::class);
});


Route::middleware([
    'auth:employee',
    'section:RDO',
])->group(function () {

    Route::get('/rdo/dashboard', [DashboardController::class, 'index'])
        ->name('rdo.dashboard');

});

Route::middleware(['auth:employee', 'section:ASSESSMENT'])->group(function () {

    Route::get('/assessment/dashboard', [AssessmentDashboardController::class, 'index'])
        ->name('assessment.dashboard');

});

Route::middleware(['auth:employee'])->group(function () {

    Route::get('/documents', [DocumentController::class, 'index'])
        ->name('documents.index');

    Route::get('/documents/create', [DocumentController::class, 'create'])
        ->name('documents.create');

     Route::post('/documents', [DocumentController::class, 'store'])
        ->name('documents.store');

});


require __DIR__.'/auth.php';
