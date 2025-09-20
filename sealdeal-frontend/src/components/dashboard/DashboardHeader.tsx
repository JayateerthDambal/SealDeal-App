import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Analysis } from '@/types';
import { DollarSign, Scale, TrendingUp, AlertTriangle } from 'lucide-react';

interface DashboardHeaderProps {
  analyses: (Analysis & { dealName: string })[];
}

const calculateAverages = (analyses: (Analysis & { dealName: string })[]) => {
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
    
    const analyzedCount = analyses.length > 0 ? analyses.length : 1;

    return {
        avgArr: totalArr / analyzedCount,
        avgLtvCac: totalLtvCac / analyzedCount,
        strongCandidates,
        totalRisks,
    };
};

export default function DashboardHeader({ analyses }: DashboardHeaderProps) {
    const { avgArr, avgLtvCac, strongCandidates, totalRisks } = calculateAverages(analyses);

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Avg. ARR Card */}
            <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-card transition-all duration-300 hover:border-blue-400/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. ARR</CardTitle>
                    <div className="h-8 w-8 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-400">
                      <DollarSign className="h-4 w-4" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-primary">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(avgArr)}
                    </div>
                    <p className="text-xs text-muted-foreground">Average across all analyzed deals</p>
                </CardContent>
                <div className="absolute bottom-0 left-0 h-1 w-full bg-blue-400/50 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"/>
            </Card>
            
            {/* Avg. LTV/CAC Ratio Card */}
             <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-card transition-all duration-300 hover:border-purple-400/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. LTV/CAC Ratio</CardTitle>
                     <div className="h-8 w-8 rounded-full flex items-center justify-center bg-purple-500/10 text-purple-400">
                      <Scale className="h-4 w-4" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-primary">{avgLtvCac.toFixed(2)}x</div>
                    <p className="text-xs text-muted-foreground">A key indicator of profitability</p>
                </CardContent>
                 <div className="absolute bottom-0 left-0 h-1 w-full bg-purple-400/50 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"/>
            </Card>

            {/* Strong Candidates Card */}
             <Card className="group relative overflow-hidden bg-gradient-to-br from-green-500/10 to-card transition-all duration-300 hover:border-green-400/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Strong Candidates</CardTitle>
                     <div className="h-8 w-8 rounded-full flex items-center justify-center bg-green-500/10 text-green-400">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-primary">+{strongCandidates}</div>
                     <p className="text-xs text-muted-foreground">Deals with a positive recommendation</p>
                </CardContent>
                 <div className="absolute bottom-0 left-0 h-1 w-full bg-green-400/50 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"/>
            </Card>

            {/* Total Risks Identified Card */}
             <Card className="group relative overflow-hidden bg-gradient-to-br from-amber-500/10 to-card transition-all duration-300 hover:border-amber-400/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Risks Identified</CardTitle>
                     <div className="h-8 w-8 rounded-full flex items-center justify-center bg-amber-500/10 text-amber-400">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-primary">{totalRisks}</div>
                    <p className="text-xs text-muted-foreground">Across all analyzed deals</p>
                </CardContent>
                 <div className="absolute bottom-0 left-0 h-1 w-full bg-amber-400/50 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"/>
            </Card>
        </div>
    );
}

