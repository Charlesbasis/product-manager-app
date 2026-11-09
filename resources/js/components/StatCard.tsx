import { TrendingDown, TrendingUp } from "lucide-react";

export default function StatCard({
  title,
  value,
  change,
  icon,
  color,
  detail,
  changeLabel = "vs previous period",
  emptyChangeLabel = "No prior data",
}: {
  title: string;
  value: string | number;
  change: number | null;
  icon: React.ReactNode;
  color: string;
  detail?: string;
  changeLabel?: string;
  emptyChangeLabel?: string;
}) {
  const isPositive = (change ?? 0) >= 0;

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800',
    green: 'bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800',
    purple: 'bg-purple-50 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800',
    orange: 'bg-orange-50 border-orange-100 dark:bg-orange-900/20 dark:border-orange-800',
  };

  return (
    <div className={`rounded-xl border ${colorClasses[color as keyof typeof colorClasses]} p-5`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
          {detail && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{detail}</p>
          )}
        </div>
        <div className={`rounded-lg p-3 ${
          color === 'blue' ? 'bg-blue-100 dark:bg-blue-800' :
          color === 'green' ? 'bg-green-100 dark:bg-green-800' :
          color === 'purple' ? 'bg-purple-100 dark:bg-purple-800' :
          'bg-orange-100 dark:bg-orange-800'
        }`}>
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm">
        {change === null ? (
          <span className="text-gray-500 dark:text-gray-400">{emptyChangeLabel}</span>
        ) : change !== 0 ? (
          <>
            {isPositive ? (
              <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
            )}
            <span className={isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {isPositive ? '+' : ''}{change.toFixed(1)}%
            </span>
            <span className="ml-2 text-gray-500 dark:text-gray-400">{changeLabel}</span>
          </>
        ) : (
          <span className="text-gray-500 dark:text-gray-400">No change {changeLabel}</span>
        )}
      </div>
    </div>
  );
}
