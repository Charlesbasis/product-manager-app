<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(3, true),
            'description' => fake()->sentence(),
            'image' => null,
            'price' => fake()->randomFloat(2, 1, 1000),
            'quantity' => fake()->numberBetween(0, 100),
            'status' => fake()->randomElement(['active', 'draft', 'archived']),
        ];
    }
}
