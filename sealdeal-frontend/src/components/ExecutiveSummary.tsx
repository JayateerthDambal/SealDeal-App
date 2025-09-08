import React from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { type AnalysisData } from '../types';

interface ExecutiveSummaryProps {
    analysis: AnalysisData[];
    dealName: string;
}

const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ analysis, dealName }) => {
    if (analysis.length === 0) return null;

    const latestAnalysis = analysis[0]; // Most recent analysis
    const recommendation = latestAnalysis.investment_memo.investment_recommendation;
    const metrics = latestAnalysis.metrics;

    const getRecommendationStyle = () => {
        switch (recommendation) {
            case 'Strong Candidate':
                return {
                    bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
                    border: 'border-green-200',
                    text: 'text-green-800',
                    icon: ArrowTrendingUpIcon,
                    iconColor: 'text-green-600'
                };
            case 'Proceed with Caution':
                return {
                    bg: 'bg-gradient-to-r from-yellow-50 to-amber-50',
                    border: 'border-yellow-200',
                    text: 'text-yellow-800',
                    icon: ExclamationTriangleIcon,
                    iconColor: 'text-yellow-600'
                };
            case 'Further Diligence Required':
                return {
                    bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
                    border: 'border-blue-200',
                    text: 'text-blue-800',
                    icon: ExclamationTriangleIcon,
                    iconColor: 'text-blue-600'
                };
            case 'Pass':
                return {
                    bg: 'bg-gradient-to-r from-red-50 to-rose-50',
                    border: 'border-red-200',
                    text: 'text-red-800',
                    icon: ArrowTrendingDownIcon,
                    iconColor: 'text-red-600'
                };
            default:
                return {
                    bg: 'bg-gray-50',
                    border: 'border-gray-200',
                    text: 'text-gray-800',
                    icon: CheckCircleIcon,
                    iconColor: 'text-gray-600'
                };
        }
    };

    const style = getRecommendationStyle();
    const IconComponent = style.icon;

    const formatCurrency = (value: number | null) => {
        if (!value) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            notation: 'compact',
            maximumFractionDigits: 1
        }).format(value);
    };

    const getHealthScore = () => {
        let score = 50; // Base score
        
        // ARR contribution
        if (metrics.arr?.value) {
            if (metrics.arr.value > 1000000) score += 20;
            else if (metrics.arr.value > 500000) score += 15;
            else if (metrics.arr.value > 100000) score += 10;
        }
        
        // LTV/CAC ratio contribution
        if (metrics.ltv_cac_ratio?.value) {
            if (metrics.ltv_cac_ratio.value > 3) score += 20;
            else if (metrics.ltv_cac_ratio.value > 2) score += 10;
            else score -= 10;
        }
        
        // Risk flags penalty
        if (latestAnalysis.risk_flags?.length) {
            score -= latestAnalysis.risk_flags.length * 5;
        }
        
        // Strengths bonus
        if (latestAnalysis.swot_analysis.strengths.length > 3) {
            score += 10;
        }
        
        return Math.min(100, Math.max(0, score));
    };

    const healthScore = getHealthScore();
    const getHealthColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-100';
        if (score >= 60) return 'text-blue-600 bg-blue-100';
        if (score >= 40) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-8">
            {/* Header */}
            <div className={`${style.bg} ${style.border} border-b px-8 py-6`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className={`h-12 w-12 ${style.bg} rounded-xl flex items-center justify-center border ${style.border}`}>
                            <IconComponent className={`h-6 w-6 ${style.iconColor}`} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{dealName}</h2>
                            <p className="text-gray-600 mt-1">Executive Investment Summary</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${style.text} ${style.bg} border ${style.border}`}>
                            <IconComponent className={`h-4 w-4 mr-2 ${style.iconColor}`} />
                            {recommendation}
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Metrics Row */}
            <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">
                            {formatCurrency(metrics.arr?.value || null)}
                        </div>
                        <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mt-1">
                            Annual Recurring Revenue
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">
                            {metrics.ltv_cac_ratio?.value ? `${metrics.ltv_cac_ratio.value.toFixed(1)}x` : 'N/A'}
                        </div>
                        <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mt-1">
                            LTV / CAC Ratio
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">
                            {formatCurrency(metrics.ltv?.value || null)}
                        </div>
                        <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mt-1">
                            Customer Lifetime Value
                        </div>
                    </div>
                    <div className="text-center">
                        <div className={`text-3xl font-bold ${getHealthColor(healthScore).split(' ')[0]}`}>
                            {healthScore}%
                        </div>
                        <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mt-1">
                            Investment Health Score
                        </div>
                    </div>
                </div>
            </div>

            {/* Executive Summary Content */}
            <div className="px-8 py-6 space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Executive Summary</h3>
                    <p className="text-gray-700 leading-relaxed text-lg">
                        {latestAnalysis.investment_memo.executive_summary}
                    </p>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Growth Potential</h3>
                    <p className="text-gray-700 leading-relaxed">
                        {latestAnalysis.investment_memo.growth_potential}
                    </p>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Market Position</h3>
                    <p className="text-gray-700 leading-relaxed">
                        {latestAnalysis.benchmarking_summary}
                    </p>
                </div>

                {/* Risk Overview */}
                {latestAnalysis.risk_flags && latestAnalysis.risk_flags.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center">
                            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                            Key Risk Areas ({latestAnalysis.risk_flags.length} identified)
                        </h3>
                        <div className="space-y-2">
                            {latestAnalysis.risk_flags.slice(0, 3).map((risk, index) => (
                                <div key={index} className="flex items-start space-x-2">
                                    <div className="h-1.5 w-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <p className="text-red-800 text-sm">{risk}</p>
                                </div>
                            ))}
                            {latestAnalysis.risk_flags.length > 3 && (
                                <p className="text-red-700 text-sm italic">
                                    +{latestAnalysis.risk_flags.length - 3} additional risk factors identified in detailed analysis
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Key Strengths */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Key Competitive Strengths
                    </h3>
                    <div className="space-y-2">
                        {latestAnalysis.swot_analysis.strengths.slice(0, 3).map((strength, index) => (
                            <div key={index} className="flex items-start space-x-2">
                                <div className="h-1.5 w-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                <p className="text-green-800 text-sm">{strength}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExecutiveSummary;