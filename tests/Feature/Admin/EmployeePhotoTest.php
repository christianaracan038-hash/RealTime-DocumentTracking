<?php

namespace Tests\Feature\Admin;

use App\Models\EmployeeAcc;
use App\Models\Role;
use App\Models\Section;
use App\Models\User;
use App\Services\AvatarStorage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Employee photographs.
 *
 * Stored on whichever disk config('filesystems.avatars') names, so the
 * office can move from a folder on one laptop to Supabase Storage by
 * changing .env. Paths are stored rather than URLs precisely so that move
 * needs no rewriting.
 */
class EmployeePhotoTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;

    protected EmployeeAcc $employee;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        $this->superAdmin = User::factory()->create();

        $section = Section::create([
            'section_code' => '1002',
            'section_name' => 'RDO',
            'is_active' => true,
        ]);

        $this->employee = EmployeeAcc::create([
            'username' => 'rdo.staff',
            'full_name' => 'John Dela Cruz',
            'position' => 'Atty.',
            'password' => 'password',
            'section_id' => $section->section_id,
            'role_id' => Role::create(['role_name' => 'Staff', 'is_active' => true])->role_id,
            'is_active' => true,
        ]);
    }

    protected function photo(int $width = 900, int $height = 600): UploadedFile
    {
        return UploadedFile::fake()->image('portrait.jpg', $width, $height);
    }

    public function test_a_photograph_is_stored_and_recorded(): void
    {
        $this->actingAs($this->superAdmin)
            ->post(route('super.employees.photo', $this->employee), [
                'photo' => $this->photo(),
            ])
            ->assertSessionHasNoErrors();

        $path = $this->employee->fresh()->avatar_path;

        $this->assertNotNull($path);

        Storage::disk('public')->assertExists($path);
    }

    public function test_it_is_squared_off_and_shrunk(): void
    {
        /*
         * Phone cameras produce several megabytes; an avatar is drawn at
         * forty pixels. Storing the original would mean sending megabytes
         * per face on a page listing a dozen of them.
         */
        $this->actingAs($this->superAdmin)
            ->post(route('super.employees.photo', $this->employee), [
                'photo' => $this->photo(1600, 1200),
            ])
            ->assertSessionHasNoErrors();

        $stored = Storage::disk('public')->get($this->employee->fresh()->avatar_path);

        [$width, $height] = getimagesizefromstring($stored);

        $this->assertSame(256, $width);
        $this->assertSame(256, $height, 'Stored square, so it never distorts a face.');
    }

    public function test_replacing_a_photograph_deletes_the_old_file(): void
    {
        $this->actingAs($this->superAdmin)
            ->post(route('super.employees.photo', $this->employee), ['photo' => $this->photo()]);

        $first = $this->employee->fresh()->avatar_path;

        $this->actingAs($this->superAdmin)
            ->post(route('super.employees.photo', $this->employee), ['photo' => $this->photo()]);

        $second = $this->employee->fresh()->avatar_path;

        $this->assertNotSame($first, $second);

        // Otherwise every replacement leaves a file nothing points at.
        Storage::disk('public')->assertMissing($first);
        Storage::disk('public')->assertExists($second);
    }

    public function test_a_photograph_can_be_removed(): void
    {
        $this->actingAs($this->superAdmin)
            ->post(route('super.employees.photo', $this->employee), ['photo' => $this->photo()]);

        $path = $this->employee->fresh()->avatar_path;

        $this->actingAs($this->superAdmin)
            ->delete(route('super.employees.photo.destroy', $this->employee))
            ->assertSessionHasNoErrors();

        $this->assertNull($this->employee->fresh()->avatar_path);

        Storage::disk('public')->assertMissing($path);
    }

    public function test_a_file_that_is_not_an_image_is_refused(): void
    {
        $this->actingAs($this->superAdmin)
            ->post(route('super.employees.photo', $this->employee), [
                'photo' => UploadedFile::fake()->create('payload.php', 40, 'application/x-php'),
            ])
            ->assertSessionHasErrors('photo');

        $this->assertNull($this->employee->fresh()->avatar_path);
    }

    public function test_an_enormous_image_is_refused(): void
    {
        $this->actingAs($this->superAdmin)
            ->post(route('super.employees.photo', $this->employee), [
                'photo' => UploadedFile::fake()->create('huge.jpg', 9000, 'image/jpeg'),
            ])
            ->assertSessionHasErrors('photo');
    }

    public function test_a_guest_cannot_set_a_photograph(): void
    {
        $this->post(route('super.employees.photo', $this->employee), [
            'photo' => $this->photo(),
        ])->assertRedirect(route('login'));

        $this->assertNull($this->employee->fresh()->avatar_path);
    }

    public function test_the_url_is_null_until_there_is_a_photograph(): void
    {
        $avatars = app(AvatarStorage::class);

        $this->assertNull($avatars->url($this->employee));
        $this->assertNull($avatars->url(null));

        $avatars->store($this->employee, $this->photo());

        $this->assertNotNull($avatars->url($this->employee->fresh()));
    }

    public function test_a_face_does_not_travel_to_another_section(): void
    {
        app(AvatarStorage::class)->store($this->employee, $this->photo());

        /*
         * A photograph identifies a person as surely as their name, so
         * avatar_path is hidden and avatar_url unappended for the same
         * reason display_name is - an employee is serialised as a
         * document's creator into payloads other sections receive.
         */
        $payload = json_encode($this->employee->fresh()->toArray());

        $this->assertStringNotContainsString('avatar_path', $payload);
        $this->assertStringNotContainsString('avatar_url', $payload);
    }

    public function test_the_administrator_sees_every_face(): void
    {
        app(AvatarStorage::class)->store($this->employee, $this->photo());

        $page = $this->actingAs($this->superAdmin)
            ->get(route('super.employees.index'))
            ->assertOk()
            ->viewData('page');

        $listed = collect($page['props']['employees'])->firstWhere('username', 'rdo.staff');

        $this->assertNotNull($listed['avatar_url']);
    }
}
