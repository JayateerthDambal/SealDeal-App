export interface AnalysisData {
    id: string;
    metrics: {
        arr?: { value: number | null; source_quote: string | null; notes: string | null };
        mrr?: { value: number | null; source_quote: string | null; notes: string | null };
        cac?: { value: number | null; source_quote: string | null; notes: string | null };
        ltv?: { value: number | null; source_quote: string | null; notes: string | null };
        ltv_cac_ratio?: { value: number | null; source_quote: string | null; notes: string | null };
        gross_margin?: { value: number | null; source_quote: string | null; notes: string | null };
    };
    swot_analysis: {
        strengths: string[];
        weaknesses: string[];
        opportunities: string[];
        threats: string[];
    };
    risk_flags: string[];
    benchmarking_summary: string;
    investment_memo: {
        executive_summary: string;
        growth_potential: string;
        investment_recommendation: string;
    };
    sourceFiles: string[];
    analyzedAt: any;
}

export interface BenchmarkData {
    industry: string;
    stage: string;
    arr: number;
    mrr?: number;
    cac?: number;
    ltv?: number;
}

// NEW: Define the structure for a user's profile data
export interface UserProfile {
    uid: string;
    email: string;
    role: 'analyst' | 'partner' | 'admin';
}

