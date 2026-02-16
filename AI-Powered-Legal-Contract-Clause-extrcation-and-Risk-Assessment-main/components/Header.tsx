import React from 'react';
import { ScaleIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-slate-800 shadow-lg">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center">
        <ScaleIcon className="h-9 w-9 text-amber-400 mr-4" />
        <div>
          <h1 className="text-3xl font-bold text-white tracking-wide">AI Legal Contract Analyzer</h1>
          <p className="text-sm text-slate-300">Offline Clause Extraction & Risk Assessment</p>
        </div>
      </div>
    </header>
  );
};