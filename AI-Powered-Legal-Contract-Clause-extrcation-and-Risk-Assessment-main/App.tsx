import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { RiskDashboard } from './components/RiskDashboard';
import { SummaryTable } from './components/SummaryTable';
import { ContractViewer } from './components/ContractViewer';
import { Loader } from './components/Loader';
import { analyzeContract, checkBackend } from './services/localInferenceService';
import type { AnalysisResult } from './types';
import { SAMPLE_CONTRACT } from './constants';

const App: React.FC = () => {
  const [contractText, setContractText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [backendStatus, setBackendStatus] = useState<string>('checking');

  useEffect(() => {
    setIsReady(true);

    // Check backend on mount
    checkBackend().then(result => {
      if (result.ok) {
        setBackendStatus('connected');
        console.log('✓ Backend connected successfully');
      } else {
        setBackendStatus('error');
        console.error('✗ Backend connection failed:', result);
      }
    });
  }, []);

  const handleFileUploaded = useCallback((content: string, name: string) => {
    setContractText(content);
    setFileName(name);
    setAnalysisResult(null);
    setError(null);
    console.log(`File uploaded: ${name} (${content.length} characters)`);
  }, []);

  const handleUseSample = useCallback(() => {
    setContractText(SAMPLE_CONTRACT);
    setFileName('sample_contract.txt');
    setAnalysisResult(null);
    setError(null);
    console.log('Sample contract loaded');
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!contractText) {
      setError('Please upload a contract first.');
      return;
    }

    if (contractText.length < 100) {
      setError('Contract text is too short. Please upload a valid contract.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    const startTime = Date.now();
    console.log('Starting analysis...');

    try {
      const result = await analyzeContract(contractText);
      const elapsed = Date.now() - startTime;

      console.log(`Analysis completed in ${elapsed}ms`);
      console.log('Result:', {
        score: result.overall_risk_score,
        clauses: result.clauses.length
      });

      setAnalysisResult(result);

      // Scroll to results
      setTimeout(() => {
        const resultsElement = document.getElementById('analysis-results');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (e: any) {
      console.error('Analysis error:', e);
      const errorMsg = e?.message || 'Failed to analyze the contract';
      setError(
        `Analysis failed: ${errorMsg}. ` +
        'Please check that the backend server is running on http://127.0.0.1:8001'
      );
    } finally {
      setIsLoading(false);
    }
  }, [contractText]);

  const downloadFile = (data: string, fileName: string, mimeType: string) => {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadReport = (format: 'json' | 'csv') => {
    if (!analysisResult) return;
    const baseFileName = `contract_analysis_${fileName.split('.')[0]}`;

    if (format === 'json') {
      const jsonString = JSON.stringify(analysisResult, null, 2);
      downloadFile(jsonString, `${baseFileName}.json`, 'application/json');
    } else if (format === 'csv') {
      const headers = ['Clause Type', 'Extracted Text', 'Risk Level', 'Explanation'];
      const rows = analysisResult.clauses.map(c =>
        [c.clause_type, `"${c.extracted_text.replace(/"/g, '""')}"`, c.risk_level, `"${c.explanation.replace(/"/g, '""')}"`]
      );
      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      downloadFile(csvContent, `${baseFileName}.csv`, 'text/csv;charset=utf-8;');
    }
  };

  useEffect(() => {
    if (isPrinting) {
      setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 100);
    }
  }, [isPrinting]);

  const handleDownloadAnnotated = () => {
    if (!analysisResult) return;
    setIsPrinting(true);
  };

  if (isPrinting) {
    return (
      <div id="print-area" className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-slate-800">Annotated Contract: {fileName}</h1>
        <ContractViewer
          contractText={contractText}
          clauses={analysisResult?.clauses || []}
          isPrintMode={true}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-100 text-slate-900 font-sans transition-opacity duration-1000 ${isReady ? 'opacity-100' : 'opacity-0'}`}>
      <Header />

      {/* Backend status indicator */}
      {backendStatus === 'error' && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2">
          <div className="container mx-auto">
            <p className="text-red-700 text-sm">
              ⚠️ Cannot connect to backend server. Please ensure it's running: <code className="bg-red-100 px-2 py-1 rounded">uvicorn server.app:app --reload --port 8001</code>
            </p>
          </div>
        </div>
      )}

      <main className="container mx-auto p-4 md:p-8">
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-slate-200 transition-all duration-500">
          <h2 className="text-4xl font-bold text-slate-800 mb-2">Contract Analysis</h2>
          <p className="text-slate-500 mb-6 text-lg">Upload a contract (PDF or TXT) to begin. The AI will extract clauses, assess risks, and provide a detailed report.</p>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <FileUpload onFileUploaded={handleFileUploaded} />
            <span className="text-slate-400">or</span>
            <button
              onClick={handleUseSample}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium transition-all duration-200 transform hover:scale-105"
            >
              Use Sample Contract
            </button>
          </div>

          {fileName && (
            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
              <p>
                <span className="font-semibold">Loaded file:</span> {fileName} ({contractText.length.toLocaleString()} characters)
              </p>
            </div>
          )}
        </div>

        {contractText && (
          <div className="mt-8 text-center">
            <button
              onClick={handleAnalyze}
              disabled={isLoading || backendStatus === 'error'}
              className="bg-slate-800 text-white font-bold py-3 px-10 rounded-lg shadow-lg hover:bg-slate-900 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all transform hover:scale-105 duration-300"
            >
              {isLoading ? 'Analyzing Contract...' : 'Analyze Contract'}
            </button>
            {isLoading && (
              <p className="mt-3 text-slate-500 text-sm">
                This may take 10-30 seconds depending on contract length...
              </p>
            )}
          </div>
        )}

        {isLoading && <Loader />}

        {error && (
          <div className="mt-8 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {analysisResult && (
          <div id="analysis-results" className="mt-12 space-y-12 animate-fade-in">
            <div>
              <RiskDashboard
                result={analysisResult}
                onDownloadJson={() => handleDownloadReport('json')}
                onDownloadCsv={() => handleDownloadReport('csv')}
                onDownloadAnnotated={handleDownloadAnnotated}
              />
            </div>
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-slate-200">
              <h2 className="text-3xl font-bold text-slate-800 mb-4">Clause Summary</h2>
              <SummaryTable clauses={analysisResult.clauses} />
            </div>
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-slate-200">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">Interactive Contract View</h2>
              <p className="text-slate-500 mb-6">Hover over highlighted clauses to see the AI's explanation.</p>
              <ContractViewer contractText={contractText} clauses={analysisResult.clauses} />
            </div>
          </div>
        )}
      </main>
      <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.7s ease-out forwards;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default App;