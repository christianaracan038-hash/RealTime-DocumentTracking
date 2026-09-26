<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Managing the administrator accounts themselves.
 *
 * One tier, and every administrator can manage every other one. The two
 * ways that goes badly are guarded: nobody can switch off their own
 * account, and the last active administrator cannot be switched off.
 * Without those, one wrong click leaves a live system with taxpayer data
 * in it that nobody can administer.
 */
class AdministratorManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $me;

    protected function setUp(): void
    {
        parent::setUp();

        $this->me = $this->administrator('Office Administrator', 'admin@rdo111.test');
    }

    protected function administrator(string $name, string $email, bool $active = true): User
    {
        return User::create([
            'name' => $name,
            'email' => $email,
            'password' => 'first-password',
            'is_active' => $active,
        ]);
    }

    public function test_an_administrator_can_be_added(): void
    {
        $this->actingAs($this->me)
            ->post(route('super.administrators.store'), [
                'name' => 'Christian Aracan',
                'email' => 'christian@rdo111.test',
                'password' => 'a-good-password',
                'password_confirmation' => 'a-good-password',
            ])
            ->assertSessionHasNoErrors();

        $added = User::where('email', 'christian@rdo111.test')->first();

        $this->assertSame('Christian Aracan', $added->name);
        $this->assertTrue($added->is_active);
        $this->assertTrue(Hash::check('a-good-password', $added->password));
    }

    public function test_an_email_cannot_be_reused(): void
    {
        $this->actingAs($this->me)
            ->post(route('super.administrators.store'), [
                'name' => 'Someone Else',
                'email' => $this->me->email,
                'password' => 'a-good-password',
                'password_confirmation' => 'a-good-password',
            ])
            ->assertSessionHasErrors('email');
    }

    public function test_an_administrator_can_be_corrected(): void
    {
        $other = $this->administrator('Typo Nmae', 'typo@rdo111.test');

        $this->actingAs($this->me)
            ->patch(route('super.administrators.update', $other), [
                'name' => 'Correct Name',
                'email' => 'correct@rdo111.test',
            ])
            ->assertSessionHasNoErrors();

        $other->refresh();

        $this->assertSame('Correct Name', $other->name);
        $this->assertSame('correct@rdo111.test', $other->email);

        // Editing never touches the password.
        $this->assertTrue(Hash::check('first-password', $other->password));
    }

    public function test_a_password_can_be_reset(): void
    {
        $other = $this->administrator('Forgetful Admin', 'forgot@rdo111.test');

        $this->actingAs($this->me)
            ->patch(route('super.administrators.password', $other), [
                'password' => 'brand-new-password',
                'password_confirmation' => 'brand-new-password',
            ])
            ->assertSessionHasNoErrors();

        $this->assertTrue(Hash::check('brand-new-password', $other->fresh()->password));
    }

    public function test_another_administrator_can_be_switched_off(): void
    {
        $leaving = $this->administrator('Developer', 'dev@rdo111.test');

        $this->actingAs($this->me)
            ->patch(route('super.administrators.active', $leaving), ['is_active' => false])
            ->assertSessionHasNoErrors();

        $this->assertFalse($leaving->fresh()->is_active);

        // The account survives, so whatever they did stays attributable.
        $this->assertNotNull(User::find($leaving->id));
    }

    public function test_you_cannot_switch_off_your_own_account(): void
    {
        // Another active administrator exists, so this is not a last-one case.
        $this->administrator('Someone Else', 'other@rdo111.test');

        $this->actingAs($this->me)
            ->patch(route('super.administrators.active', $this->me), ['is_active' => false])
            ->assertSessionHasErrors('is_active');

        $this->assertTrue($this->me->fresh()->is_active);
    }

    public function test_the_last_active_administrator_cannot_be_switched_off(): void
    {
        /*
         * A second administrator exists but is already switched off, so
         * deactivating this one would leave nobody who can administer the
         * system - recoverable only by editing the database by hand.
         */
        $dormant = $this->administrator('Dormant', 'dormant@rdo111.test', active: false);

        $this->actingAs($dormant);

        $this->patch(route('super.administrators.active', $this->me), ['is_active' => false])
            ->assertSessionHasErrors('is_active');

        $this->assertTrue($this->me->fresh()->is_active);
    }

    public function test_an_administrator_can_be_reinstated(): void
    {
        $returning = $this->administrator('Back Again', 'back@rdo111.test', active: false);

        $this->actingAs($this->me)
            ->patch(route('super.administrators.active', $returning), ['is_active' => true])
            ->assertSessionHasNoErrors();

        $this->assertTrue($returning->fresh()->is_active);
    }

    public function test_the_listing_marks_which_one_is_you(): void
    {
        $this->administrator('Christian Aracan', 'christian@rdo111.test');

        $page = $this->actingAs($this->me)
            ->get(route('super.administrators.index'))
            ->assertOk()
            ->viewData('page');

        $this->assertSame($this->me->id, $page['props']['currentId']);
        $this->assertCount(2, $page['props']['administrators']);
    }

    public function test_a_guest_cannot_manage_administrators(): void
    {
        $this->get(route('super.administrators.index'))->assertRedirect(route('login'));

        $this->post(route('super.administrators.store'), [
            'name' => 'Intruder',
            'email' => 'intruder@example.test',
            'password' => 'a-good-password',
            'password_confirmation' => 'a-good-password',
        ])->assertRedirect(route('login'));

        $this->assertSame(1, User::count());
    }
}
