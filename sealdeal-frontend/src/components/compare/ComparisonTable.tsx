import { Card, CardContent } from '@/components/ui/Card';
import { ComparisonData } from '@/pages/ComparePage';

interface ComparisonTableProps {
    data: ComparisonData[];
}

// A helper to find the best value in a row for highlighting
const findBestValue = (values: (number | null)[], higherIsBetter: boolean = true) => {
    const validValues = values.filter(v => v !== null) as number[];
    if (validValues.length === 0) return null;
    return higherIsBetter ? Math.max(...validValues) : Math.min(...validValues);
};

const formatValue = (value: any, key: string) => {
    if (value === null || value === undefined) return <span className="text-muted-foreground/50">N/A</span>;
    if (key.includes('arr') || key.includes('mrr') || key.includes('ltv') || key.includes('cac')) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(value);
    }
    if (key.includes('ratio')) {
        return `${value.toFixed(2)}x`;
    }
     if (key.includes('margin')) {
        return `${(value * 100).toFixed(0)}%`;
    }
    return String(value);
};

export default function ComparisonTable({ data }: ComparisonTableProps) {
    const metrics = [
        { key: 'arr', label: 'ARR', higherIsBetter: true },
        { key: 'ltv_cac_ratio', label: 'LTV/CAC Ratio', higherIsBetter: true },
        { key: 'gross_margin', label: 'Gross Margin', higherIsBetter: true },
        { key: 'cac', label: 'CAC', higherIsBetter: false },
        { key: 'ltv', label: 'LTV', higherIsBetter: true },
        { key: 'mrr', label: 'MRR', higherIsBetter: true },
    ];

    return (
        <Card className="bg-card/50 border-primary/10">
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-card">
                            <tr className="border-b border-primary/20">
                                <th className="text-left font-semibold p-4 sticky left-0 bg-card">Metric</th>
                                {data.map(deal => (
                                    <th key={deal.dealId} className="text-center font-semibold p-4 min-w-[200px]">{deal.dealName}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                             {/* Recommendation Row */}
                             <tr className="border-b border-primary/10">
                                <td className="font-semibold p-4 sticky left-0 bg-card/95 backdrop-blur-sm">Recommendation</td>
                                {data.map(deal => (
                                    <td key={deal.dealId} className="text-center p-4 font-bold text-primary">
                                        {deal.analysis?.investment_memo.investment_recommendation || 'N/A'}
                                    </td>
                                ))}
                            </tr>

                            {/* Dynamic Metric Rows */}
                            {metrics.map(metric => {
                                const values = data.map(d => d.analysis?.metrics[metric.key as keyof typeof d.analysis.metrics]?.value ?? null);
                                const bestValue = findBestValue(values, metric.higherIsBetter);

                                return (
                                    <tr key={metric.key} className="hover:bg-primary/5">
                                        <td className="font-semibold p-4 sticky left-0 bg-card/95 backdrop-blur-sm">{metric.label}</td>
                                        {data.map((deal, index) => {
                                            const value = values[index];
                                            const isBest = value !== null && value === bestValue;
                                            return (
                                                <td key={deal.dealId} className={`text-center p-4 font-semibold ${isBest ? 'text-green-400' : ''}`}>
                                                    {isBest && <span className="font-bold">⭐ </span>}
                                                    {formatValue(value, metric.key)}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
