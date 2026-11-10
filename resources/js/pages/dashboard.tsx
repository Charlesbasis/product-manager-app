
import { create as productsCreate, index as productsIndex } from '@/actions/App/Http/Controllers/ProductController';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
  DollarSign,
  Package,
  Clock,
  BarChart3,
  Download,
  AlertCircle,
  Eye,
  Edit,
  ArrowRight,
  Plus,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import PriceDistributionChart from '@/components/PriceDistributionChart';
import StatusBadge from '@/components/StatusBadge';
import StatCard from '@/components/StatCard';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

// API Response Types
interface DashboardStatsResponse {
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

interface ActivityResponse {
    activities: Array<{
        id: number;
        action: string;
        description: string;
        timestamp: string;
        user: string;
        price?: number;
        category?: string;
    }>;
    total: number;
}

interface DashboardStats {
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

// Format a numeric value as USD, tolerating strings and nulls from the API.
const formatPrice = (price: unknown): string => {
  if (price === null || price === undefined) return '$0.00';

  const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);

  if (isNaN(numPrice)) return '$0.00';

  return `$${numPrice.toFixed(2)}`;
};

// Parse a numeric value from the API, falling back when it is missing.
const safeParseNumber = (value: unknown, defaultValue: number = 0): number => {
  if (value === null || value === undefined) return defaultValue;

  const num = typeof value === 'string' ? parseFloat(value) : Number(value);

  return isNaN(num) ? defaultValue : num;
};

// Growth values are nullable: null means there is no baseline to compare to.
const parseNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;

  const num = typeof value === 'string' ? parseFloat(value) : Number(value);

