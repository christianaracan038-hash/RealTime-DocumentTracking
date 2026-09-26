<?php

use App\Http\Controllers\Admin\EmployeeAccountController;
use App\Http\Controllers\Admin\Roles\RoleController;
use App\Http\Controllers\Admin\Sections\SectionController;
use App\Http\Controllers\Employee\Documents\CommentInboxController;
use App\Http\Controllers\Employee\Documents\DocumentController;
use App\Http\Controllers\Employee\Documents\DocumentQrController;
use App\Http\Controllers\Employee\Documents\OversightController;
use App\Http\Controllers\Employee\Documents\RegistrationDeskController;
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

    Route::middleware(['auth:employee', 'desk', 'section:'.$sectionName])
        ->get($dashboard['path'], [SectionDashboardController::class, 'index'])
        ->defaults('page', $dashboard['page'])
        ->name($dashboard['route']);

}

Route::middleware(['auth:employee', 'desk'])->group(function () {

    /*
    * Step 1, on its own screen for the account that does nothing else.
    * The 'desk' middleware sends a counter account back here from
    * anywhere else in the portal.
    */
    Route::get('/registration', [RegistrationDeskController::class, 'index'])
        ->name('registration.index');

    Route::get('/documents/create', [DocumentController::class, 'create'])
        ->name('documents.create');

    Route::post('/documents', [DocumentController::class, 'store'])
        ->name('documents.store');

    /*
    * Referrals this employee registered, and where new ones are
    * registered from. Reached by the dashboard's "New referral"
    * button, which opens the form on arrival via ?new=1.
    */
    Route::get('/referrals', [DocumentController::class, 'referrals'])
        ->name('referrals.index');

    /*
    * The RDO's oversight screens. Both check the section themselves,
    * from config('referral.oversight_sections').
    */
    Route::get('/comments', [OversightController::class, 'comments'])
        ->name('comments.index');

    Route::post('/documents/{document}/comments', [OversightController::class, 'storeComment'])
        ->name('comments.store');

    Route::get('/archive', [OversightController::class, 'archive'])
        ->name('archive.index');

    /*
    * The other half of the conversation, and the one every section has:
    * the notes addressed to your own section, and saying you have read
    * one.
    */
    Route::get('/comments/inbox', [CommentInboxController::class, 'index'])
        ->name('comments.inbox');

    Route::patch('/comments/{comment}/acknowledge', [CommentInboxController::class, 'acknowledge'])
        ->name('comments.acknowledge');

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

    Route::patch('/documents/{document}/complete', [DocumentController::class, 'complete'])
        ->name('documents.complete');

    /*
    * One document's full detail, fetched when a history row is opened.
    */
    Route::get('/documents/{document}/detail', [DocumentController::class, 'detail'])
        ->name('documents.detail');

});

require __DIR__.'/auth.php';
