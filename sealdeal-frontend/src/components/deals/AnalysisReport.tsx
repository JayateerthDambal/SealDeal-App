import React from 'react';
import { Deal, Analysis } from '@/types';
import logo from '../../assets/logo.png';

interface AnalysisReportProps {
  deal: Deal | null;
  analysis: Analysis | null;
}

const formatReportValue = (key: string, value: any) => {
    if (value === null || value === undefined) return 'N/A';
    const currencyMetrics = ['arr', 'mrr', 'cac', 'ltv'];
    if (currencyMetrics.includes(key) && typeof value === 'number') {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }
    if (key === 'ltv_cac_ratio' && typeof value === 'number') {
        return `${value.toFixed(2)}x`;
    }
    if (key === 'gross_margin' && typeof value === 'number') {
        return `${(value * 100).toFixed(0)}%`;
    }
    return String(value);
};

const AnalysisReport = React.forwardRef<HTMLDivElement, AnalysisReportProps>(({ deal, analysis }, ref) => {
  if (!deal || !analysis) {
    return null;
  }

  return (
    <div ref={ref} className="bg-white text-black p-8" style={{ width: '210mm' }}>
        <header className="flex justify-between items-center border-b-2 border-gray-800 pb-4">
            <div className="flex items-center">
                <img src={logo} alt="SealDeal.ai Logo" className="h-12 w-auto" />
            </div>
            <div className="text-right">
                <p className="text-lg font-semibold">Confidential Investment Analysis</p>
                <p className="text-sm text-gray-600">Generated on: {new Date().toLocaleDateString()}</p>
            </div>
        </header>

        <main className="mt-8">
            <h2 className="text-3xl font-bold mb-2">{deal.dealName}</h2>
            <p className="text-lg text-gray-700 font-medium mb-6">Executive Investment Summary</p>

            <section className="mb-8 p-6 bg-gray-100 rounded-lg break-inside-avoid">
                <h3 className="text-xl font-semibold mb-3 border-b border-gray-300 pb-2">Investment Memo</h3>
                <div className="space-y-4 text-sm">
                    <p><strong>Recommendation:</strong> <span className="font-bold text-amber-700">{analysis.investment_memo.investment_recommendation}</span></p>
                    <div>
                        <h4 className="font-semibold">Executive Summary</h4>
                        <p className="text-gray-600">{analysis.investment_memo.executive_summary}</p>
                    </div>
                     <div>
                        <h4 className="font-semibold">Growth Potential</h4>
                        <p className="text-gray-600">{analysis.investment_memo.growth_potential}</p>
                    </div>
                </div>
            </section>
            
            <section className="mb-8 break-inside-avoid">
                 <h3 className="text-xl font-semibold mb-3 border-b border-gray-300 pb-2">Extracted Metrics</h3>
                 <table className="w-full text-sm">
                     <thead className="bg-gray-200">
                         <tr>
                            <th className="text-left p-3 font-semibold">Metric</th>
                            <th className="text-left p-3 font-semibold">Value</th>
                            <th className="text-left p-3 font-semibold">Source / Notes</th>
                         </tr>
                     </thead>
                     <tbody>
                        {Object.entries(analysis.metrics).map(([key, metric]) => (
                            <tr key={key} className="border-b">
                                <td className="p-3 uppercase font-medium">{key.replace(/_/g, ' ')}</td>
                                <td className="p-3 font-semibold">{formatReportValue(key, metric.value)}</td>
                                <td className="p-3 text-gray-600 italic">{metric.notes || metric.source_quote}</td>
                            </tr>
                        ))}
                     </tbody>
                 </table>
            </section>
            
            <section className="grid grid-cols-1 gap-8 break-inside-avoid">
                <div>
                     <h3 className="text-xl font-semibold mb-3 border-b border-gray-300 pb-2">SWOT Analysis</h3>
                     <div className="text-sm space-y-3">
                        <p><strong>Strengths:</strong> {analysis.swot_analysis.strengths.join(', ')}</p>
                        <p><strong>Weaknesses:</strong> {analysis.swot_analysis.weaknesses.join(', ')}</p>
                        <p><strong>Opportunities:</strong> {analysis.swot_analysis.opportunities.join(', ')}</p>
                        <p><strong>Threats:</strong> {analysis.swot_analysis.threats.join(', ')}</p>
                     </div>
                </div>
                 <div>
                     <h3 className="text-xl font-semibold mb-3 border-b border-gray-300 pb-2">Key Risk Flags</h3>
                     <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                        {analysis.risk_flags.map((flag, i) => <li key={i}>{flag}</li>)}
                     </ul>
                </div>
            </section>

        </main>
    </div>
  );
});

export default AnalysisReport;

