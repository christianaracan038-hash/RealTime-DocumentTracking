<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * There is no public registration.
 *
 * Breeze ships an open /register, and with one administrator tier that
 * meant anybody who reached the address could create an account able to
 * make employees, reset anybody's password and delete sections - which
 * would take a section's staff offline, since a section missing from
 * config/section.php cannot log in.
 *
 * Administrators are created by another administrator in the panel;
 * employees never registered themselves in the first place.
 */
class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_registration_screen_is_gone(): void
    {
        $this->get('/register')->assertNotFound();
    }

    public function test_nobody_can_register_themselves_an_account(): void
    {
        $this->post('/register', [
            'name' => 'Uninvited',
            'email' => 'uninvited@example.test',
            'password' => 'a-good-password',
            'password_confirmation' => 'a-good-password',
        ])->assertNotFound();

        $this->assertSame(0, User::count());
    }

    public function test_the_route_name_is_not_registered(): void
    {
        /*
         * The welcome page asks Route::has('register') before offering a
         * link, and Ziggy throws on a name it does not know - so this is
         * what keeps that page from breaking.
         */
        $this->assertFalse(Route::has('register'));
    }
}
