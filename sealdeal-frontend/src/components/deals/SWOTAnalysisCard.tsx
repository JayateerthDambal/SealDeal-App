import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Analysis } from '../../types';
import { CheckCircle2, XCircle, Zap, ShieldAlert } from 'lucide-react';

interface SWOTAnalysisCardProps {
  swot: Analysis['swot_analysis'];
}

export default function SWOTAnalysisCard({ swot }: SWOTAnalysisCardProps) {
  return (
    <Card className="bg-card/50 border-primary/10">
      <CardHeader>
        <CardTitle>SWOT Analysis Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Strengths */}
          <div>
            <h3 className="flex items-center text-lg font-semibold text-green-400 mb-3">
              <CheckCircle2 className="h-5 w-5 mr-2" /> Strengths
            </h3>
            <ul className="space-y-2 list-disc list-inside text-muted-foreground">
              {swot.strengths.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </div>
          {/* Weaknesses */}
          <div>
            <h3 className="flex items-center text-lg font-semibold text-red-400 mb-3">
              <XCircle className="h-5 w-5 mr-2" /> Weaknesses
            </h3>
            <ul className="space-y-2 list-disc list-inside text-muted-foreground">
              {swot.weaknesses.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </div>
          {/* Opportunities */}
          <div>
            <h3 className="flex items-center text-lg font-semibold text-blue-400 mb-3">
              <Zap className="h-5 w-5 mr-2" /> Opportunities
            </h3>
            <ul className="space-y-2 list-disc list-inside text-muted-foreground">
              {swot.opportunities.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </div>
          {/* Threats */}
          <div>
            <h3 className="flex items-center text-lg font-semibold text-amber-400 mb-3">
              <ShieldAlert className="h-5 w-5 mr-2" /> Threats
            </h3>
            <ul className="space-y-2 list-disc list-inside text-muted-foreground">
              {swot.threats.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