  return isNaN(num) ? null : num;
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalUnits: 0,
    totalValue: 0,
    avgPrice: 0,
    minPrice: 0,
    maxPrice: 0,
    recentActivity: 0,
    todayProducts: 0,
    yesterdayProducts: 0,
    growth: {
      products: null,
      value: null,
      avgPrice: null,
      todayActivity: null
    },
    statusSummary: {
      active: 0,
      draft: 0,
      archived: 0,
      total: 0
    },
    categoryDistribution: [],
    priceDistribution: []
  });

  const [recentProducts, setRecentProducts] = useState<Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
    created_at: string;
    tag: string;
    status: 'active' | 'draft' | 'archived';
  }>>([]);

  const [activityLog, setActivityLog] = useState<Array<{
    id: number;
    action: string;
    description: string;
    timestamp: string;
    user: string;
    price?: number;
    quantity?: number;
    status?: 'active' | 'draft' | 'archived';
    category?: string;
  }>>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch stats
      const statsResponse = await fetch('/api/dashboard/stats', {
        signal,
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include'
      });

      if (!statsResponse.ok) {
        throw new Error(`Stats API error: ${statsResponse.status}`);
      }

      const statsData: DashboardStatsResponse = await statsResponse.json();

      // Safely transform stats data
      setStats({
        totalProducts: safeParseNumber(statsData.basic_stats.total_products),
        totalUnits: safeParseNumber(statsData.basic_stats.total_units),
        totalValue: safeParseNumber(statsData.basic_stats.total_value),
        avgPrice: safeParseNumber(statsData.basic_stats.avg_price),
        minPrice: safeParseNumber(statsData.basic_stats.min_price),
        maxPrice: safeParseNumber(statsData.basic_stats.max_price),
        recentActivity: safeParseNumber(statsData.growth_stats.last_7_days_products),
        todayProducts: safeParseNumber(statsData.growth_stats.today_products),
        yesterdayProducts: safeParseNumber(statsData.growth_stats.yesterday_products),
        growth: {
          products: parseNullableNumber(statsData.growth_stats.products),
          value: parseNullableNumber(statsData.growth_stats.value),
          avgPrice: parseNullableNumber(statsData.growth_stats.avg_price),
          todayActivity: parseNullableNumber(statsData.growth_stats.today_activity)
        },
        statusSummary: {
          active: safeParseNumber(statsData.status_summary?.active),
          draft: safeParseNumber(statsData.status_summary?.draft),
          archived: safeParseNumber(statsData.status_summary?.archived),
          total: safeParseNumber(statsData.status_summary?.total)
        },
        categoryDistribution: Array.isArray(statsData.category_distribution)
          ? statsData.category_distribution.map(item => ({
            name: item?.name || 'Uncategorized',
            count: safeParseNumber(item?.count),
            percentage: safeParseNumber(item?.percentage)
          }))
          : [],
        priceDistribution: Array.isArray(statsData.price_distribution)
          ? statsData.price_distribution.map(item => ({
            label: item?.label || '',
            count: safeParseNumber(item?.count),
            min: safeParseNumber(item?.min),
            max: safeParseNumber(item?.max)
          }))
          : []
      });

      // Safely set recent products
      const safeRecentProducts = Array.isArray(statsData.recent_products)
        ? statsData.recent_products.map(product => ({
          id: safeParseNumber(product?.id),
          name: product?.name || 'Unnamed Product',
          price: safeParseNumber(product?.price),
          quantity: safeParseNumber(product?.quantity),
          created_at: product?.created_at || 'Just now',
          tag: product?.tag || 'Uncategorized',
          status: (product?.status === 'active' || product?.status === 'draft' || product?.status === 'archived')
            ? product.status
            : 'draft'
        }))
        : [];

      setRecentProducts(safeRecentProducts);
      setLastUpdated(new Date(statsData.timestamps?.calculated_at || new Date()).toLocaleTimeString());

      // Fetch activity log
      try {
        const activityResponse = await fetch('/api/dashboard/activity', {
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          credentials: 'include'
        });

        if (activityResponse.ok) {
          const activityData: ActivityResponse = await activityResponse.json();

          const safeActivities = Array.isArray(activityData.activities)
            ? activityData.activities.map(activity => ({
              id: safeParseNumber(activity?.id),
              action: activity?.action || 'UPDATE',
              description: activity?.description || 'Activity',
              timestamp: activity?.timestamp || 'Just now',
              user: activity?.user || 'System',
              price: safeParseNumber(activity?.price),
              category: activity?.category || 'Uncategorized'
            }))
            : [];

          setActivityLog(safeActivities);
        }
      } catch (activityError) {
        console.warn('Failed to fetch activity log:', activityError);
        // Don't fail the whole dashboard if activity log fails
      }

    } catch (error) {
      // 1. Check if the error is a deliberate cancellation
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Fetch aborted: Page changed or component unmounted.');
        return; // Exit quietly, don't show an error to the user
      }
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');

      // Set fallback data
      setStats({
        totalProducts: 0,
        totalUnits: 0,
        totalValue: 0,
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        recentActivity: 0,
        todayProducts: 0,
        yesterdayProducts: 0,
        growth: { products: null, value: null, avgPrice: null, todayActivity: null },
        statusSummary: { active: 0, draft: 0, archived: 0, total: 0 },
        categoryDistribution: [],
        priceDistribution: []
      });

      setRecentProducts([]);
      setActivityLog([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    const controller = new AbortController();

    const fetchWithCleanup = () => {
      // Only hit the VPS if the tab is active
      if (document.visibilityState === 'visible') {
        fetchDashboardData(controller.signal);
      }
    };

    fetchWithCleanup();

    const refreshInterval = setInterval(fetchWithCleanup, 5 * 60 * 1000);

    return () => {
      controller.abort(); // Cancel the request if the component unmounts
      clearInterval(refreshInterval);
    };
  }, [fetchDashboardData]);

  // Handle refresh button click
  const handleRefresh = () => {
    fetchDashboardData();
  };

  // Loading skeleton component
  if (isLoading) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <Head title="Dashboard" />
        <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
          {/* Loading Skeleton */}
          <div className="animate-pulse">
            {/* Header Skeleton */}
            <div className="rounded-xl bg-gray-200 p-6 dark:bg-gray-800">
              <div className="h-8 w-1/3 rounded bg-gray-300 dark:bg-gray-700"></div>
              <div className="mt-2 h-4 w-1/2 rounded bg-gray-300 dark:bg-gray-700"></div>
            </div>

            {/* Stats Grid Skeleton */}
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl bg-gray-200 p-5 dark:bg-gray-800">
                  <div className="h-4 w-1/2 rounded bg-gray-300 dark:bg-gray-700"></div>
                  <div className="mt-2 h-8 w-1/3 rounded bg-gray-300 dark:bg-gray-700"></div>
                </div>
              ))}
            </div>

            {/* Content Grid Skeleton */}
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="rounded-xl bg-gray-200 p-6 dark:bg-gray-800">
                  <div className="h-6 w-1/3 rounded bg-gray-300 dark:bg-gray-700"></div>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="mt-4 h-16 rounded bg-gray-300 dark:bg-gray-700"></div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="rounded-xl bg-gray-200 p-6 dark:bg-gray-800">
                  <div className="h-6 w-1/3 rounded bg-gray-300 dark:bg-gray-700"></div>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="mt-4 h-20 rounded bg-gray-300 dark:bg-gray-700"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />
      <div className="overflow-x-auto flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
        {/* Header with Refresh */}
        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg">
          <div className="flex flex-col justify-between md:flex-row md:items-center">
            <div>
              <div className="flex items-center">
                <h1 className="text-2xl font-bold md:text-3xl">Product Dashboard</h1>
                {lastUpdated && (
                  <span className="ml-3 rounded-full bg-blue-500/30 px-3 py-1 text-xs">
                    Updated: {lastUpdated}
                  </span>
                )}
              </div>
              <p className="mt-2 text-blue-100">
                Real-time overview of your product catalog
              </p>
            </div>
            <div className="mt-4 flex items-center space-x-3 md:mt-0">
              <Button 
                onClick={handleRefresh}
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Link 
                href={productsCreate().url} 
                className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Product
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-center">
              <AlertTriangle className="mr-3 h-5 w-5 text-red-500 dark:text-red-400" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-300">{error}</p>
                <Button 
                  onClick={() => fetchDashboardData()}
                  variant="link"
                  className="mt-1 h-auto p-0 text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  Try again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Products"
            value={stats.totalProducts.toLocaleString()}
            change={stats.growth.products}
            changeLabel="vs 30 days ago"
            icon={<Package className="h-5 w-5 text-blue-600" />}
            color="blue"
            detail={`Total units: ${stats.totalUnits.toLocaleString()} | Active: ${stats.statusSummary.active} | Draft: ${stats.statusSummary.draft}`}
          />
          <StatCard
            title="Inventory Value"
            value={formatPrice(stats.totalValue)}
            change={stats.growth.value}
            changeLabel="vs 30 days ago"
            icon={<DollarSign className="h-5 w-5 text-green-600" />}
            color="green"
            detail={`Avg unit price: ${formatPrice(stats.avgPrice)}`}
          />
          <StatCard
            title="Products Added Today"
            value={stats.todayProducts.toString()}
            change={stats.growth.todayActivity}
            changeLabel="vs yesterday"
            emptyChangeLabel={
              stats.todayProducts > 0
                ? 'New today'
                : stats.yesterdayProducts > 0
                  ? 'No activity today'
                  : 'No activity today or yesterday'
            }
            icon={<Clock className="h-5 w-5 text-purple-600" />}
            color="purple"
            detail={`Last 7 days: ${stats.recentActivity}`}
          />
          <StatCard
            title="Avg. Unit Price"
            value={formatPrice(stats.avgPrice)}
            change={stats.growth.avgPrice}
            changeLabel="vs 30 days ago"
            icon={<BarChart3 className="h-5 w-5 text-orange-600" />}
            color="orange"
            detail={`Min: ${formatPrice(stats.minPrice)} | Max: ${formatPrice(stats.maxPrice)}`}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Products */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
                <div>
                  <h2 className="text-lg font-semibold">Recent Products</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Latest additions to your catalog</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {recentProducts.length} products
                  </span>
                  <Link 
                    href={productsIndex().url} 
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    View All
                  </Link>
                </div>
              </div>
              <div className="overflow-x-auto">
                {recentProducts.length === 0 ? (
                  <div className="p-8 text-center">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-gray-500 dark:text-gray-400">No products found</p>
                    <Link 
                      href={productsCreate().url}
                      className="mt-3 inline-flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add your first product
                    </Link>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                        <th className="px-6 py-3 font-medium">Product</th>
                        <th className="px-6 py-3 font-medium">Price</th>
                        <th className="px-6 py-3 font-medium">Qty</th>
                        <th className="px-6 py-3 font-medium">Category</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentProducts.map((product) => (
                        <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
                          <td className="px-6 py-4">
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{product.created_at}</div>
                          </td>
                          <td className="px-6 py-4 font-medium">{formatPrice(product.price)}</td>
                          <td className="px-6 py-4">{product.quantity}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                              {product.tag}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={product.status} />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <Link 
                                href={`/products/${product.id}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Link>
                              <Link 
                                href={`/products/${product.id}/edit`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div>
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
                <h2 className="text-lg font-semibold">Recent Activity</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Latest actions in your system</p>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {activityLog.length === 0 ? (
                  <div className="p-8 text-center">
                    <Clock className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-gray-500 dark:text-gray-400">No recent activity</p>
                  </div>
                ) : (
                  activityLog.map((activity) => (
                    <div key={activity.id} className="px-6 py-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center">
                            <div className={`mr-2 flex h-6 w-6 items-center justify-center rounded-full ${
                              activity.action === 'CREATE' ? 'bg-green-100 dark:bg-green-900' :
                              activity.action === 'UPDATE' ? 'bg-blue-100 dark:bg-blue-900' :
                              activity.action === 'DELETE' ? 'bg-red-100 dark:bg-red-900' :
                              'bg-purple-100 dark:bg-purple-900'
                            }`}>
                              {activity.action === 'CREATE' ? <Plus className="h-3 w-3 text-green-600 dark:text-green-400" /> :
                               activity.action === 'UPDATE' ? <Edit className="h-3 w-3 text-blue-600 dark:text-blue-400" /> :
                               activity.action === 'DELETE' ? <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" /> :
                               <Download className="h-3 w-3 text-purple-600 dark:text-purple-400" />}
                            </div>
                            <span className={`text-xs font-medium ${
                              activity.action === 'CREATE' ? 'text-green-700 dark:text-green-400' :
                              activity.action === 'UPDATE' ? 'text-blue-700 dark:text-blue-400' :
                              activity.action === 'DELETE' ? 'text-red-700 dark:text-red-400' :
                              'text-purple-700 dark:text-purple-400'
                            }`}>
                              {activity.action}
                            </span>
                          </div>
                          <p className="mt-1 text-sm">{activity.description}</p>
                          {activity.price !== undefined && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Price: {formatPrice(activity.price)}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            By {activity.user} • {activity.timestamp}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Data Visualization Section */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Price Distribution */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Price Distribution</h3>
              <PriceDistributionChart data={stats.priceDistribution} />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
