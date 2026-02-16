import type { AnalysisResult, Clause } from '../types';
import { RiskLevel } from '../types';

// Base URL of your FastAPI backend
const SERVER_BASE = (import.meta && (import.meta as any).env && (import.meta as any).env.VITE_BACKEND_URL)
    || 'http://127.0.0.1:8001';

/**
 * Encode a string to Base64 (browser + Node compatible)
 */
function toBase64(str: string): string {
    if (typeof window !== 'undefined' && window.btoa) {
        try {
            return btoa(unescape(encodeURIComponent(str)));
        } catch {
            // Fallback for special characters
            const encoder = new TextEncoder();
            const data = encoder.encode(str);
            let binary = '';
            for (let i = 0; i < data.length; i++) {
                binary += String.fromCharCode(data[i]);
            }
            return btoa(binary);
        }
    } else {
        // Node.js environment
        return Buffer.from(str, 'utf-8').toString('base64');
    }
}

/**
 * Map the server's clause object to client-friendly Clause type
 */
function mapServerClauseToClient(c: any): Clause {
    const riskStr = (c.riskLevel || c.risk_level || 'Low').toString().toLowerCase();

    let risk: RiskLevel;
    if (riskStr.includes('high') || riskStr.startsWith('h')) {
        risk = RiskLevel.High;
    } else if (riskStr.includes('medium') || riskStr.includes('med') || riskStr.startsWith('m')) {
        risk = RiskLevel.Medium;
    } else {
        risk = RiskLevel.Low;
    }

    return {
        clause_type: c.clauseType || c.clause_type || 'General',
        extracted_text: c.clauseText || c.extracted_text || '',
        risk_level: risk,
        explanation: c.justification || c.explanation || 'No explanation provided',
    };
}

/**
 * Send contract text to backend for analysis
 */
export const analyzeContract = async (contractText: string): Promise<AnalysisResult> => {
    console.log(`Sending ${contractText.length} characters to backend for analysis...`);

    // Payload must match the server's Pydantic FileContent model
    const payload = {
        inlineData: {
            data: toBase64(contractText),
            mimeType: 'text/plain',
        },
    };

    const startTime = Date.now();

    try {
        const resp = await fetch(`${SERVER_BASE}/analyze/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const elapsed = Date.now() - startTime;
        console.log(`Analysis request completed in ${elapsed}ms with status ${resp.status}`);

        if (!resp.ok) {
            let errorText = '';
            try {
                errorText = await resp.text();
            } catch {
                errorText = 'Unknown error';
            }
            console.error('Server error response:', errorText);
            throw new Error(`Server error: ${resp.status} ${resp.statusText} - ${errorText}`);
        }

        const data = await resp.json();
        console.log('Received analysis result:', {
            score: data.overallRiskScore,
            clauseCount: data.clauses?.length || 0
        });

        // Map server clauses to client-side
        const clauses = (data.clauses || []).map(mapServerClauseToClient);

        // Validate we have clauses
        if (clauses.length === 0) {
            throw new Error('No clauses were extracted from the contract');
        }

        // Rank clauses by risk for top risky clauses
        const rank = (r: RiskLevel) => {
            switch (r) {
                case RiskLevel.High: return 3;
                case RiskLevel.Medium: return 2;
                case RiskLevel.Low: return 1;
                default: return 0;
            }
        };

        const sorted = [...clauses].sort((a, b) => rank(b.risk_level) - rank(a.risk_level));
        const top_risky_clauses = sorted.slice(0, 5).map(c => ({
            clause_type: c.clause_type,
            risk_level: c.risk_level,
        }));

        // Calculate risk score if not provided or is 0
        let overallRiskScore = typeof data.overallRiskScore === 'number'
            ? data.overallRiskScore
            : Number(data.overallRiskScore || 0);

        // If score is 0 or very low, recalculate from clauses
        if (overallRiskScore < 1) {
            const highCount = clauses.filter(c => c.risk_level === RiskLevel.High).length;
            const medCount = clauses.filter(c => c.risk_level === RiskLevel.Medium).length;
            const total = clauses.length;

            overallRiskScore = Math.round(((highCount * 1.0 + medCount * 0.5) / total) * 100 * 10) / 10;
            console.log('Recalculated risk score:', overallRiskScore);
        }

        const result: AnalysisResult = {
            overall_risk_score: overallRiskScore,
            top_risky_clauses,
            clauses,
        };

        console.log('Final analysis result:', {
            score: result.overall_risk_score,
            topRiskyCount: result.top_risky_clauses.length,
            totalClauses: result.clauses.length,
            highRisk: clauses.filter(c => c.risk_level === RiskLevel.High).length,
            mediumRisk: clauses.filter(c => c.risk_level === RiskLevel.Medium).length,
            lowRisk: clauses.filter(c => c.risk_level === RiskLevel.Low).length,
        });

        return result;
    } catch (error: any) {
        console.error('Analysis error:', error);
        throw new Error(error?.message || 'Failed to analyze contract');
    }
};

/**
 * Simple health-check helper
 */
export const checkBackend = async () => {
    try {
        const resp = await fetch(`${SERVER_BASE}/health/`, {
            method: 'GET',
        });

        if (!resp.ok) {
            return {
                ok: false,
                status: resp.status,
                text: await resp.text()
            };
        }

        const data = await resp.json();
        console.log('Backend health check:', data);

        return { ok: true, data };
    } catch (e: any) {
        console.error('Backend health check failed:', e);
        return {
            ok: false,
            error: e?.message || String(e)
        };
    }
};