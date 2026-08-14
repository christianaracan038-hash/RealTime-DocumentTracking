<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Api\DocumentTrackingController;

Route::middleware(['web'])->group(function () {

    Route::post('/test-api-auth', function () {
        return response()->json([
            'check' => Auth::guard('employee')->check(),
            'employee' => Auth::guard('employee')->user(),
            'session_id' => session()->getId(),
            'session_data' => session()->all(),
        ]);
    });

    Route::middleware('auth:employee')->group(function () {

        Route::post(
            '/documents/scan',
            [DocumentTrackingController::class, 'scan']
        )->name('api.documents.scan');

        Route::post(
            '/documents/{document}/receive',
            [DocumentTrackingController::class, 'receive']
        )->name('api.documents.receive');

    });

});