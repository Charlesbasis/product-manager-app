import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Label,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const COLORS = [
    '#0088FE',
    '#00C49F',
    '#FFBB28',
    '#FF8042',
    '#8884D8',
    '#83a6ed',
];

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload;
    return (
        <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-md dark:border-gray-700 dark:bg-gray-800">
            <p className="font-medium">{point.fullLabel}</p>
            <p>
                {point.count} {point.count === 1 ? 'product' : 'products'}
            </p>
            {typeof point.percentage === 'number' && (
                <p className="text-gray-500">{point.percentage}% of catalog</p>
            )}
        </div>
    );
};

const PriceDistributionChart = ({ data }) => {
    if (!data?.length) {
        return (
            <p className="py-12 text-center text-sm text-gray-500">
                No price data available.
            </p>
        );
    }

    // Filter empty buckets — cleans up the "dead pixels on the right" issue
    // and unlocks horizontal labels for small catalogs.
    const nonEmpty = data.filter((item) => item.count > 0);
    const source = nonEmpty.length > 0 ? nonEmpty : data;

    const chartData = source.map((item) => ({
        label: item.label,
        count: item.count,
        percentage: item.percentage,
        fullLabel: item.label,
    }));

    const maxCount = Math.max(1, ...chartData.map((d) => d.count));
    // Explicit integer ticks — kill 0.5 gridlines definitively
    const ticks = Array.from({ length: maxCount + 1 }, (_, i) => i);

    // Horizontal labels only when they'll actually fit
    const useHorizontalLabels = chartData.length <= 3;

    return (
        <ResponsiveContainer width="100%" height={320}>
            <BarChart
                data={chartData}
                margin={{ top: 20, right: 24, left: 12, bottom: 40 }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <XAxis
                    dataKey="label"
                    interval={0}
                    angle={useHorizontalLabels ? 0 : -25}
                    textAnchor={useHorizontalLabels ? 'middle' : 'end'}
                    height={useHorizontalLabels ? 56 : 64}
                    tick={{ fontSize: 11 }}
                >
                    <Label
                        value="Price Range ($)"
                        offset={-5}
                        position="insideBottom"
                        style={{ fontSize: 11, fill: '#6b7280' }}
                    />
                </XAxis>

                <YAxis
                    allowDecimals={false}
                    domain={[0, maxCount]}
                    ticks={ticks}
                    tickFormatter={(v) => String(Math.round(v))}
                    width={52}
                    tick={{ fontSize: 11 }}
                >
                    <Label
                        value="Number of Products"
                        angle={-90}
                        position="insideLeft"
                        style={{
                            fontSize: 11,
                            fill: '#6b7280',
                            textAnchor: 'middle',
                        }}
                    />
                </YAxis>

                <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }}
                />

                <Bar dataKey="count" maxBarThickness={40} radius={[4, 4, 0, 0]}>
                    {chartData.map((_, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};

export default PriceDistributionChart;
