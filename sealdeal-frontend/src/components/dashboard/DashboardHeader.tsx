import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Analysis } from '@/types';
import { DollarSign, Scale, TrendingUp, AlertTriangle } from 'lucide-react';

interface DashboardHeaderProps {
  analyses: Analysis[];
}

const calculateAverages = (analyses: Analysis[]) => {
    if (analyses.length === 0) {
        return {
            avgArr: 0,
            avgLtvCac: 0,
            strongCandidates: 0,
            totalRisks: 0,
        };
    }

    const totalArr = analyses.reduce((sum, a) => sum + (a.metrics.arr.value || 0), 0);
    const totalLtvCac = analyses.reduce((sum, a) => sum + (a.metrics.ltv_cac_ratio.value || 0), 0);
    const strongCandidates = analyses.filter(a => a.investment_memo.investment_recommendation === 'Strong Candidate').length;
    const totalRisks = analyses.reduce((sum, a) => sum + a.risk_flags.length, 0);

    return {
        avgArr: totalArr / analyses.length,
        avgLtvCac: totalLtvCac / analyses.length,
        strongCandidates,
        totalRisks,
    };
};

export default function DashboardHeader({ analyses }: DashboardHeaderProps) {
    const { avgArr, avgLtvCac, strongCandidates, totalRisks } = calculateAverages(analyses);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. ARR</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(avgArr)}
                    </div>
                    <p className="text-xs text-muted-foreground">Average across all analyzed deals</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. LTV/CAC Ratio</CardTitle>
                    <Scale className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{avgLtvCac.toFixed(2)}x</div>
                    <p className="text-xs text-muted-foreground">A key indicator of profitability</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Strong Candidates</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+{strongCandidates}</div>
                     <p className="text-xs text-muted-foreground">Deals with a positive recommendation</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Risks Identified</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalRisks}</div>
                    <p className="text-xs text-muted-foreground">Across all analyzed deals</p>
                </CardContent>
            </Card>
        </div>
    );
}

