import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { MetricsCard } from '../ui/MetricsCard';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { 
  DollarSign, 
  TrendingUp, 
  Target, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';

interface StakeholderOverviewProps {
  totalDeals?: number;
  activeDeals?: number;
  completedAnalyses?: number;
  avgDealSize?: string;
  successRate?: number;
  pendingReviews?: number;
}

export function StakeholderOverview({
  totalDeals = 0,
  activeDeals = 0,
  completedAnalyses = 0,
  avgDealSize = "$0",
  successRate = 0,
  pendingReviews = 0
}: StakeholderOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Total Deals"
          value={totalDeals}
          subtitle="All time"
          icon={<BarChart3 className="h-4 w-4" />}
          trend="up"
          trendValue="12%"
        />
        <MetricsCard
          title="Active Deals"
          value={activeDeals}
          subtitle="In progress"
          icon={<Clock className="h-4 w-4" />}
          variant="warning"
        />
        <MetricsCard
          title="Completed Analyses"
          value={completedAnalyses}
          subtitle="Ready for review"
          icon={<CheckCircle className="h-4 w-4" />}
          variant="success"
          trend="up"
          trendValue="8%"
        />
        <MetricsCard
          title="Avg Deal Size"
          value={avgDealSize}
          subtitle="Last 30 days"
          icon={<DollarSign className="h-4 w-4" />}
          trend="up"
          trendValue="15%"
        />
      </div>

      {/* Portfolio Health Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Portfolio Health
            </CardTitle>
            <CardDescription>
              Overall performance indicators across all deals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Success Rate</span>
                <span className="font-medium">{successRate}%</span>
              </div>
              <Progress value={successRate} className="h-2" />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-success">{Math.round(successRate * 0.6)}</div>
                <div className="text-xs text-muted-foreground">Strong</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-warning">{Math.round(successRate * 0.3)}</div>
                <div className="text-xs text-muted-foreground">Caution</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-destructive">{Math.round(successRate * 0.1)}</div>
                <div className="text-xs text-muted-foreground">Pass</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Stakeholder Actions
            </CardTitle>
            <CardDescription>
              Items requiring stakeholder attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-sm">Pending Reviews</span>
              </div>
              <Badge variant="secondary">{pendingReviews}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">Ready for Decision</span>
              </div>
              <Badge variant="secondary">{completedAnalyses}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-info" />
                <span className="text-sm">High Potential</span>
              </div>
              <Badge variant="secondary">{Math.round(totalDeals * 0.3)}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Insights */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Insights</CardTitle>
          <CardDescription>
            Key findings from recent deal analyses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 border rounded-lg bg-success/5 border-success/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="font-medium text-success">Strong Metrics</span>
              </div>
              <p className="text-sm text-muted-foreground">
                65% of deals show above-average LTV/CAC ratios
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-warning/5 border-warning/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="font-medium text-warning">Market Trends</span>
              </div>
              <p className="text-sm text-muted-foreground">
                SaaS valuations down 12% from previous quarter
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-info/5 border-info/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-info" />
                <span className="font-medium text-info">Opportunities</span>
              </div>
              <p className="text-sm text-muted-foreground">
                3 deals ready for accelerated due diligence
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}