import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { InvestmentMemo } from '@/types';
import { Badge } from '@/components/ui/Badge';

interface MemoSectionProps {
  memo: InvestmentMemo;
}

const getRecommendationVariant = (recommendation: string) => {
  switch (recommendation) {
    case 'Strong Candidate':
      return 'default';
    case 'Proceed with Caution':
      return 'secondary';
    case 'Pass':
      return 'destructive';
    default:
      return 'outline';
  }
};

export default function MemoSection({ memo }: MemoSectionProps) {
  return (
    <Card className="bg-card/50 border-primary/10">
      <CardHeader>
        <CardTitle>Investment Memo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold text-muted-foreground flex items-center gap-2">
            Recommendation:
            <Badge variant={getRecommendationVariant(memo.investment_recommendation)}>
              {memo.investment_recommendation}
            </Badge>
          </h3>
        </div>
        <div>
          <h3 className="font-semibold text-foreground mb-1">Executive Summary</h3>
          <p className="text-muted-foreground text-sm">{memo.executive_summary}</p>
        </div>
        <div>
          <h3 className="font-semibold text-foreground mb-1">Growth Potential</h3>
          <p className="text-muted-foreground text-sm">{memo.growth_potential}</p>
        </div>
      </CardContent>
    </Card>
  );
}

