<?php

use App\Http\Controllers\Admin\AdministratorController;
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

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/admin', [EmployeeAccountController::class, 'index'])->name('admin.dashboard');

    /*
    * Employee accounts. Creating one was all that existed here; an
    * account could not be corrected, switched off, or given a new
    * password, which left a forgotten password with no remedy at all.
    */
    Route::post('/admin/employees', [EmployeeAccountController::class, 'store'])
        ->name('admin.employees.store');

    Route::patch('/admin/employees/{employee}', [EmployeeAccountController::class, 'update'])
        ->name('admin.employees.update');

    Route::patch('/admin/employees/{employee}/password', [EmployeeAccountController::class, 'resetPassword'])
        ->name('admin.employees.password');

    Route::patch('/admin/employees/{employee}/active', [EmployeeAccountController::class, 'setActive'])
        ->name('admin.employees.active');

    /*
    * The administrator accounts themselves - one tier, and the office
    * holds one. Switching an account off is also the handover
    * mechanism for the developers' own accounts.
    */
    Route::get('/admin/administrators', [AdministratorController::class, 'index'])
        ->name('admin.administrators.index');

    Route::post('/admin/administrators', [AdministratorController::class, 'store'])
        ->name('admin.administrators.store');

    Route::patch('/admin/administrators/{user}', [AdministratorController::class, 'update'])
        ->name('admin.administrators.update');

    Route::patch('/admin/administrators/{user}/password', [AdministratorController::class, 'resetPassword'])
        ->name('admin.administrators.password');

    Route::patch('/admin/administrators/{user}/active', [AdministratorController::class, 'setActive'])
        ->name('admin.administrators.active');

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
