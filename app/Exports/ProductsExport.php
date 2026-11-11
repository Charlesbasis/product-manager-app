<?php

namespace App\Exports;

use App\Models\Product;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ProductsExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithStyles
{
    private const SORTABLE_COLUMNS = [
        'name',
        'description',
        'price',
        'quantity',
        'status',
        'created_at',
    ];

    protected $filters;

    public function __construct(array $filters = [])
    {
        $this->filters = $filters;
    }

    public function collection()
    {
        $query = Product::query()->with('tags');

        // Apply filters (same as the index page). The search clause is grouped
        // so it cannot bypass the price filters.
        if (! empty($this->filters['search'])) {
            $search = $this->filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('description', 'like', '%'.$search.'%');
            });
        }

        if (! empty($this->filters['min_price'])) {
            $query->where('price', '>=', $this->filters['min_price']);
        }

        if (! empty($this->filters['max_price'])) {
            $query->where('price', '<=', $this->filters['max_price']);
        }

        if (! empty($this->filters['sort'])) {
            $sort = in_array($this->filters['sort'], self::SORTABLE_COLUMNS, true)
                ? $this->filters['sort']
                : 'created_at';
            $direction = ($this->filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

            $query->orderBy($sort, $direction);
        } else {
            $query->latest();
        }

        return $query->get();
    }

    public function headings(): array
    {
        return [
            'ID',
            'Name',
            'Description',
            'Price',
            'Quantity',
            'Inventory Value',
            'Status',
            'Image URL',
            'Tags',
            'Created At',
            'Updated At',
        ];
    }

    public function map($product): array
    {
        return [
            $product->id,
            $product->name,
            $product->description,
            $product->price,
            $product->quantity,
            round((float) $product->price * (int) $product->quantity, 2),
            $product->status,
            $product->image_url,
            $product->tags->pluck('tag')->implode(', '),
            $product->created_at->format('Y-m-d H:i:s'),
            $product->updated_at->format('Y-m-d H:i:s'),
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Style the first row as bold text
            1 => ['font' => ['bold' => true]],
        ];
    }
}
