import {
    create as productsCreate,
    destroy as productsDestroy,
    edit as productsEdit,
    index as productsIndex,
    show as productsShow,
} from '@/actions/App/Http/Controllers/ProductController';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ExportImportButtons } from '@/components/ui/export-import-buttons';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { PriceFilter } from '@/components/ui/price-filter';
import { SortableHeader } from '@/components/ui/sortable-header';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, IndexProps, SortField, SortProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Eye, MoreHorizontal, Pencil, Trash, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Manage Products',
        href: productsIndex().url,
    },
];

export default function Index() {
    const { props } = usePage<IndexProps & Record<string, unknown>>();
    // console.log('📦 FULL Inertia Response:', {
    //     props: JSON.parse(JSON.stringify(props)),
    //     keys: Object.keys(props),
    //     hasCurrentPerPage: 'currentPerPage' in props,
    //     currentPerPageValue: props.currentPerPage,
    //     filtersValue: props.filters,
    //     productsPerPage: props.products?.per_page
    // });

    const { products, filters, perPageOptions } = props;

    const currentPerPage = products?.per_page || 2;

    const [localSearch, setLocalSearch] = useState(filters.search || '');
    const [localMinPrice, setLocalMinPrice] = useState(filters.min_price || '');
    const [localMaxPrice, setLocalMaxPrice] = useState(filters.max_price || '');

    const [sortConfig, setSortConfig] = useState<SortProps>({
        field: filters.sort as SortField,
        direction: filters.direction as SortProps['direction'],
    });

    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // console.log('sending params:', {
    //     search: localSearch,
    //     min_price: localMinPrice,
    //     max_price: localMaxPrice,
    //     sort: sortConfig.field,
    //     direction: sortConfig.direction,
    //     per_page: currentPerPage,
    // });
    const fetchData = useCallback(
        (
            overrideParams: Partial<{
                search: string;
                min_price: string;
                max_price: string;
                sort: SortField;
                direction: 'asc' | 'desc';
                per_page: number;
            }> = {},
        ) => {
            const params: Record<string, string | number | undefined> = {
                search: localSearch,
                min_price: localMinPrice,
                max_price: localMaxPrice,
                sort: sortConfig.field,
                direction: sortConfig.direction,
                per_page: products?.per_page || 2,
                ...overrideParams,
            };

            const queryParams = Object.fromEntries(
                Object.entries(params).filter(
                    ([, param]) =>
                        param !== '' && param !== undefined && param !== null,
                ),
            );

            router.get(productsIndex().url, queryParams, {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            });
        },
        [
            localSearch,
            localMinPrice,
            localMaxPrice,
            sortConfig,
            products?.per_page,
        ],
    );

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setLocalSearch(value);

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        // searchTimeoutRef.current = setTimeout(() => {
        fetchData({ search: value });
        // }, 500);
    };

    const handlePriceChange = (min: string, max: string) => {
        setLocalMinPrice(min);
        setLocalMaxPrice(max);
        fetchData({ min_price: min, max_price: max });
    };

    const handleSort = (field: SortField) => {
        let newDirection: SortProps['direction'] = 'asc';
        if (sortConfig.field === field) {
            newDirection = sortConfig.direction === 'asc' ? 'desc' : 'asc';
        }

        const newSort = { field, direction: newDirection };
        setSortConfig(newSort);

        fetchData({ sort: field, direction: newDirection });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (searchTimeoutRef.current)
                clearTimeout(searchTimeoutRef.current);
            fetchData();
        }
    };

    const handleResetFilters = () => {
        setLocalSearch('');
        setLocalMinPrice('');
        setLocalMaxPrice('');
        setSortConfig({ field: 'created_at', direction: 'desc' });

        router.get(
            productsIndex().url,
            { per_page: currentPerPage },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head>
                <title>Manage Products | Nexus Inventory</title>
                <meta
                    name="description"
                    content="Manage products, pricing, tags, and inventory in the admin dashboard."
                />
            </Head>
            <h1 className="sr-only">Manage Products</h1>

            <div className="rounded-lg-xl flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                {/* Filters Toolbar */}
                <div className="mb-4 flex w-full flex-wrap items-center gap-4">
                    <Input
                        onChange={handleSearchChange}
                        onKeyDown={handleKeyDown}
                        value={localSearch}
                        type="text"
                        placeholder="Search Product ..."
                        name="search"
                        className="w-full md:w-1/3"
                    />
                    <PriceFilter
                        min_price={localMinPrice}
                        max_price={localMaxPrice}
                        onPriceChange={handlePriceChange}
                    />

                    {(localSearch || localMinPrice || localMaxPrice) && (
                        <Button
                            variant="destructive"
                            className="cursor-pointer"
                            onClick={handleResetFilters}
                        >
                            <X size={16} className="mr-2" /> Reset
                        </Button>
                    )}

                    <div className="ml-auto">
                        <Link
                            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 font-bold text-white transition-colors hover:bg-blue-700"
                            href={productsCreate().url}
                        >
                            Add Product
                        </Link>
                    </div>
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <ExportImportButtons filters={filters} />
                </div>

                {/* Table */}
                <div className="rounded-md border">
                    <table className="w-full table-auto">
                        <thead className="bg-gray-100 dark:bg-gray-800">
                            <caption className="sr-only">
                                List of products with price, quantity, status,
                                image, tags, and creation date
                            </caption>
                            <tr className="text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                                <th className="border-b p-4">#</th>
                                <SortableHeader
                                    field="name"
                                    currentSort={sortConfig}
                                    onSort={handleSort}
                                    className="border-b p-4"
                                >
                                    Name
                                </SortableHeader>
                                <SortableHeader
                                    field="description"
                                    currentSort={sortConfig}
                                    onSort={handleSort}
                                    className="border-b p-4"
                                >
                                    Description
                                </SortableHeader>
                                <SortableHeader
                                    field="price"
                                    currentSort={sortConfig}
                                    onSort={handleSort}
                                    className="border-b p-4"
                                >
                                    Price
                                </SortableHeader>
                                <SortableHeader
                                    field="quantity"
                                    currentSort={sortConfig}
                                    onSort={handleSort}
                                    className="border-b p-4"
                                >
                                    Quantity
                                </SortableHeader>
                                <th className="border-b p-4">Image</th>
                                <SortableHeader
                                    field="created_at"
                                    currentSort={sortConfig}
                                    onSort={handleSort}
                                    className="border-b p-4"
                                >
                                    Created Date
                                </SortableHeader>
                                <th className="border-b p-4">Status</th>
                                <th className="border-b p-4">Tags</th>
                                <th className="border-b p-4 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {products?.data?.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={10}
                                        className="p-8 text-center text-gray-500"
                                    >
                                        No products found.
                                    </td>
                                </tr>
                            ) : (
                                products?.data?.map((product, index) => (
                                    <tr
                                        key={product.id}
                                        className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-900"
                                    >
                                        <td className="border-b px-4 py-2">
                                            {(products.from ?? 1) + index}
                                        </td>
                                        <td className="border-b px-4 py-2 font-medium">
                                            {product.name}
                                        </td>
                                        <td className="max-w-xs truncate border-b px-4 py-2 text-gray-500">
                                            {product.description}
                                        </td>
                                        <td className="border-b px-4 py-2">
                                            ${product.price}
                                        </td>
                                        <td className="border-b px-4 py-2">
                                            {product.quantity}
                                        </td>
                                        <td className="border-b px-4 py-2">
                                            {product?.image ? (
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="rounded object-cover"
                                                    width={100}
                                                    height={100}
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-200 text-xs">
                                                    No Img
                                                </div>
                                            )}
                                        </td>
                                        <td className="border-b px-4 py-2 text-sm">
                                            {product.created_at}
                                        </td>
                                        <td className="border-b px-4 py-2 text-sm">
                                            <StatusBadge
                                                status={product.status}
                                            />
                                        </td>
                                        <td className="border-b px-4 py-2 text-sm">
                                            {product.tag}
                                        </td>

                                        <td className="border-b px-4 py-2 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className="h-8 w-8 cursor-pointer p-0"
                                                    >
                                                        <span className="sr-only">
                                                            Open menu
                                                        </span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="w-48"
                                                >
                                                    <DropdownMenuItem asChild>
                                                        <Link
                                                            href={
                                                                productsShow(
                                                                    product.id,
                                                                ).url
                                                            }
                                                            className="flex w-full cursor-pointer items-center"
                                                        >
                                                            <Eye className="mr-2 h-4 w-4" />{' '}
                                                            View Details
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link
                                                            href={
                                                                productsEdit(
                                                                    product.id,
                                                                ).url
                                                            }
                                                            className="flex w-full cursor-pointer items-center"
                                                        >
                                                            <Pencil className="mr-2 h-4 w-4" />{' '}
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="cursor-pointer text-red-600 focus:text-red-600"
                                                        onClick={() => {
                                                            if (
                                                                confirm(
                                                                    'Are you sure you want to delete this product?',
                                                                )
                                                            ) {
                                                                router.delete(
                                                                    productsDestroy(
                                                                        product.id,
                                                                    ).url,
                                                                    {
                                                                        preserveScroll: true,
                                                                    },
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        <Trash className="mr-2 h-4 w-4" />{' '}
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination
                    products={products}
                    perPageOptions={perPageOptions}
                />
            </div>
        </AppLayout>
    );
}
