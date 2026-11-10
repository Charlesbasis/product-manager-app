<?php

namespace App\Imports;

use App\Models\Product;
use App\Models\Tag;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

class ProductsImport implements ToCollection, WithHeadingRow, WithValidation, WithChunkReading
{
    /**
     * @param  Collection<int, Collection<string, mixed>>  $rows
     */
    public function collection(Collection $rows): void
    {
        foreach ($rows as $row) {
            $imageUrl = $row['image_url'] ?? null;

            if ($imageUrl && !filter_var($imageUrl, FILTER_VALIDATE_URL)) {
                $imageUrl = ltrim($imageUrl, '/');
            }

            $product = Product::create([
                'name' => $row['name'],
                // The products table requires a description, but imports may
                // legitimately omit it.
                'description' => $row['description'] ?? '',
                'price' => $row['price'],
                'quantity' => $row['quantity'] ?? 1,
                'status' => $row['status'] ?? 'active',
                'image' => $imageUrl,
            ]);

            $this->syncTags($product, $row['tags'] ?? null);
        }
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'quantity' => 'nullable|integer|min:0',
            'status' => 'nullable|in:active,draft,archived',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string',
            'tags' => 'nullable|string',
        ];
    }

    public function customValidationMessages()
    {
        return [
            'name.required' => 'Product name is required',
            'price.required' => 'Product price is required',
            'price.numeric' => 'Price must be a number',
            'quantity.integer' => 'Quantity must be a whole number',
            'quantity.min' => 'Quantity must be at least 0',
            'status.in' => 'Status must be active, draft, or archived',
            'image_url.string' => 'Image URL must be a string',
        ];
    }

    public function chunkSize(): int
    {
        return 100;
    }

    private function syncTags(Product $product, ?string $tags): void
    {
        if (empty($tags)) {
            return;
        }

        $tagNames = array_filter(array_map('trim', explode(',', $tags)));

        $tagIds = [];
        foreach ($tagNames as $tagName) {
            if ($tagName !== '') {
                $tagIds[] = Tag::firstOrCreate(['tag' => $tagName])->id;
            }
        }

        $product->tags()->sync($tagIds);
    }
}
