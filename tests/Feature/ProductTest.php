<?php

namespace Tests\Feature;

use App\Exports\ProductsExport;
use App\Models\Product;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProductTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_product_with_quantity_and_status(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/products', [
            'name' => 'Smartphone',
            'description' => 'A smartphone',
            'price' => 199.00,
            'quantity' => 5,
            'status' => 'active',
            'image' => UploadedFile::fake()->image('phone.jpg'),
            'tag' => ['Electronics'],
        ]);

        $response->assertRedirect(route('products.index'));

        $this->assertDatabaseHas('products', [
            'name' => 'Smartphone',
            'quantity' => 5,
            'status' => 'active',
        ]);
    }

    public function test_quantity_and_status_are_validated(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/products', [
            'name' => 'Invalid Product',
            'description' => 'Invalid',
            'price' => 10.00,
            'quantity' => -1,
            'status' => 'unknown',
            'image' => UploadedFile::fake()->image('invalid.jpg'),
        ]);

        $response->assertSessionHasErrors(['quantity', 'status']);
    }

    public function test_product_index_applies_price_filters(): void
    {
        $this->withoutVite();

        $user = User::factory()->create();

        Product::factory()->create(['name' => 'Cheap Product', 'price' => 10.00]);
        Product::factory()->create(['name' => 'Expensive Product', 'price' => 100.00]);

        $response = $this->actingAs($user)->get('/products?min_price=50');

        $response->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('products/index')
            ->has('products.data', 1)
            ->where('products.data.0.name', 'Expensive Product'));
    }

    public function test_unknown_sort_columns_and_directions_are_ignored(): void
    {
        $this->withoutVite();

        $user = User::factory()->create();
        Product::factory()->count(2)->create();

        $response = $this->actingAs($user)->get('/products?sort=price;drop%20table&direction=sideways');

        $response->assertOk();
    }

    public function test_export_includes_quantity_status_value_and_tags(): void
    {
        $product = Product::factory()->create([
            'name' => 'Exported Product',
            'price' => 199.00,
            'quantity' => 5,
            'status' => 'active',
        ]);

        $tag = Tag::firstOrCreate(['tag' => 'Smartphones']);
        $product->tags()->sync([$tag->id]);

        $row = (new ProductsExport)->map($product->fresh('tags'));

        $this->assertSame(5, $row[4]);
        $this->assertSame(995.0, $row[5]);
        $this->assertSame('active', $row[6]);
        $this->assertSame('Smartphones', $row[8]);
    }

    public function test_products_can_be_imported_with_quantity_status_and_tags(): void
    {
        $user = User::factory()->create();

        $csv = implode("\n", [
            'name,description,price,quantity,status,tags',
            'Imported Product,From CSV,25.50,7,draft,"Imported, Wholesale"',
        ]);

        $file = UploadedFile::fake()->createWithContent('products.csv', $csv);

        $response = $this->actingAs($user)->post('/products/import', ['file' => $file]);

        $response->assertOk()->assertJson(['success' => true]);

        $product = Product::where('name', 'Imported Product')->firstOrFail();

        $this->assertSame(7, $product->quantity);
        $this->assertSame('draft', $product->status);
        $this->assertEqualsCanonicalizing(
            ['Imported', 'Wholesale'],
            $product->tags->pluck('tag')->all()
        );
    }

    public function test_authenticated_user_can_update_quantity_and_status(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create([
            'quantity' => 1,
            'status' => 'draft',
        ]);

        $response = $this->actingAs($user)->put("/products/{$product->id}", [
            'name' => $product->name,
            'description' => $product->description,
            'price' => $product->price,
            'quantity' => 12,
            'status' => 'active',
        ]);

        $response->assertRedirect(route('products.index'));

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'quantity' => 12,
            'status' => 'active',
        ]);
    }
}
