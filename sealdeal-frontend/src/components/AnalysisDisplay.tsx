import React, { useState, useMemo } from 'react';
// Import the libraries for PDF export
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { type AnalysisData } from '../types';

interface AnalysisDisplayProps {
    analysis: AnalysisData[];
}

// Helper to format numbers for the metrics table remains the same
const formatMetricValue = (key: string, value: number | null) => {
    if (value === null || isNaN(value)) return 'N/A';
    const currencyMetrics = ['arr', 'mrr', 'cac', 'ltv'];
    if (currencyMetrics.includes(key)) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(value);
    }
    if (key === 'ltv_cac_ratio') return `${value.toFixed(2)}x`;
    if (key === 'gross_margin' || key === 'churn_rate') return `${value.toFixed(2)}%`;
    return value.toLocaleString();
};


const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis }) => {
    // --- NEW: State object for multiple filters ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        recommendation: 'All',
        riskFlag: 'All',
        minArr: '',
    });

    // --- NEW: Dynamically generate the list of unique risk flags for the filter dropdown ---
    const uniqueRiskFlags = useMemo(() => {
        const flags = new Set<string>();
        analysis.forEach(item => {
            item.risk_flags?.forEach(flag => flags.add(flag));
        });
        return Array.from(flags).sort();
    }, [analysis]);
    
    // --- NEW: Enhanced filtering logic to handle multiple criteria ---
    const filteredAnalysis = useMemo(() => {
        return analysis
            .filter(item => { // Filter by recommendation
                if (filters.recommendation === 'All') return true;
                return item.investment_memo.investment_recommendation === filters.recommendation;
            })
            .filter(item => { // Filter by risk flag
                if (filters.riskFlag === 'All') return true;
                return item.risk_flags?.includes(filters.riskFlag);
            })
            .filter(item => { // Filter by minimum ARR
                const minArr = parseFloat(filters.minArr);
                if (isNaN(minArr)) return true;
                const itemArr = item.metrics.arr?.value;
                return itemArr !== null && itemArr !== undefined && itemArr >= minArr;
            })
            .filter(item => { // Filter by search term
                if (!searchTerm) return true;
                const lowerCaseSearch = searchTerm.toLowerCase();
                const sourceFiles = item.sourceFiles.join(' ').toLowerCase();
                const summary = item.investment_memo.executive_summary.toLowerCase();
                return sourceFiles.includes(lowerCaseSearch) || summary.includes(lowerCaseSearch);
            });
    }, [analysis, searchTerm, filters]);


    // PDF Export Logic remains the same
    const handleExport = (analysisItem: AnalysisData) => (event: React.MouseEvent) => {
        const reportId = `report-${analysisItem.id}`;
        const reportElement = document.getElementById(reportId);
        if (!reportElement) return;

        const exportButton = event.currentTarget as HTMLElement;
        exportButton.style.display = 'none';
        const dealName = analysisItem.sourceFiles[0]?.split('.')[0] || "Analysis";

        html2canvas(reportElement).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${dealName}-SealDeal-Analysis.pdf`);
            exportButton.style.display = 'block';
        });
    };

    if (analysis.length === 0) {
        return null;
    }

    return (
        <div style={{ fontFamily: 'sans-serif', marginTop: '2rem', borderTop: '2px solid #eee', paddingTop: '1rem' }}>
            <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>AI-Generated Analyses</h3>
            
            {/* --- NEW: Multi-Filter UI --- */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px', marginBottom: '1rem', alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder="Search by filename or summary..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ padding: '0.5rem', gridColumn: '1 / -1' }} // Span full width
                />
                <select 
                    value={filters.recommendation} 
                    onChange={(e) => setFilters(prev => ({...prev, recommendation: e.target.value}))}
                    style={{ padding: '0.5rem' }}
                >
                    <option value="All">All Recommendations</option>
                    <option value="Strong Candidate">Strong Candidate</option>
                    <option value="Proceed with Caution">Proceed with Caution</option>
                    <option value="Further Diligence Required">Further Diligence Required</option>
                    <option value="Pass">Pass</option>
                </select>
                <select 
                    value={filters.riskFlag} 
                    onChange={(e) => setFilters(prev => ({...prev, riskFlag: e.target.value}))}
                    style={{ padding: '0.5rem' }}
                >
                    <option value="All">All Risk Flags</option>
                    {uniqueRiskFlags.map(flag => <option key={flag} value={flag}>{flag}</option>)}
                </select>
                <input
                    type="number"
                    placeholder="Min ARR (e.g., 500000)"
                    value={filters.minArr}
                    onChange={(e) => setFilters(prev => ({...prev, minArr: e.target.value}))}
                    style={{ padding: '0.5rem' }}
                />
            </div>
            {/* --- END NEW --- */}

            {/* Render the filtered list of analyses */}
            {filteredAnalysis.length > 0 ? (
                filteredAnalysis.map(item => (
                    <div key={item.id} id={`report-${item.id}`} style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '1rem' }}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '1rem'}}>
                            <h4 style={{ margin: 0 }}>Analysis for: {item.sourceFiles.join(', ')}</h4>
                            <button onClick={handleExport(item)} style={{padding: '0.5rem 1rem'}}>Export to PDF</button>
                        </div>
                        
                        {/* --- COMPLETE JSX FOR ANALYSIS REPORT --- */}
                        <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                            <h4>Investment Memo</h4>
                            <p><strong>Recommendation:</strong> <span style={{fontWeight: 'bold', color: '#005a9c'}}>{item.investment_memo.investment_recommendation}</span></p>
                            <p><strong>Executive Summary:</strong> {item.investment_memo.executive_summary}</p>
                            <p><strong>Growth Potential:</strong> {item.investment_memo.growth_potential}</p>
                        </div>

                        {item.risk_flags && item.risk_flags.length > 0 && (
                            <div style={{ background: '#fff0f0', border: '1px solid #ffcccc', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                                <h4>Potential Risk Flags</h4>
                                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                    {item.risk_flags.map((flag, index) => (
                                        <li key={index} style={{ color: '#c00' }}>{flag}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                            <h4>SWOT Analysis</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                <div><strong>Strengths:</strong> <ul>{item.swot_analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
                                <div><strong>Weaknesses:</strong> <ul>{item.swot_analysis.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul></div>
                                <div><strong>Opportunities:</strong> <ul>{item.swot_analysis.opportunities.map((o, i) => <li key={i}>{o}</li>)}</ul></div>
                                <div><strong>Threats:</strong> <ul>{item.swot_analysis.threats.map((t, i) => <li key={i}>{t}</li>)}</ul></div>
                            </div>
                        </div>

                        <div style={{ background: '#f0f5ff', border: '1px solid #cce0ff', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                            <h4>Benchmarking Summary</h4>
                            <p>{item.benchmarking_summary}</p>
                        </div>
                        
                        <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
                            <h4>Extracted Metrics</h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                <thead>
                                    <tr>
                                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Metric</th>
                                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Value</th>
                                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Source / Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(item.metrics).map(([key, metric]) => (
                                        metric && (
                                            <tr key={key}>
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{key.toUpperCase()}</td>
                                                <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>{formatMetricValue(key, metric.value)}</td>
                                                <td style={{ border: '1px solid #ddd', padding: '8px', fontStyle: 'italic', color: '#555', fontSize: '12px' }}>
                                                    {metric.notes || `"${metric.source_quote}"` || 'N/A'}
                                                </td>
                                            </tr>
                                        )
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))
            ) : (
                <p style={{fontStyle: 'italic'}}>No analyses match your current filters.</p>
            )}
        </div>
    );
};

export default AnalysisDisplay;

