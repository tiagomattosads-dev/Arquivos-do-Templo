'use client';

import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Search,
  Layout
} from 'lucide-react';
import { motion } from 'motion/react';

// Set worker URL for pdfjs - using a more reliable CDN link for the worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

interface PdfReaderProps {
  file: File;
}

export default function PdfReader({ file }: PdfReaderProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoaded, setIsLoaded] = useState(false);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoaded(true);
  }

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => Math.min(Math.max(1, prevPageNumber + offset), numPages));
  };

  const changeScale = (delta: number) => {
    setScale(prevScale => Math.min(Math.max(0.5, prevScale + delta), 2.5));
  };

  return (
    <div className="flex-1 flex flex-col relative bg-zinc-950 overflow-hidden">
      {/* Reader Controls */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 p-1.5 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-1 px-2">
          <button 
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-xs font-mono text-zinc-400 min-w-[80px] text-center">
            {pageNumber} <span className="text-zinc-600">/</span> {numPages}
          </span>
          <button 
            onClick={() => changePage(1)}
            disabled={pageNumber >= numPages}
            className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        
        <div className="w-px h-6 bg-zinc-800 mx-1" />
        
        <div className="flex items-center gap-1 px-2">
          <button 
            onClick={() => changeScale(-0.1)}
            className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 transition-colors"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-xs font-mono text-zinc-500 w-12 text-center">{Math.round(scale * 100)}%</span>
          <button 
            onClick={() => changeScale(0.1)}
            className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 transition-colors"
          >
            <ZoomIn size={18} />
          </button>
        </div>

        <div className="w-px h-6 bg-zinc-800 mx-1" />
        
        <button className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 transition-colors">
          <Maximize2 size={18} />
        </button>
      </div>

      {/* Main Viewer */}
      <div className="flex-1 overflow-auto p-4 md:p-8 lg:p-12 flex justify-center scroll-smooth custom-scrollbar">
        <div className="relative shadow-2xl shadow-black/50 rounded-lg overflow-hidden bg-white">
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="w-[600px] h-[800px] flex items-center justify-center bg-zinc-900">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                  <p className="text-zinc-500 text-sm font-medium">Renderizando PDF...</p>
                </div>
              </div>
            }
          >
            <Page 
              pageNumber={pageNumber} 
              scale={scale}
              renderAnnotationLayer={false}
              renderTextLayer={true}
              className="max-w-full"
            />
          </Document>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-12 px-8 flex items-center gap-4 bg-zinc-950/50 backdrop-blur-sm border-t border-zinc-900">
        <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${(pageNumber / numPages) * 100}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-zinc-500 whitespace-nowrap uppercase tracking-widest">
          Página {pageNumber} de {numPages}
        </span>
      </div>
    </div>
  );
}
