import React, { useCallback, useState } from 'react';
import { UploadIcon } from './icons';

// Make pdfjsLib available in the scope
declare const pdfjsLib: any;

interface FileUploadProps {
  onFileUploaded: (content: string, name: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded }) => {
  const [error, setError] = useState<string | null>(null);
  
  const handlePdfExtraction = async (file: File) => {
    try {
      if (typeof pdfjsLib === 'undefined') {
        throw new Error('PDF.js library is not loaded.');
      }
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.min.mjs`;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n\n';
          }
          onFileUploaded(fullText, file.name);
          setError(null);
        } catch (pdfError) {
          console.error('Error processing PDF:', pdfError);
          setError('Failed to read the PDF file. It might be corrupted or protected.');
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error(err);
      setError('Failed to initialize PDF reader.');
    }
  };


  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        if (file.type === 'application/pdf') {
          handlePdfExtraction(file);
        } else if (file.type === 'text/plain') {
          const reader = new FileReader();
          reader.onload = (e) => {
            const text = e.target?.result as string;
            onFileUploaded(text, file.name);
            setError(null);
          };
          reader.readAsText(file);
        } else {
            setError('Unsupported file type. Please upload a .txt or .pdf file.');
        }
      }
    },
    [onFileUploaded]
  );

  return (
    <div className="w-full max-w-sm">
        <label htmlFor="file-upload" className="cursor-pointer flex items-center justify-center w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 hover:border-slate-400 transition duration-200 font-semibold">
            <UploadIcon className="w-6 h-6 mr-3 text-slate-500"/>
            <span>Upload Contract (.pdf, .txt)</span>
        </label>
      <input
        id="file-upload"
        type="file"
        accept=".txt,.pdf"
        onChange={handleFileChange}
        className="hidden"
      />
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  );
};