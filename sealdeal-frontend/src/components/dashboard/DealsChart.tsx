import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Analysis } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { AlertTriangle } from 'lucide-react';

// This is the enriched analysis type that includes the dealName
interface EnrichedAnalysis extends Analysis {
  dealName: string;
}

interface DealsChartProps {
  analyses: EnrichedAnalysis[];
}

interface ChartData {
  name: string;
  arr: number;
  ltv_cac: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: {
    color: string;
    value: number;
    dataKey: string;
  }[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const arrPayload = payload.find((p) => p.dataKey === 'arr');
    const ltvCacPayload = payload.find((p) => p.dataKey === 'ltv_cac');

    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm text-sm">
        <p className="font-bold text-foreground mb-2">{label}</p>
        {arrPayload && (
          <p className="text-muted-foreground">
            <span style={{ color: arrPayload.color }}>●</span> ARR:
            <span className="font-semibold text-primary ml-1">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                notation: 'compact',
              }).format(arrPayload.value)}
            </span>
          </p>
        )}
        {ltvCacPayload && (
          <p className="text-muted-foreground">
            <span style={{ color: ltvCacPayload.color }}>●</span> LTV/CAC:
            <span className="font-semibold text-primary ml-1">
              {ltvCacPayload.value.toFixed(2)}x
            </span>
          </p>
        )}
      </div>
    );
  }

  return null;
};

export default function DealsChart({ analyses }: DealsChartProps) {
  const chartData: ChartData[] = analyses.map((a) => ({
    name: a.dealName,
    arr: a.metrics.arr.value || 0,
    ltv_cac: a.metrics.ltv_cac_ratio.value || 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deal Performance Snapshot</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={80}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) =>
                  `$${new Intl.NumberFormat('en-US', {
                    notation: 'compact',
                  }).format(value)}`
                }
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => `${value}x`}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'hsl(var(--primary) / 0.1)' }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="arr"
                name="ARR"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="ltv_cac"
                name="LTV/CAC Ratio"
                fill="hsl(var(--secondary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[350px] text-center">
            <AlertTriangle className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Analyzed Deals</h3>
            <p className="text-sm text-muted-foreground">
              Upload documents and run an analysis on a deal to see chart data.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
