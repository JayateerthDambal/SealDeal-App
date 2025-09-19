// NEW: Define the structure for a user's profile data
export interface UserProfile {
    uid: string;
    email: string;
    role: 'analyst' | 'partner' | 'admin' | 'benchmarking_admin';
}

export interface Deal {
  id: string;
  dealName: string;
  status: '1_AwaitingUpload' | '2_Processing' | '4_Analyzed' | 'Error_Processing_Failed' | 'Error_Analysis_Failed';
  ownerId: string;
  createdAt: Date;
}

export interface Metric {
  value: number | null;
  source_quote: string | null;
  notes: string | null;
}

export interface InvestmentMemo {
  executive_summary: string;
  growth_potential: string;
  investment_recommendation: 'Strong Candidate' | 'Proceed with Caution' | 'Further Diligence Required' | 'Pass';
}

export interface SWOTAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface Analysis {
  id: string;
  dealId: string;
  analyzedAt: Date;
  sourceFiles: string[];
  metrics: {
    arr: Metric;
    mrr: Metric;
    cac: Metric;
    ltv: Metric;
    ltv_cac_ratio: Metric;
    gross_margin: Metric;
  };
  swot_analysis: SWOTAnalysis;
  risk_flags: string[];
  benchmarking_summary: string;
  investment_memo: InvestmentMemo;
}

