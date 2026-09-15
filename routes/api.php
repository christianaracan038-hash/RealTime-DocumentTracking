<?php

use App\Http\Controllers\Api\DocumentTrackingController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web'])->group(function () {

    Route::middleware('auth:employee')->group(function () {

        Route::post(
            '/documents/scan',
            [DocumentTrackingController::class, 'scan']
        )->name('api.documents.scan');

        Route::post(
            '/documents/{document}/receive',
            [DocumentTrackingController::class, 'receive']
        )->name('api.documents.receive');

        Route::post(
            '/documents/{document}/forward',
            [DocumentTrackingController::class, 'forward']
        )->name('api.documents.forward');

        Route::post(
            '/documents/{document}/complete',
            [DocumentTrackingController::class, 'complete']
        )->name('api.documents.complete');

    });

});
