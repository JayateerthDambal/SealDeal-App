import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Badge } from './Badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

export function MetricsCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  variant = 'default'
}: MetricsCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3" />;
      case 'down':
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-success/20 bg-success/5';
      case 'warning':
        return 'border-warning/20 bg-warning/5';
      case 'destructive':
        return 'border-destructive/20 bg-destructive/5';
      default:
        return '';
    }
  };

  return (
    <Card className={`transition-all hover:shadow-md ${getVariantStyles()}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="flex items-center gap-2 text-xs">
          {subtitle && (
            <span className="text-muted-foreground">{subtitle}</span>
          )}
          {trend && trendValue && (
            <Badge variant="outline" className={`${getTrendColor()} border-current`}>
              {getTrendIcon()}
              <span className="ml-1">{trendValue}</span>
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}