import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Analysis } from '../../types';
import { Badge } from '../ui/Badge';

interface DetailedAnalysisCardProps {
  analysis: Analysis;
}

const formatValue = (key: string, value: any) => {
    if (value === null || value === undefined) return <Badge variant="secondary">N/A</Badge>;
    const currencyMetrics = ['arr', 'mrr', 'cac', 'ltv'];
    if (currencyMetrics.includes(key) && typeof value === 'number') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            notation: 'compact',
            maximumFractionDigits: 2,
        }).format(value);
    }
    if (key === 'ltv_cac_ratio' && typeof value === 'number') {
        return <span className="text-green-400 font-semibold">{value.toFixed(2)}x</span>;
    }
    if (key === 'gross_margin' && typeof value === 'number') {
        return `${(value * 100).toFixed(0)}%`;
    }
    return String(value);
};


export default function DetailedAnalysisCard({ analysis }: DetailedAnalysisCardProps) {
  return (
    <Card className="bg-card/50 border-primary/10">
      <CardHeader>
        <CardTitle>Extracted Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase border-b border-primary/20">
              <tr>
                <th scope="col" className="px-6 py-3">Metric</th>
                <th scope="col" className="px-6 py-3">Value</th>
                <th scope="col" className="px-6 py-3">Source / Notes</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(analysis.metrics).map(([key, metric]) => (
                <tr key={key} className="border-b border-primary/10 hover:bg-primary/5">
                  <th scope="row" className="px-6 py-4 font-medium whitespace-nowrap uppercase">
                    {key.replace(/_/g, ' ')}
                  </th>
                  <td className="px-6 py-4 font-semibold text-primary">{formatValue(key, metric.value)}</td>
                  <td className="px-6 py-4 text-muted-foreground italic">{metric.notes || metric.source_quote || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

