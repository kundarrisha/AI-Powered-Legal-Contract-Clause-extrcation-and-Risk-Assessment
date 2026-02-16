import React, { useState, useRef, useEffect } from 'react';
import type { AnalysisResult } from '../types';
import { RiskLevel } from '../types';
import { DownloadIcon, AlertTriangleIcon, CheckCircleIcon, AlertCircleIcon, ChevronDownIcon } from './icons';

interface RiskDashboardProps {
  result: AnalysisResult;
  onDownloadJson: () => void;
  onDownloadCsv: () => void;
  onDownloadAnnotated: () => void;
}

const getRiskColor = (score: number): string => {
  if (score >= 67) return 'text-red-600';
  if (score >= 34) return 'text-amber-600';
  return 'text-green-600';
};

const getRiskRingColor = (score: number): string => {
  if (score >= 67) return 'stroke-red-500';
  if (score >= 34) return 'stroke-amber-500';
  return 'stroke-green-500';
};

const RiskBadge: React.FC<{ level: RiskLevel }> = ({ level }) => {
  const styles = {
    [RiskLevel.High]: 'bg-red-100 text-red-800 border border-red-200',
    [RiskLevel.Medium]: 'bg-amber-100 text-amber-800 border border-amber-200',
    [RiskLevel.Low]: 'bg-green-100 text-green-800 border border-green-200',
  };
  const icons = {
    [RiskLevel.High]: <AlertTriangleIcon className="w-4 h-4 mr-1.5" />,
    [RiskLevel.Medium]: <AlertCircleIcon className="w-4 h-4 mr-1.5" />,
    [RiskLevel.Low]: <CheckCircleIcon className="w-4 h-4 mr-1.5" />,
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[level]}`}>
      {icons[level]}
      {level}
    </span>
  );
};

export const RiskDashboard: React.FC<RiskDashboardProps> = ({ result, onDownloadJson, onDownloadCsv, onDownloadAnnotated }) => {
  const score = result.overall_risk_score;
  const circumference = 2 * Math.PI * 56; // 2 * pi * r
  const offset = circumference - (score / 100) * circumference;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
            <h2 className="text-3xl font-bold text-slate-800">Overall Risk Assessment</h2>
            <div className="relative" ref={dropdownRef}>
              <button 
                  onClick={() => setIsDropdownOpen(prev => !prev)}
                  className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all duration-200 text-sm font-semibold"
              >
                  <DownloadIcon className="w-4 h-4 mr-2" />
                  Download Report
                  <ChevronDownIcon className={`w-4 h-4 ml-1 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-slate-200 z-10">
                  <div className="py-1">
                    <a href="#" onClick={(e) => { e.preventDefault(); onDownloadJson(); setIsDropdownOpen(false); }} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">JSON Report</a>
                    <a href="#" onClick={(e) => { e.preventDefault(); onDownloadCsv(); setIsDropdownOpen(false); }} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">CSV Summary</a>
                    <a href="#" onClick={(e) => { e.preventDefault(); onDownloadAnnotated(); setIsDropdownOpen(false); }} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Annotated Contract (PDF)</a>
                  </div>
                </div>
              )}
            </div>
        </div>
      
      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
        <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
          <svg className="absolute w-full h-full" viewBox="0 0 120 120">
            <circle
              className="stroke-slate-200"
              strokeWidth="10"
              fill="transparent"
              r="56"
              cx="60"
              cy="60"
            />
            <circle
              className={`${getRiskRingColor(score)}`}
              strokeWidth="10"
              strokeLinecap="round"
              fill="transparent"
              r="56"
              cx="60"
              cy="60"
              strokeDasharray={circumference}
              strokeDashoffset={circumference}
              transform="rotate(-90 60 60)"
            >
                <animate 
                    attributeName="stroke-dashoffset" 
                    from={circumference} 
                    to={offset} 
                    dur="1.5s" 
                    fill="freeze"
                    begin="0.2s"
                    keySplines="0.23 1 0.32 1"
                    calcMode="spline"
                />
            </circle>

          </svg>
          <div className="text-center">
            <span className={`text-5xl font-bold ${getRiskColor(score)}`}>{score}</span>
            <span className="block text-slate-500 text-lg font-medium">/ 100</span>
          </div>
        </div>
        <div className="flex-1 w-full">
          <h3 className="text-xl font-bold text-slate-700 mb-3">Top Risk Factors</h3>
          <p className="text-slate-500 mb-4">The overall score is primarily influenced by the following clauses:</p>
          <div className="space-y-3">
            {result.top_risky_clauses.map((clause, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-semibold text-slate-800">{clause.clause_type}</span>
                <RiskBadge level={clause.risk_level} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};