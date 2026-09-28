<?php

namespace App\Providers;

use App\Listeners\RecordAuthenticationActivity;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        /*
        * Signing in and out goes to the audit log. Registered explicitly
        * rather than left to listener discovery so that it is visible
        * here - somebody auditing what is recorded should be able to
        * find it from the service provider rather than by knowing that
        * a folder is scanned.
        */
        Event::listen(Login::class, [RecordAuthenticationActivity::class, 'onLogin']);
        Event::listen(Logout::class, [RecordAuthenticationActivity::class, 'onLogout']);
        Event::listen(Failed::class, [RecordAuthenticationActivity::class, 'onFailed']);
    }
}
