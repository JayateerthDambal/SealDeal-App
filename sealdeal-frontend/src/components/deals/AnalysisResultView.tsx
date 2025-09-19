import { useState } from 'react';
import { Analysis } from '@/types';
import MemoSection from '@/components/deals/MemoSection';
import HighlightsCard from '@/components/deals/HighlightsCard';
import DetailedAnalysisCard from '@/components/deals/DetailedAnalysisCard';
import SWOTAnalysisCard from '@/components/deals/SWOTAnalysisCard';
import { Button } from '@/components/ui/Button';
import { List, Table } from 'lucide-react';

interface AnalysisResultViewProps {
  analysis: Analysis;
}

export default function AnalysisResultView({ analysis }: AnalysisResultViewProps) {
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div className="inline-flex rounded-md shadow-sm bg-card p-1">
          <Button
            variant={viewMode === 'summary' ? 'secondary' : 'ghost'}
            onClick={() => setViewMode('summary')}
            className="rounded-md"
          >
            <List className="h-4 w-4 mr-2"/>
            Summary View
          </Button>
          <Button
            variant={viewMode === 'detailed' ? 'secondary' : 'ghost'}
            onClick={() => setViewMode('detailed')}
            className="rounded-md"
          >
            <Table className="h-4 w-4 mr-2"/>
            Detailed View
          </Button>
        </div>
      </div>

      {viewMode === 'summary' && (
        <div className="space-y-6">
          <MemoSection memo={analysis.investment_memo} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HighlightsCard
              title="Key Risk Areas"
              items={analysis.risk_flags}
              variant="destructive"
            />
            <HighlightsCard
              title="Key Strengths"
              items={analysis.swot_analysis.strengths}
              variant="constructive"
            />
          </div>
        </div>
      )}

      {viewMode === 'detailed' && (
        <div className="space-y-6">
          <DetailedAnalysisCard analysis={analysis} />
          <SWOTAnalysisCard swot={analysis.swot_analysis} />
        </div>
      )}
    </div>
  );
}

