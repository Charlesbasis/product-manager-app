<?php

namespace App\Http\Requests;

use App\Models\Product;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ProductFormRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        if ($this->route('product')) {
            // Update request
            return $this->user()->can('update', $this->route('product'));
        } else {
            // Create request
            return $this->user()->can('create', Product::class);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'image' => $this->isMethod('POST')
                ? 'required|image|mimes:jpg,png,jpeg,svg|max:2048'
                : 'nullable|image|mimes:jpg,png,jpeg,svg|max:2048',
            'price' => 'required|numeric|min:0',
            'quantity' => 'required|integer|min:0|max:1000000',
            'status' => 'required|in:active,draft,archived',
            'tag' => 'nullable|array',
            'tag.*' => 'string|distinct|max:50',
        ];
    }

    /**
     * Get the validation messages that apply to the request.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Name is required',
            'name.string' => 'Name must be a string',
            'name.max' => 'Name must be at most 255 characters',
            'description.required' => 'Description is required',
            'description.string' => 'Description must be a string',
            'description.max' => 'Description must be at most 1000 characters',
            'image.image' => 'Image must be an image',
            'image.mimes' => 'Image must be a JPEG, PNG, JPG, or SVG file',
            'image.max' => 'Image must be at most 2048 kilobytes',
            'price.required' => 'Price is required',
            'price.numeric' => 'Price must be a number',
            'price.min' => 'Price must be at least 0',
            'quantity.required' => 'Quantity is required',
            'quantity.integer' => 'Quantity must be a whole number',
            'quantity.min' => 'Quantity must be at least 0',
            'quantity.max' => 'Quantity must be at most 1,000,000',
            'status.required' => 'Status is required',
            'status.in' => 'Status must be active, draft, or archived',
        ];
    }
}
