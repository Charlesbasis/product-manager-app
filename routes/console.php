<?php

use App\Console\Commands\GenerateSitemap;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('sitemap:generate', function () {
    $this->call(GenerateSitemap::class);
})->purpose('Generate the sitemap.xml file');

// Schedule it to run daily
Schedule::command('sitemap:generate')->daily();
