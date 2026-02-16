
export enum RiskLevel {
    Low = 'Low',
    Medium = 'Medium',
    High = 'High',
}

export interface Clause {
    clause_type: string;
    extracted_text: string;
    risk_level: RiskLevel;
    explanation: string;
}

export interface AnalysisResult {
    overall_risk_score: number;
    top_risky_clauses: {
        clause_type: string;
        risk_level: RiskLevel;
    }[];
    clauses: Clause[];
}
