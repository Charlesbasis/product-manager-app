<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Role;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CreateAdminUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:create-admin-user';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a new admin user and bypass email verification';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => 'Admin',
                'password' => Hash::make(Str::random(16)),
                'role' => Role::Admin,
                'email_verified_at' => now(), // Bypass email verification for CLI created
            ]
        );
        $this->info("Admin created/verified: {$user->email}");
    }
}
