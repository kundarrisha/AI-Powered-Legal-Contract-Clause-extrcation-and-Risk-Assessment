
import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center my-16" aria-label="Analyzing contract">
        <div className="w-full max-w-md">
            <p className="text-center text-lg font-semibold text-slate-600 mb-4">AI is analyzing the contract...</p>
            <div className="relative w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="absolute h-full bg-slate-800 w-1/2 animate-scan"></div>
            </div>
        </div>
        {/* Fix: Removed the non-standard 'jsx' prop from the <style> tag to fix a TypeScript compilation error. */}
        <style>{`
            @keyframes scan {
                0% {
                    transform: translateX(-100%);
                }
                100% {
                    transform: translateX(200%);
                }
            }
            .animate-scan {
                animation: scan 2s infinite ease-in-out;
            }
        `}</style>
    </div>
  );
};