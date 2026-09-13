<?php

use App\Http\Controllers\Admin\EmployeeAccountController;
use App\Http\Controllers\Admin\Roles\RoleController;
use App\Http\Controllers\Admin\Sections\SectionController;
use App\Http\Controllers\Employee\Documents\DocumentController;
use App\Http\Controllers\Employee\Documents\DocumentQrController;
use App\Http\Controllers\Employee\SectionDashboardController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

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

Route::get('/test-web-auth', function () {
    return response()->json([
        'check' => Auth::guard('employee')->check(),
        'employee' => Auth::guard('employee')->user(),
        'session_id' => session()->getId(),
        'session_data' => session()->all(),
    ]);
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/admin', [EmployeeAccountController::class, 'index'])->name('admin.dashboard');
    Route::post('/admin/employees', [EmployeeAccountController::class, 'store'])->name('admin.employees.store');
    Route::resource('admin/sections', SectionController::class);
    Route::resource('admin/roles', RoleController::class);
});

/*
|--------------------------------------------------------------------------
| Section dashboards
|--------------------------------------------------------------------------
|
| One route per entry in config/section.php, each guarded by the section
| middleware so an employee can only reach their own section's dashboard.
| The page component travels as a route default and is read back by
| SectionDashboardController.
|
*/

foreach (config('section') as $sectionName => $dashboard) {

    Route::middleware(['auth:employee', 'section:'.$sectionName])
        ->get($dashboard['path'], [SectionDashboardController::class, 'index'])
        ->defaults('page', $dashboard['page'])
        ->name($dashboard['route']);

}

Route::middleware(['auth:employee'])->group(function () {

    Route::get('/documents/create', [DocumentController::class, 'create'])
        ->name('documents.create');

    Route::post('/documents', [DocumentController::class, 'store'])
        ->name('documents.store');

    Route::get('/documents/history', [DocumentController::class, 'history'])
        ->name('documents.history');

    Route::get('/employee/documents', [DocumentController::class, 'documents'])
        ->name('documents.index');

    /*
    * QR image. Regenerates itself when the file is missing from this
    * machine, so documents registered elsewhere still display.
    */
    Route::get('/documents/{document}/qr', [DocumentQrController::class, 'show'])
        ->name('documents.qr');

});

require __DIR__.'/auth.php';
