<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class DashboardStatsTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_inventory_value_is_quantity_weighted(): void
    {
        Carbon::setTestNow('2026-11-09 12:00:00');

        $user = User::factory()->create();

        Product::factory()->create([
            'price' => 199.00,
            'quantity' => 5,
            'status' => 'active',
            'created_at' => now()->subDays(2),
        ]);

        $response = $this->actingAs($user)->getJson('/api/dashboard/stats');

        $response->assertOk()
            ->assertJsonPath('basic_stats.total_products', 1)
            ->assertJsonPath('basic_stats.total_units', 5)
            ->assertJsonPath('basic_stats.total_value', 995)
            ->assertJsonPath('basic_stats.avg_price', 199)
            ->assertJsonPath('status_summary.active', 1);
    }

    public function test_monthly_growth_uses_products_before_thirty_days_as_baseline(): void
    {
        Carbon::setTestNow('2026-11-09 12:00:00');

        $user = User::factory()->create();

        Product::factory()->create([
            'price' => 100.00,
            'quantity' => 2,
            'created_at' => now()->subDays(40),
        ]);

        Product::factory()->create([
            'price' => 50.00,
            'quantity' => 3,
            'created_at' => now()->subDays(5),
        ]);

        $response = $this->actingAs($user)->getJson('/api/dashboard/stats');

        // Products: 2 current vs 1 baseline -> +100%.
        // Value: 350 current vs 200 baseline -> +75%.
        // Avg price: 75 current vs 100 baseline -> -25%.
        $response->assertOk()
            ->assertJsonPath('growth_stats.products', 100)
            ->assertJsonPath('growth_stats.value', 75)
            ->assertJsonPath('growth_stats.avg_price', -25);
    }

    public function test_growth_is_null_when_there_is_no_baseline(): void
    {
        Carbon::setTestNow('2026-11-09 12:00:00');

        $user = User::factory()->create();

        Product::factory()->create([
            'created_at' => now()->subDay(),
        ]);

        $response = $this->actingAs($user)->getJson('/api/dashboard/stats');

        $response->assertOk()
            ->assertJsonPath('growth_stats.products', null)
            ->assertJsonPath('growth_stats.value', null)
            ->assertJsonPath('growth_stats.avg_price', null)
            ->assertJsonPath('growth_stats.today_activity', -100);
    }

    public function test_today_activity_compares_today_with_yesterday(): void
    {
        Carbon::setTestNow('2026-11-09 12:00:00');

        $user = User::factory()->create();

        Product::factory()->create(['created_at' => now()->subDay()]);
        Product::factory()->count(2)->create(['created_at' => now()]);

        $response = $this->actingAs($user)->getJson('/api/dashboard/stats');

        $response->assertOk()
            ->assertJsonPath('growth_stats.today_products', 2)
            ->assertJsonPath('growth_stats.yesterday_products', 1)
            ->assertJsonPath('growth_stats.today_activity', 100)
            ->assertJsonPath('growth_stats.last_7_days_products', 3);
    }

    public function test_recent_products_include_quantity_status_and_tag(): void
    {
        Carbon::setTestNow('2026-11-09 12:00:00');

        $user = User::factory()->create();

        $product = Product::factory()->create([
            'price' => 199.00,
            'quantity' => 5,
            'status' => 'active',
        ]);

        $tag = Tag::firstOrCreate(['tag' => 'Smartphones']);
        $product->tags()->sync([$tag->id]);

        $response = $this->actingAs($user)->getJson('/api/dashboard/stats');

        $response->assertOk()
            ->assertJsonPath('recent_products.0.quantity', 5)
            ->assertJsonPath('recent_products.0.status', 'active')
            ->assertJsonPath('recent_products.0.tag', 'Smartphones');
    }

    public function test_status_summary_counts_each_status(): void
    {
        Carbon::setTestNow('2026-11-09 12:00:00');

        $user = User::factory()->create();

        Product::factory()->create(['status' => 'active']);
        Product::factory()->create(['status' => 'draft']);
        Product::factory()->create(['status' => 'archived']);

        $response = $this->actingAs($user)->getJson('/api/dashboard/stats');

        $response->assertOk()
            ->assertJsonPath('status_summary.active', 1)
            ->assertJsonPath('status_summary.draft', 1)
            ->assertJsonPath('status_summary.archived', 1)
            ->assertJsonPath('status_summary.total', 3);
    }
}
