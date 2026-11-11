import { CheckCircle, Clock, Package } from 'lucide-react';

export default function StatusBadge({
    status,
}: {
    status: 'active' | 'draft' | 'archived';
}) {
    const statusConfig = {
        active: {
            label: 'Active',
            className:
                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            icon: <CheckCircle className="mr-1 h-3 w-3" />,
        },
        draft: {
            label: 'Draft',
            className:
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            icon: <Clock className="mr-1 h-3 w-3" />,
        },
        archived: {
            label: 'Archived',
            className:
                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
            icon: <Package className="mr-1 h-3 w-3" />,
        },
    };

    const config = statusConfig[status];

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
        >
            {config.icon}
            {config.label}
        </span>
    );
}
