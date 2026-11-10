<?php

use App\Http\Controllers\ProductController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('products/export', [ProductController::class, 'export'])->name('products.export.download');

    Route::post('products/import', [ProductController::class, 'import'])->name('products.import');

    Route::resource('products', ProductController::class);
});

// Blog Routes
Route::get('/blog', [\App\Http\Controllers\BlogController::class, 'index'])->name('blog.index');
Route::get('/blog/{slug}', [\App\Http\Controllers\BlogController::class, 'show'])->name('blog.show');

// Policy Routes
Route::get('/privacy-policy', function () {
    return Inertia::render('privacy-policy');
})->name('privacy-policy');

Route::get('/terms-of-service', function () {
    return Inertia::render('terms-of-service');
})->name('terms-of-service');

Route::get('/cookie-policy', function () {
    return Inertia::render('cookie-policy');
})->name('cookie-policy');

Route::middleware(['auth', 'verified'])->prefix('api')->group(function () {

    // Dashboard-specific API routes
    Route::prefix('dashboard')->name('dashboard.')->group(function () {
        Route::get('/stats', [ProductController::class, 'dashboardStats'])
            ->name('stats');

        Route::get('/activity', [ProductController::class, 'getActivityLog'])
            ->name('activity');

    });
});

require __DIR__.'/settings.php';
