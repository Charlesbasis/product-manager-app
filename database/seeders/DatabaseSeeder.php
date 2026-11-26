<?php

namespace Database\Seeders;

use App\Models\User;
use App\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            return;
        }

        $user = User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => env('SEED_ADMIN_PASSWORD', Str::password(16)),
                'email_verified_at' => now(),
            ]
        );

        $user->forceFill([
            'role' => Role::Admin,
        ])->save();
    }
}
