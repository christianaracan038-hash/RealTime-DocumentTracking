<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DocumentTrackingController;

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