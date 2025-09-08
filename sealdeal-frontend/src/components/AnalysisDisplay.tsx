import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
} from 'chart.js';
import { Bar, Doughnut, Radar } from 'react-chartjs-2';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, ExclamationTriangleIcon, DocumentArrowDownIcon, EyeIcon } from '@heroicons/react/24/outline';
import ExecutiveSummary from './ExecutiveSummary';
import { type AnalysisData } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale
);

interface AnalysisDisplayProps {
    analysis: AnalysisData[];
    dealName?: string;
}

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

const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
        case 'Strong Candidate': return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: 'text-green-600' };
        case 'Proceed with Caution': return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: 'text-yellow-600' };
        case 'Further Diligence Required': return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'text-blue-600' };
        case 'Pass': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-600' };
        default: return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', icon: 'text-gray-600' };
    }
};

const MetricsChart = ({ metrics }: { metrics: any }) => {
    const chartData = {
        labels: ['ARR', 'MRR', 'CAC', 'LTV', 'LTV/CAC Ratio', 'Gross Margin'],
        datasets: [
            {
                label: 'Key Metrics',
                data: [
                    metrics.arr?.value || 0,
                    metrics.mrr?.value || 0,
                    metrics.cac?.value || 0,
                    metrics.ltv?.value || 0,
                    (metrics.ltv_cac_ratio?.value || 0) * 100000, // Scale for visualization
                    (metrics.gross_margin?.value || 0) * 10000, // Scale for visualization
                ],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(168, 85, 247, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(20, 184, 166, 0.8)',
                ],
                borderColor: [
                    'rgba(34, 197, 94, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(168, 85, 247, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(20, 184, 166, 1)',
                ],
                borderWidth: 2,
                borderRadius: 8,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                },
            },
            x: {
                grid: {
                    display: false,
                },
            },
        },
    };

    return <Bar data={chartData} options={options} height={120} />;
};

const SWOTRadarChart = ({ swotAnalysis }: { swotAnalysis: any }) => {
    const data = {
        labels: ['Strengths', 'Opportunities', 'Market Position', 'Innovation', 'Team'],
        datasets: [
            {
                label: 'SWOT Analysis',
                data: [
                    swotAnalysis.strengths.length * 20,
                    swotAnalysis.opportunities.length * 20,
                    Math.max(0, 100 - swotAnalysis.weaknesses.length * 15),
                    swotAnalysis.strengths.filter((s: string) => s.toLowerCase().includes('innovation') || s.toLowerCase().includes('technology')).length * 30 + 40,
                    swotAnalysis.strengths.filter((s: string) => s.toLowerCase().includes('team') || s.toLowerCase().includes('founder')).length * 30 + 50,
                ],
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
        },
        scales: {
            r: {
                beginAtZero: true,
                max: 100,
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)',
                },
                angleLines: {
                    color: 'rgba(0, 0, 0, 0.1)',
                },
                pointLabels: {
                    font: {
                        size: 12,
                        weight: 'bold' as const,
                    },
                    color: '#374151',
                },
            },
        },
    };

    return <Radar data={data} options={options} height={120} />;
};

