<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Spatie\Sitemap\Sitemap;
use Spatie\Sitemap\Tags\Url;

class GenerateSitemap extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sitemap:generate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate the sitemap.xml file for the application.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $path = config('sitemap.path') ?: public_path('sitemap.xml');

        $directory = dirname($path);

        if (! is_dir($directory)) {
            $this->error("Sitemap directory does not exist: {$directory}");

            return self::FAILURE;
        }

        $this->info("Generating sitemap to: {$path}");

        $sitemap = Sitemap::create();

        // 1. Add Static Pages
        $sitemap->add(
            Url::create(route('home'))
                ->setPriority(1.0)
                ->setChangeFrequency(Url::CHANGE_FREQUENCY_DAILY)
        );

        $sitemap->add(
            Url::create(route('blog.index'))
                ->setPriority(0.9)
                ->setChangeFrequency(Url::CHANGE_FREQUENCY_HOURLY)
        );

        // Add Policy Pages
        $sitemap->add(
            Url::create(route('privacy-policy'))
                ->setPriority(0.5)
                ->setChangeFrequency(Url::CHANGE_FREQUENCY_MONTHLY)
        );

        $sitemap->add(
            Url::create(route('terms-of-service'))
                ->setPriority(0.5)
                ->setChangeFrequency(Url::CHANGE_FREQUENCY_MONTHLY)
        );

        $sitemap->add(
            Url::create(route('cookie-policy'))
                ->setPriority(0.5)
                ->setChangeFrequency(Url::CHANGE_FREQUENCY_MONTHLY)
        );

        // 2. Add Dynamic Content (Products)
        // Adjust this logic if products are behind authentication
        Product::all()->each(function (Product $product) use ($sitemap) {
            $sitemap->add(
                Url::create(route('products.show', $product))
                    ->setLastModificationDate($product->updated_at)
                    ->setPriority(0.8)
                    ->setChangeFrequency(Url::CHANGE_FREQUENCY_WEEKLY)
            );
        });

        // 3. Add Dynamic Content (Blog Posts from WordPress)
        try {
            $response = Http::get('https://www.cvhowlader.com/wp-json/wp/v2/posts', [
                'per_page' => 100, // Fetch up to 100 posts for the sitemap
            ]);

            if ($response->successful()) {
                $posts = $response->json();
                foreach ($posts as $post) {
                    $sitemap->add(
                        Url::create(route('blog.show', $post['slug']))
                            ->setLastModificationDate(new \DateTime($post['modified']))
                            ->setPriority(0.7)
                            ->setChangeFrequency(Url::CHANGE_FREQUENCY_MONTHLY)
                    );
                }
            }
        } catch (\Exception $e) {
            $this->error('Failed to fetch blog posts for sitemap: '.$e->getMessage());
        }

        $sitemap->writeToFile($path);

        $this->info('Sitemap generated successfully!');

        return self::SUCCESS;
    }
}
