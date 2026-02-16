import React, { useMemo } from 'react';
import type { Clause } from '../types';
import { RiskLevel } from '../types';

interface ContractViewerProps {
  contractText: string;
  clauses: Clause[];
  isPrintMode?: boolean;
}

const getHighlightClass = (level: RiskLevel, isPrintMode: boolean): string => {
  if (isPrintMode) {
    switch (level) {
      case RiskLevel.High: return 'bg-red-200 highlight-print';
      case RiskLevel.Medium: return 'bg-amber-200 highlight-print';
      case RiskLevel.Low: return 'bg-green-200 highlight-print';
      default: return '';
    }
  }
  switch (level) {
    case RiskLevel.High:
      return 'bg-red-100/80 hover:bg-red-200/80';
    case RiskLevel.Medium:
      return 'bg-amber-100/80 hover:bg-amber-200/80';
    case RiskLevel.Low:
      return 'bg-green-100/80 hover:bg-green-200/80';
    default:
      return '';
  }
};

interface TextSegment {
    text: string;
    highlight?: {
        level: RiskLevel;
        explanation: string;
    };
}

export const ContractViewer: React.FC<ContractViewerProps> = ({ contractText, clauses, isPrintMode = false }) => {
    
    const segments = useMemo(() => {
        if (!contractText || !clauses || clauses.length === 0) {
            return [{ text: contractText }];
        }

        const matches = clauses
            .map(clause => {
                let startIndex = contractText.indexOf(clause.extracted_text);
                if (startIndex === -1) {
                    // Fallback for minor whitespace/formatting differences from the AI model
                    const simplifiedContract = contractText.replace(/\s+/g, ' ');
                    const simplifiedClause = clause.extracted_text.replace(/\s+/g, ' ');
                    startIndex = simplifiedContract.indexOf(simplifiedClause);
                    if(startIndex === -1) {
                        console.warn(`Could not find clause in contract: "${clause.extracted_text}"`);
                        return null;
                    }
                }
                const endIndex = startIndex + clause.extracted_text.length;
                return {
                    ...clause,
                    startIndex,
                    endIndex,
                };
            })
            .filter((match): match is NonNullable<typeof match> => match !== null);
            
        matches.sort((a, b) => a.startIndex - b.startIndex);

        const finalSegments: TextSegment[] = [];
        let lastIndex = 0;

        for (const match of matches) {
            if (match.startIndex < lastIndex) {
                continue;
            }

            if (match.startIndex > lastIndex) {
                finalSegments.push({
                    text: contractText.substring(lastIndex, match.startIndex),
                });
            }

            finalSegments.push({
                text: contractText.substring(match.startIndex, match.endIndex),
                highlight: {
                    level: match.risk_level,
                    explanation: match.explanation,
                },
            });

            lastIndex = match.endIndex;
        }

        if (lastIndex < contractText.length) {
            finalSegments.push({
                text: contractText.substring(lastIndex),
            });
        }

        return finalSegments.length > 0 ? finalSegments : [{ text: contractText }];
    }, [contractText, clauses]);

    return (
        <div className={`bg-slate-50 p-4 sm:p-6 border border-slate-200 rounded-lg ${!isPrintMode ? 'max-h-[600px] overflow-y-auto' : ''}`}>
            <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-800">
                {segments.map((segment, index) => 
                    segment.highlight ? (
                        <span key={index} 
                              className={`relative rounded px-1 py-0.5 transition-colors duration-200 ${getHighlightClass(segment.highlight.level, isPrintMode)} ${!isPrintMode ? 'cursor-pointer group' : ''}`}
                        >
                            {segment.text}
                            {!isPrintMode && (
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 shadow-lg">
                                    <span className="font-bold block text-amber-400">{segment.highlight.level} Risk:</span>
                                    {segment.highlight.explanation}
                                    <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-slate-900"></span>
                                </span>
                            )}
                        </span>
                    ) : (
                        <span key={index}>{segment.text}</span>
                    )
                )}
            </pre>
        </div>
    );
};