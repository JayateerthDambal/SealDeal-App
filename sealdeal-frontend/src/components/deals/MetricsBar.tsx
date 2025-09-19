import { Info } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/Tooltip';
import { Analysis } from '../../types';

interface MetricsBarProps {
  metrics: Analysis['metrics'];
}

const formatMetricValue = (key: string, value: number | null) => {
  if (value === null || value === undefined) return 'N/A';
  
  const currencyMetrics = ['arr', 'mrr', 'cac', 'ltv'];
  if (currencyMetrics.includes(key)) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(value);
  }

  if (key === 'ltv_cac_ratio') {
    return `${value.toFixed(1)}x`;
  }
  
  if (key === 'gross_margin') {
      return `${(value * 100).toFixed(0)}%`;
  }

  return value.toLocaleString();
};

const metricDisplayNames: { [key: string]: string } = {
  arr: 'Annual Recurring Revenue',
  mrr: 'Monthly Recurring Revenue',
  cac: 'Customer Acquisition Cost',
  ltv: 'Lifetime Value',
  ltv_cac_ratio: 'LTV / CAC Ratio',
  gross_margin: 'Gross Margin'
}


export default function MetricsBar({ metrics }: MetricsBarProps) {
  return (
    <Card className="bg-card/50 border-primary/10">
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
          {Object.entries(metrics).map(([key, metric]) => (
            <div key={key} className="flex flex-col items-center">
              <div className="flex items-center text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {metricDisplayNames[key] || key}
                {metric.source_quote && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 ml-1.5 cursor-help opacity-50" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-sm">
                          <strong>Source:</strong> "{metric.source_quote}"
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className="text-3xl font-bold mt-2 text-primary">
                {formatMetricValue(key, metric.value)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

