import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface LinkProps {
    active: boolean;
    label: string;
    url: string | null;
}

export interface Product {
    id: number;
    name: string;
    description: string;
    image: string | null;
    price: number;
    quantity: number;
    status: 'active' | 'draft' | 'archived';
    total_value?: number;
    created_at: string;
    tag: string | string[];
    tagInput: string;
    slug: string;
}

export interface ProductPagination {
    data: Product[];
    links: LinkProps[];
    from: number;
    to: number;
    total: number;
    current_page: number;
    showPerPageInfo?: boolean;
    per_page: number;
}

export interface FilterProps {
    search?: string;
    sort?: string;
    direction?: string;
    min_price?: string;
    max_price?: string;
    per_page?: number;
}

export interface IndexProps {
    products: ProductPagination;
    filters: FilterProps;
    perPageOptions?: number[];
    currentPerPage?: number;
}

export interface PaginationData {
    links: LinkProps[];
    from: number;
    to: number;
    total: number;
    per_page: number;
    showPerPageInfo?: boolean;
    current_page: number;
}

type SortDirection = 'asc' | 'desc';
type SortField =
    | 'name'
    | 'description'
    | 'price'
    | 'quantity'
    | 'status'
    | 'created_at';

export interface SortProps {
    field: SortField;
    direction: SortDirection;
}

export interface PriceFilterProps {
    min_price?: string;
    max_price?: string;
    onPriceChange: (min_price: string, max_price: string) => void;
    className?: string;
}

export interface Tag {
    id: number;
    tag: string;
    slug?: string;
    count?: number;
}

export interface TagManagementProps {
    initialTags: string[];
    onTagsChange: (tags: string[]) => void;
    availableTags: string[];
    isViewMode?: boolean;
    isSubmitting?: boolean;
    maxTags?: number;
}

export interface TagComboboxProps {
    initialTags: string[];
    availableTags: string[];
    onTagsChange: (tags: string[]) => void;
    isViewMode?: boolean;
    isSubmitting?: boolean;
    maxTags?: number;
    errors?: string;
}

export interface TagState {
    tag: string[];
    inputValue: string;
    availableTags: string[];
    isDirty: boolean;
}

export interface TagBadgeProps {
    tag: string;
    onClick?: (tag: string) => void;
    onRemove?: (tag: string) => void;
    variant?: 'default' | 'selected' | 'available';
    disabled?: boolean;
}

export interface TagInputProps {
    onChange: (tag: string) => void;
    value: string;
    placeholder?: string;
    disabled?: boolean;
    maxTags?: number;
    onAddTag?: (tag: string[]) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    variant?: 'default' | 'selected' | 'available' | 'secondary';
}

export interface PerPageSelectorProps {
    currentPerPage: number;
    perPageOptions: number[];
    filters: FilterProps;
    route: string;
    className?: string;
}

export interface DashboardStatsResponse {
    basic_stats: {
        total_products: number;
        total_units: number;
        total_value: number;
        avg_price: number;
        min_price: number;
        max_price: number;
    };
    growth_stats: {
        products: number | null;
        value: number | null;
        avg_price: number | null;
        today_activity: number | null;
        last_7_days_products: number;
        today_products: number;
        yesterday_products: number;
    };
    category_distribution: Array<{
        name: string;
        count: number;
        percentage: number;
    }>;
    price_distribution: Array<{
        label: string;
        count: number;
        min: number | null;
        max: number | null;
    }>;
    recent_products: Array<{
        id: number;
        name: string;
        price: number;
        quantity: number;
        created_at: string;
        tag: string;
        status: 'active' | 'draft' | 'archived';
    }>;
    status_summary: {
        active: number;
        draft: number;
        archived: number;
        total: number;
    };
    timestamps: {
        calculated_at: string;
        cache_expires: string;
    };
}

export interface ActivityResponse {
    activities: Array<{
        id: number;
        action: string;
        description: string;
        timestamp: string;
        user: string;
        price?: number;
        quantity?: number;
        status?: 'active' | 'draft' | 'archived';
        category?: string;
    }>;
    total: number;
}

export interface DashboardStats {
    totalProducts: number;
    totalUnits: number;
    totalValue: number;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    recentActivity: number;
    todayProducts: number;
    yesterdayProducts: number;
    growth: {
        products: number | null;
        value: number | null;
        avgPrice: number | null;
        todayActivity: number | null;
    };
    statusSummary: {
        active: number;
        draft: number;
        archived: number;
        total: number;
    };
    categoryDistribution: Array<{
        name: string;
        count: number;
        percentage: number;
    }>;
    priceDistribution: Array<{
        label: string;
        count: number;
        min: number | null;
        max: number | null;
    }>;
}
