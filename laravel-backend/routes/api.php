<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PackageController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\AdminController;

Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'backend' => 'laravel']);
});

Route::get('/packages', [PackageController::class, 'index']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::middleware('role:customer')->group(function () {
        Route::post('/bookings', [BookingController::class, 'store']);
        Route::get('/bookings/mine', [BookingController::class, 'mine']);
        Route::patch('/bookings/{id}/cancel', [BookingController::class, 'cancel']);
    });

    Route::middleware('role:staff,admin')->group(function () {
        Route::get('/staff/bookings', [StaffController::class, 'index']);
        Route::patch('/staff/bookings/{id}/status', [StaffController::class, 'updateStatus']);
        Route::post('/staff/bookings/{id}/pay', [StaffController::class, 'pay']);
    });

    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/packages', [AdminController::class, 'packages']);
        Route::post('/admin/packages', [AdminController::class, 'createPackage']);
        Route::patch('/admin/packages/{id}/visibility', [AdminController::class, 'visibility']);
        Route::get('/admin/overview', [AdminController::class, 'overview']);
    });
});