const RiskDistributionChart = ({ riskFlags }: { riskFlags: string[] }) => {
    const riskCategories = riskFlags.reduce((acc: Record<string, number>, flag: string) => {
        const category = flag.includes('market') ? 'Market Risk' :
                        flag.includes('financial') || flag.includes('revenue') ? 'Financial Risk' :
                        flag.includes('team') || flag.includes('founder') ? 'Team Risk' :
                        flag.includes('competition') ? 'Competitive Risk' : 'Other Risk';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
    }, {});

    const data = {
        labels: Object.keys(riskCategories),
        datasets: [
            {
                data: Object.values(riskCategories),
                backgroundColor: [
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(168, 85, 247, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(107, 114, 128, 0.8)',
                ],
                borderColor: [
                    'rgba(239, 68, 68, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(168, 85, 247, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(107, 114, 128, 1)',
                ],
                borderWidth: 2,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    padding: 20,
                    font: {
                        size: 11,
                    },
                },
            },
        },
    };

    return <Doughnut data={data} options={options} height={120} />;
};

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis, dealName = "Investment Analysis" }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        recommendation: 'All',
        riskFlag: 'All',
        minArr: '',
    });
    const [viewMode, setViewMode] = useState<'cards' | 'detailed'>('cards');

    const uniqueRiskFlags = useMemo(() => {
        const flags = new Set<string>();
        analysis.forEach(item => {
            item.risk_flags?.forEach(flag => flags.add(flag));
        });
        return Array.from(flags).sort();
    }, [analysis]);
    
    const filteredAnalysis = useMemo(() => {
        return analysis
            .filter(item => {
                if (filters.recommendation === 'All') return true;
                return item.investment_memo.investment_recommendation === filters.recommendation;
            })
            .filter(item => {
                if (filters.riskFlag === 'All') return true;
                return item.risk_flags?.includes(filters.riskFlag);
            })
            .filter(item => {
                const minArr = parseFloat(filters.minArr);
                if (isNaN(minArr)) return true;
                const itemArr = item.metrics.arr?.value;
                return itemArr !== null && itemArr !== undefined && itemArr >= minArr;
            })
            .filter(item => {
                if (!searchTerm) return true;
                const lowerCaseSearch = searchTerm.toLowerCase();
                const sourceFiles = item.sourceFiles.join(' ').toLowerCase();
                const summary = item.investment_memo.executive_summary.toLowerCase();
                return sourceFiles.includes(lowerCaseSearch) || summary.includes(lowerCaseSearch);
            });
    }, [analysis, searchTerm, filters]);

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
        return (
            <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Available</h3>
                <p className="text-gray-600">Upload documents and run analysis to see results</p>
            </div>
        );
    }

    return (
        <div className="mt-8">
            {/* Executive Summary */}
            <ExecutiveSummary analysis={analysis} dealName={dealName} />
            
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Detailed Analysis Dashboard</h3>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setViewMode('cards')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                            viewMode === 'cards' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        <EyeIcon className="h-4 w-4 inline mr-1" />
                        Card View
                    </button>
                    <button
                        onClick={() => setViewMode('detailed')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                            viewMode === 'detailed' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        <DocumentArrowDownIcon className="h-4 w-4 inline mr-1" />
                        Detailed View
                    </button>
                </div>
            </div>
            
            {/* Enhanced Filter UI */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <input
                            type="text"
                            placeholder="Search by filename or summary..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Recommendation</label>
                        <select 
                            value={filters.recommendation} 
                            onChange={(e) => setFilters(prev => ({...prev, recommendation: e.target.value}))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                            <option value="All">All Recommendations</option>
                            <option value="Strong Candidate">Strong Candidate</option>
                            <option value="Proceed with Caution">Proceed with Caution</option>
                            <option value="Further Diligence Required">Further Diligence Required</option>
                            <option value="Pass">Pass</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Risk Flag</label>
                        <select 
                            value={filters.riskFlag} 
                            onChange={(e) => setFilters(prev => ({...prev, riskFlag: e.target.value}))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                            <option value="All">All Risk Flags</option>
                            {uniqueRiskFlags.map(flag => <option key={flag} value={flag}>{flag}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Min ARR</label>
                        <input
                            type="number"
                            placeholder="500000"
                            value={filters.minArr}
                            onChange={(e) => setFilters(prev => ({...prev, minArr: e.target.value}))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* Analysis Results */}
            {filteredAnalysis.length > 0 ? (
                <div className={viewMode === 'cards' ? 'grid grid-cols-1 xl:grid-cols-2 gap-6' : 'space-y-8'}>
                    {filteredAnalysis.map(item => {
                        const colorScheme = getRecommendationColor(item.investment_memo.investment_recommendation);
                        
                        if (viewMode === 'cards') {
                            return (
                                <div key={item.id} className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
                                    {/* Card Header */}
                                    <div className={`${colorScheme.bg} ${colorScheme.border} border-b px-6 py-4`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-900 mb-1">
                                                    {item.sourceFiles.join(', ')}
                                                </h4>
                                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colorScheme.bg} ${colorScheme.text} border ${colorScheme.border}`}>
                                                    {item.investment_memo.investment_recommendation === 'Strong Candidate' && <ArrowTrendingUpIcon className={`h-4 w-4 mr-1 ${colorScheme.icon}`} />}
                                                    {item.investment_memo.investment_recommendation === 'Pass' && <ArrowTrendingDownIcon className={`h-4 w-4 mr-1 ${colorScheme.icon}`} />}
                                                    {(item.investment_memo.investment_recommendation === 'Proceed with Caution' || item.investment_memo.investment_recommendation === 'Further Diligence Required') && <ExclamationTriangleIcon className={`h-4 w-4 mr-1 ${colorScheme.icon}`} />}
                                                    {item.investment_memo.investment_recommendation}
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleExport(item)}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                            >
                                                Export PDF
                                            </button>
                                        </div>
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-6 space-y-6">
                                        {/* Executive Summary */}
                                        <div>
                                            <h5 className="text-sm font-semibold text-gray-900 mb-2">Executive Summary</h5>
                                            <p className="text-gray-700 text-sm leading-relaxed">{item.investment_memo.executive_summary}</p>
                                        </div>

                                        {/* Key Metrics Visualization */}
                                        <div>
                                            <h5 className="text-sm font-semibold text-gray-900 mb-3">Key Metrics</h5>
                                            <div className="h-48">
                                                <MetricsChart metrics={item.metrics} />
                                            </div>
                                        </div>

                                        {/* Key Stats Grid */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                                <div className="text-2xl font-bold text-blue-600">
                                                    {formatMetricValue('arr', item.metrics.arr?.value || null)}
                                                </div>
                                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">ARR</div>
                                            </div>
                                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                                <div className="text-2xl font-bold text-green-600">
                                                    {formatMetricValue('ltv_cac_ratio', item.metrics.ltv_cac_ratio?.value || null)}
                                                </div>
                                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">LTV/CAC</div>
                                            </div>
                                        </div>

                                        {/* Risk Flags */}
                                        {item.risk_flags && item.risk_flags.length > 0 && (
                                            <div>
                                                <h5 className="text-sm font-semibold text-gray-900 mb-2">Risk Flags</h5>
                                                <div className="flex flex-wrap gap-2">
                                                    {item.risk_flags.slice(0, 3).map((flag, index) => (
                                                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                                                            {flag.length > 30 ? `${flag.substring(0, 30)}...` : flag}
                                                        </span>
                                                    ))}
                                                    {item.risk_flags.length > 3 && (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                            +{item.risk_flags.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        } else {
                            // Detailed view (original format with enhancements)
                            return (
                                <div key={item.id} id={`report-${item.id}`} className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                                    <div className={`${colorScheme.bg} ${colorScheme.border} border-b px-6 py-4`}>
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xl font-bold text-gray-900">Analysis: {item.sourceFiles.join(', ')}</h4>
                                            <button
                                                onClick={handleExport(item)}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                                            >
                                                Export to PDF
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="p-6 space-y-8">
                                        {/* Investment Memo */}
                                        <div className={`${colorScheme.bg} ${colorScheme.border} border rounded-lg p-6`}>
                                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Investment Memo</h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <span className="text-sm font-medium text-gray-700">Recommendation:</span>
                                                    <div className={`inline-flex items-center ml-2 px-3 py-1 rounded-full text-sm font-medium ${colorScheme.text} ${colorScheme.bg} border ${colorScheme.border}`}>
                                                        {item.investment_memo.investment_recommendation === 'Strong Candidate' && <ArrowTrendingUpIcon className={`h-4 w-4 mr-1 ${colorScheme.icon}`} />}
                                                        {item.investment_memo.investment_recommendation}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-gray-700">Executive Summary:</span>
                                                    <p className="mt-1 text-gray-900">{item.investment_memo.executive_summary}</p>
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-gray-700">Growth Potential:</span>
                                                    <p className="mt-1 text-gray-900">{item.investment_memo.growth_potential}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Visualizations Row */}
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <h5 className="text-sm font-semibold text-gray-900 mb-3">Key Metrics</h5>
                                                <div className="h-48">
                                                    <MetricsChart metrics={item.metrics} />
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <h5 className="text-sm font-semibold text-gray-900 mb-3">SWOT Analysis</h5>
                                                <div className="h-48">
                                                    <SWOTRadarChart swotAnalysis={item.swot_analysis} />
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <h5 className="text-sm font-semibold text-gray-900 mb-3">Risk Distribution</h5>
                                                <div className="h-48">
                                                    <RiskDistributionChart riskFlags={item.risk_flags} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Risk Flags */}
                                        {item.risk_flags && item.risk_flags.length > 0 && (
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                                                <h4 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                                                    <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                                                    Potential Risk Flags
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {item.risk_flags.map((flag, index) => (
                                                        <div key={index} className="flex items-start space-x-2">
                                                            <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                                            <span className="text-red-800 text-sm">{flag}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* SWOT Analysis Detailed */}
                                        <div className="bg-gray-50 rounded-lg p-6">
                                            <h4 className="text-lg font-semibold text-gray-900 mb-4">SWOT Analysis Details</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <div>
                                                        <h5 className="text-sm font-semibold text-green-700 mb-2">Strengths</h5>
                                                        <ul className="space-y-1">
                                                            {item.swot_analysis.strengths.map((s, i) => (
                                                                <li key={i} className="text-sm text-gray-700 flex items-start">
                                                                    <span className="text-green-500 mr-2">•</span>
                                                                    {s}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div>
                                                        <h5 className="text-sm font-semibold text-blue-700 mb-2">Opportunities</h5>
                                                        <ul className="space-y-1">
                                                            {item.swot_analysis.opportunities.map((o, i) => (
                                                                <li key={i} className="text-sm text-gray-700 flex items-start">
                                                                    <span className="text-blue-500 mr-2">•</span>
                                                                    {o}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <h5 className="text-sm font-semibold text-yellow-700 mb-2">Weaknesses</h5>
                                                        <ul className="space-y-1">
                                                            {item.swot_analysis.weaknesses.map((w, i) => (
                                                                <li key={i} className="text-sm text-gray-700 flex items-start">
                                                                    <span className="text-yellow-500 mr-2">•</span>
                                                                    {w}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div>
                                                        <h5 className="text-sm font-semibold text-red-700 mb-2">Threats</h5>
                                                        <ul className="space-y-1">
                                                            {item.swot_analysis.threats.map((t, i) => (
                                                                <li key={i} className="text-sm text-gray-700 flex items-start">
                                                                    <span className="text-red-500 mr-2">•</span>
                                                                    {t}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Benchmarking */}
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                            <h4 className="text-lg font-semibold text-blue-900 mb-3">Benchmarking Summary</h4>
                                            <p className="text-blue-800">{item.benchmarking_summary}</p>
                                        </div>
                                        
                                        {/* Detailed Metrics Table */}
                                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                                <h4 className="text-lg font-semibold text-gray-900">Extracted Metrics</h4>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source / Notes</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {Object.entries(item.metrics).map(([key, metric]) => (
                                                            metric && (
                                                                <tr key={key}>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{key.toUpperCase()}</td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">{formatMetricValue(key, metric.value)}</td>
                                                                    <td className="px-6 py-4 text-sm text-gray-500 italic">
                                                                        {metric.notes || `"${metric.source_quote}"` || 'N/A'}
                                                                    </td>
                                                                </tr>
                                                            )
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                    })}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <div className="text-gray-400 text-6xl mb-4">🔍</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
                    <p className="text-gray-600">Try adjusting your filters to see more analyses</p>
                </div>
            )}
        </div>
    );
};

export default AnalysisDisplay;