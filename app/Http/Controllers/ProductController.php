<?php

namespace App\Http\Controllers;

use App\Exports\ProductsExport;
use App\Http\Requests\ProductFormRequest;
use App\Imports\ProductsImport;
use App\Models\Product;
use App\Models\Tag;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class ProductController extends Controller
{
    // Cache duration in seconds
    private const CACHE_TTL = 300; // 5 Minutes

    // Only these columns may be used in an ORDER BY clause.
    private const SORTABLE_COLUMNS = [
        'name',
        'description',
        'price',
        'quantity',
        'status',
        'created_at',
    ];

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Bump the version suffix whenever the cached payload shape changes so
        // old entries cannot leak stale fields into the UI.
        $cacheKey = 'products_index_v2_' . md5(json_encode($request->all()));

        $sort = $this->sanitizeSort($request->sort);
        $direction = $this->sanitizeDirection($request->direction);

        $products = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($request, $sort, $direction) {
            return Product::with('tags')
                ->when($request->search, function ($query) use ($request) {
                    $search = $request->search;

                    $query->where(function ($query) use ($search) {
                        $query->where('name', 'like', "%{$search}%")
                            ->orWhere('description', 'like', "%{$search}%");
                    });
                })
                ->when($request->filled('min_price'), fn($query) => $query->where('price', '>=', $request->min_price))
                ->when($request->filled('max_price'), fn($query) => $query->where('price', '<=', $request->max_price))
                ->orderBy($sort, $direction)
                ->paginate($request->per_page ?? 10)
                ->withQueryString();
        });

        $products->getCollection()->transform(fn($product) => [
            'id' => $product->id,
            'name' => $product->name,
            'description' => $product->description,
            'price' => $product->price,
            'quantity' => (int) $product->quantity,
            'status' => $product->status,
            'total_value' => round((float) $product->price * (int) $product->quantity, 2),
            'created_at' => $product->created_at->format('d M Y'),
            'image' => $product->image_url,
            'tag' => implode(', ', $product->tags->pluck('tag')->toArray()),
        ]);

        return Inertia::render('products/index', [
            'products' => $products,
            'filters' => $request->only(['search', 'sort', 'direction', 'min_price', 'max_price', 'per_page']),
            'perPageOptions' => [2, 5, 10, 25, 50, 100],
            'currentPerPage' => $this->getValidPerPage($request),
        ]);
    }

    /**
     * Get paginated products based on request
     */
    private function getPaginatedProducts(Request $request)
    {
        $perPage = $this->getValidPerPage($request);

        $productsQuery = Product::with('tags');

        // Apply filters
        $this->applyFilters($productsQuery, $request);

        return $productsQuery->paginate($perPage)->withQueryString();
    }

    /**
     * Apply filters to query
     */
    private function applyFilters($query, Request $request)
    {
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(
                fn($q) =>
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('price', 'like', "%{$search}%")
            );
        }

        if ($request->filled('sort')) {
            $query->orderBy(
                $this->sanitizeSort($request->sort),
                $this->sanitizeDirection($request->direction)
            );
        } else {
            $query->latest();
        }

        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }

        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }
    }

    /**
     * Get valid per page value
     */
    private function getValidPerPage(Request $request): int
    {
        $availablePerPage = [2, 5, 10, 25, 50, 100];
        $perPage = $request->filled('per_page') ? (int) $request->input('per_page') : 2;

        return in_array($perPage, $availablePerPage) ? $perPage : 2;
    }

    /**
     * Keep user-supplied sort columns inside a known-safe whitelist.
     */
    private function sanitizeSort(?string $sort): string
    {
        return in_array($sort, self::SORTABLE_COLUMNS, true) ? $sort : 'created_at';
    }

    /**
     * Normalise the sort direction to a value Eloquent accepts.
     */
    private function sanitizeDirection(?string $direction): string
    {
        return $direction === 'asc' ? 'asc' : 'desc';
    }

    /**
     * Generate cache key based on request
     */
    private function getCacheKey(Request $request): string
    {
        // Exclude page parameter from cache key to cache all pages
        $cacheParams = $request->except('page');
        ksort($cacheParams); // Sort for consistent keys

        return 'products:' . md5(json_encode($cacheParams));
    }

    /**
     * Check if request is from a search engine bot
     */
    private function isSearchEngineBot(Request $request): bool
    {
        $userAgent = $request->header('User-Agent');

        if (!$userAgent) {
            return false;
        }

        $bots = [
            'googlebot',
            'bingbot',
            'slurp',
            'duckduckbot',
            'baiduspider',
            'yandexbot',
            'sogou',
            'exabot',
            'facebot',
            'ia_archiver',
            'facebookexternalhit',
            'twitterbot',
            'rogerbot',
            'linkedinbot',
            'embedly',
            'quora link preview',
            'showyoubot',
            'outbrain',
            'pinterest/0.',
            'developers.google.com/+/web/snippet',
            'whatsapp',
            'slackbot',
            'discordbot'
        ];

        foreach ($bots as $bot) {
            if (stripos($userAgent, $bot) !== false) {
                return true;
            }
        }

        return false;
    }

    /**
     * Set proper cache headers
     */
    private function setCacheHeaders(bool $isBot): void
    {
        if (!headers_sent()) {
            if ($isBot) {
                // Tell bots they can cache but not for long
                header('Cache-Control: public, max-age=60, s-maxage=60');
                header('Vary: User-Agent');
            } else {
                // Longer cache for regular users
                header('Cache-Control: public, max-age=300, s-maxage=300');
                header('Vary: User-Agent, X-Requested-With');
            }
        }
    }

    /**
     * Clear cache when products change
     */
    private function clearProductsCache(): void
    {
        // Pattern-based clearing for Redis/Memcached
        if (config('cache.default') === 'redis' || config('cache.default') === 'memcached') {
            // Using cache tags if supported
            Cache::tags(['products'])->flush();
        } else {
            // For file/database cache, clear all product-related cache
            // Note: This is less efficient but works for all drivers
            Cache::flush(); // Be careful - this clears ALL cache

            // OR implement a more targeted approach
            // $this->clearSpecificProductCache();
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // dd("create");
        $allTags = Tag::all()->pluck('tag')->toArray();

        return Inertia::render('products/product-form', [
            'allTags' => $allTags,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     * @param ProductFormRequest $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(ProductFormRequest $request)
    {
        // dd($request->all());
        try {
            $image = null;
            $imageOriginalName = null;

            if ($request->file('image')) {
                $image = $request->file('image');
                $imageOriginalName = $image->getClientOriginalName();
                $image = $image->store('products', 'public');
            }

            $product = Product::create([
                'name' => $request->name,
                'description' => $request->description,
                'image' => $image,
                'image_original_name' => $imageOriginalName,
                'price' => $request->price,
                'quantity' => $request->quantity,
                'status' => $request->status,
            ]);

            if ($request->has('tag')) {
                $this->syncTags($product, $request->tag);
            }

            $this->clearAllProductCache();

            if ($product) {
                return redirect()->route('products.index')->with('success', 'Product created successfully.');
            }

            return redirect()->back()->with('error', 'Failed to create product. Please try again.');
        } catch (Exception $e) {
            Log::error('Error creating product: ' . $e->getMessage());

            return redirect()->back()->withInput()->with('error', 'Failed to create product. Please try again.');
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Product $product)
    {
        $product->load('tags');

        $formattedProduct = [
            'id' => $product->id,
            'name' => $product->name,
            'description' => $product->description,
            'price' => $product->price,
            'quantity' => (int) $product->quantity,
            'status' => $product->status,
            'created_at' => $product->created_at->format('d M Y'),
            'image' => $product->image_url,
            'tag' => $product->tags->pluck('tag')->toArray(),
            'slug' => $product->slug,
        ];

        return Inertia::render('products/product-form', [
            'product' => $formattedProduct,
            'isView' => true,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Product $product)
    {
        $product->load('tags');

        $allTags = Tag::all()->pluck('tag')->toArray();

        $formattedProduct = [
            'id' => $product->id,
            'name' => $product->name,
            'description' => $product->description,
            'price' => $product->price,
            'quantity' => (int) $product->quantity,
            'status' => $product->status,
            'created_at' => $product->created_at->format('d M Y'),
            'image' => $product->image_url,
            'tag' => $product->tags->pluck('tag')->toArray(),
        ];

        return Inertia::render('products/product-form', [
            'product' => $formattedProduct,
            'isEdit' => true,
            'allTags' => $allTags,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(ProductFormRequest $request, Product $product)
    {
        // Log::debug('Processing update with data:', $request->all());
        if ($product) {
            $product->name = $request->name;
            $product->description = $request->description;
            $product->price = $request->price;
            $product->quantity = $request->quantity;
            $product->status = $request->status;

            if ($request->file('image')) {

                if ($product->image) {
                    Storage::disk('public')->delete($product->image);
                }

                $image = $request->file('image');
                $imageOriginalName = $image->getClientOriginalName();
                $imagePath = $image->store('products', 'public');
                $product->image = $imagePath;
            }

            $product->save();

            if ($request->has('tag')) {
                $this->syncTags($product, $request->tag);
            }

            $this->clearAllProductCache();

            return redirect()->route('products.index')->with('success', 'Product updated successfully.');
        }

        return redirect()->back()->with('error', 'Failed to update product. Please try again.');
    }

    private function syncTags(Product $product, $tagsInput)
    {
        // Log::debug("syncTags called with input:", ['input' => $tagsInput]);
        if (is_array($tagsInput)) {
            $tagNames = $tagsInput;
        } else {
            $tagNames = array_filter(array_map('trim', explode(',', $tagsInput)));
        }

        $tagIds = [];
        foreach ($tagNames as $tagName) {
            $tagName = trim($tagName);
            if (!empty($tagName)) {
                $tag = Tag::firstOrCreate(['tag' => $tagName]);
                $tagIds[] = $tag->id;
            }
        }

        $product->tags()->sync($tagIds);
        // ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product)
    {
        // dd("destroy");
        if ($product) {
            $product->delete();

            $this->clearAllProductCache();
            
            return redirect()->route('products.index')->with('success', 'Product deleted successfully.');
        }

        return redirect()->back()->with('error', 'Failed to delete product. Please try again.');
    }

    /**
     * Export products
     */
    public function export(Request $request)
    {
        $filters = $request->only(['search', 'min_price', 'max_price']);

        if ($request->filled('sort')) {
            $filters['sort'] = $this->sanitizeSort($request->sort);
            $filters['direction'] = $this->sanitizeDirection($request->direction);
        }

        $fileName = 'products_' . date('Y-m-d_H-i-s') . '.xlsx';

        return Excel::download(new ProductsExport($filters), $fileName);
    }

    /**
     * Import products
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:5120',
        ]);

        try {
            $import = new ProductsImport();
            Excel::import($import, $request->file('file'));

            return response()->json([
                'success' => true,
                'message' => "Products imported successfully.",
            ]);
        } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
            $failures = $e->failures();

            $errors = [];
            foreach ($failures as $failure) {
                $errors[] = [
                    'row' => $failure->row(),
                    'attribute' => $failure->attribute(),
                    'errors' => $failure->errors(),
                    'values' => $failure->values(),
                ];
            }

            return response()->json([
                'success' => false,
                'message' => 'Import failed due to validation errors',
                'errors' => $errors,
            ], 422);
        } catch (\Exception $e) {
            Log::error('Import error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Import failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display dashboard statistics
     */
    public function dashboardStats(Request $request)
    {
        $cacheKey = 'dashboard_stats_v2_' . (auth()->id() ?? 'guest');

        // This prevents the VPS from running 10+ aggregation queries on every dashboard visit
        return Cache::remember($cacheKey, self::CACHE_TTL, function () {
            return $this->calculateDashboardStats();
        });
    }

    /**
     * Calculate comprehensive dashboard statistics
     */
    private function calculateDashboardStats(): array
    {
        // 1. Current catalog metrics (1 query)
        $metrics = Product::selectRaw('
            COUNT(*) as total,
            COALESCE(SUM(quantity), 0) as total_units,
            COALESCE(SUM(price * quantity), 0) as value,
            COALESCE(AVG(price), 0) as avg,
            COALESCE(MIN(price), 0) as min,
            COALESCE(MAX(price), 0) as max
        ')->first();

        // 2. Baseline catalog metrics reconstructed from created_at.
        // Products created before 30 days ago represent the catalog at the
        // start of the comparison window.
        $baseline = Product::where('created_at', '<', now()->subDays(30))
            ->selectRaw('
                COUNT(*) as count,
                COALESCE(SUM(price * quantity), 0) as value,
                COALESCE(AVG(price), 0) as avg
            ')
            ->first();

        $todayProducts = Product::whereDate('created_at', today())->count();
        $yesterdayProducts = Product::whereDate('created_at', today()->subDay())->count();
        $lastSevenDaysProducts = Product::where('created_at', '>=', now()->subDays(7))->count();

        $statusSummary = Product::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $recentProducts = Product::with('tags')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn(Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'price' => (float) $product->price,
                'quantity' => (int) $product->quantity,
                'status' => $product->status,
                'tag' => $product->tags->first()->tag ?? 'Uncategorized',
                'created_at' => $product->created_at->diffForHumans(),
            ])
            ->values();

        return [
            'basic_stats' => [
                'total_products' => (int) $metrics->total,
                'total_units' => (int) $metrics->total_units,
                'total_value' => (float) $metrics->value,
                'avg_price' => (float) $metrics->avg,
                'min_price' => (float) $metrics->min,
                'max_price' => (float) $metrics->max,
            ],
            'growth_stats' => [
                'products' => $this->calculateGrowthPercentage($baseline->count, $metrics->total),
                'value' => $this->calculateGrowthPercentage($baseline->value, $metrics->value),
                'avg_price' => $this->calculateGrowthPercentage($baseline->avg, $metrics->avg),
                'today_activity' => $this->calculateGrowthPercentage($yesterdayProducts, $todayProducts),
                'last_7_days_products' => (int) $lastSevenDaysProducts,
                'today_products' => (int) $todayProducts,
                'yesterday_products' => (int) $yesterdayProducts,
            ],
            'status_summary' => [
                'active' => (int) ($statusSummary['active'] ?? 0),
                'draft' => (int) ($statusSummary['draft'] ?? 0),
                'archived' => (int) ($statusSummary['archived'] ?? 0),
                'total' => (int) $metrics->total,
            ],
            'category_distribution' => [],
            'price_distribution' => $this->getPriceDistribution(),
            'recent_products' => $recentProducts,
            'timestamps' => [
                'calculated_at' => now()->toISOString(),
                'cache_expires' => now()->addSeconds(self::CACHE_TTL)->toISOString(),
            ],
        ];
    }

    /**
     * Calculate growth percentage.
     *
     * Returns null when there is no baseline, because percentage change from
     * zero is undefined. The frontend renders "No prior data" in that case.
     */
    private function calculateGrowthPercentage($previous, $current): ?float
    {
        $prev = (float) ($previous ?? 0);
        $curr = (float) ($current ?? 0);

        if ($prev <= 0) {
            return null;
        }

        return round((($curr - $prev) / $prev) * 100, 2);
    }

    /**
     * Get price distribution in buckets
     */
    private function getPriceDistribution(): array
    {
        $buckets = [
            ['label' => 'Under $10', 'min' => 0, 'max' => 10],
            ['label' => '$10 - $50', 'min' => 10, 'max' => 50],
            ['label' => '$50 - $100', 'min' => 50, 'max' => 100],
            ['label' => '$100 - $500', 'min' => 100, 'max' => 500],
            ['label' => '$500 - $1000', 'min' => 500, 'max' => 1000],
            ['label' => 'Over $1000', 'min' => 1000, 'max' => null],
        ];

        $distribution = [];
        // VPS Optimization: Get total count once outside the loop
        $totalProducts = Product::count();

        foreach ($buckets as $bucket) {
            $count = Product::query()
                ->when($bucket['min'] !== null, fn($q) => $q->where('price', '>=', $bucket['min']))
                ->when($bucket['max'] !== null, fn($q) => $q->where('price', '<', $bucket['max']))
                ->count();

            $distribution[] = [
                'label' => $bucket['label'],
                'count' => (int) $count,
                'percentage' => $totalProducts > 0 ? round(($count / $totalProducts) * 100, 1) : 0,
                'min' => $bucket['min'],
                'max' => $bucket['max'],
            ];
        }

        return $distribution;
    }

    /**
     * Get activity log for dashboard
     */
    public function getActivityLog(Request $request)
    {
        $limit = $request->get('limit', 10);

        // Get recent product activities
        $activities = Product::with('tags')
            ->latest()
            ->limit($limit)
            ->get()
            ->map(function ($product) {
                $hoursAgo = $product->created_at->diffInHours(now());
                $action = $hoursAgo < 24 ? 'CREATE' : 'UPDATE';

                return [
                    'id' => $product->id,
                    'action' => $action,
                    'description' => "Product: {$product->name}",
                    'timestamp' => $product->created_at->diffForHumans(),
                    'user' => 'System',
                    'price' => $product->price,
                    'quantity' => (int) $product->quantity,
                    'status' => $product->status,
                    'category' => $product->tags->first()->tag ?? 'Uncategorized',
                    'product_id' => $product->id,
                    'created_at' => $product->created_at->toISOString(),
                ];
            });

        return response()->json([
            'activities' => $activities,
            'total' => $activities->count(),
            'limit' => $limit,
            'fetched_at' => now()->toISOString(),
        ]);
    }

    private function clearAllProductCache(): void
    {
        // On a Shared VPS, we use a simple flush to guarantee no stale SEO data.
        // If you use Redis, you can use Cache::tags(['products'])->flush();
        Cache::flush(); 
    }

}
