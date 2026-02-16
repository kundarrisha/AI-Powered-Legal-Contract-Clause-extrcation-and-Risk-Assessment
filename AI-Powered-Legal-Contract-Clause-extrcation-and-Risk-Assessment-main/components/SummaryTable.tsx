import React, { useState, useMemo } from 'react';
import type { Clause } from '../types';
import { RiskLevel } from '../types';
import { AlertTriangleIcon, CheckCircleIcon, AlertCircleIcon, SearchIcon } from './icons';

interface SummaryTableProps {
  clauses: Clause[];
}

const RiskCell: React.FC<{ level: RiskLevel }> = ({ level }) => {
    const styles = {
        [RiskLevel.High]: 'bg-red-100 text-red-800 border border-red-200',
        [RiskLevel.Medium]: 'bg-amber-100 text-amber-800 border border-amber-200',
        [RiskLevel.Low]: 'bg-green-100 text-green-800 border border-green-200',
    };
    const icons = {
        [RiskLevel.High]: <AlertTriangleIcon className="w-4 h-4 mr-1.5"/>,
        [RiskLevel.Medium]: <AlertCircleIcon className="w-4 h-4 mr-1.5"/>,
        [RiskLevel.Low]: <CheckCircleIcon className="w-4 h-4 mr-1.5"/>,
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[level]}`}>
            {icons[level]}
            {level}
        </span>
    );
};


export const SummaryTable: React.FC<SummaryTableProps> = ({ clauses }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClauses = useMemo(() => {
    if (!searchTerm) return clauses;
    return clauses.filter(
      (clause) =>
        clause.clause_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clause.extracted_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clause.explanation.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clauses, searchTerm]);

  return (
    <div className="space-y-4">
        <div className="relative">
            <input
                type="text"
                placeholder="Search clauses by type, text, or rationale..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-lg pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-slate-400" />
            </div>
        </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Clause Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Extracted Text Snippet
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Risk Level
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                AI Rationale
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredClauses.map((clause, index) => (
              <tr key={index} className="hover:bg-slate-50 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{clause.clause_type}</td>
                <td className="px-6 py-4 whitespace-normal text-sm text-slate-600 max-w-md">
                    <p className="line-clamp-2 hover:line-clamp-none">"{clause.extracted_text}"</p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <RiskCell level={clause.risk_level} />
                </td>
                <td className="px-6 py-4 whitespace-normal text-sm text-slate-600">{clause.explanation}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredClauses.length === 0 && (
            <div className="text-center py-12 text-slate-500 bg-white">
                <p className="font-semibold">No matching clauses found.</p>
                <p className="text-sm">Try adjusting your search term.</p>
            </div>
        )}
      </div>
    </div>
  );
};