'use client';

import React, { useEffect, useRef, useState } from 'react';
import ePub, { Rendition, Book } from 'epubjs';
import { 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  Type, 
  Search,
  Bookmark,
  List
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EpubReaderProps {
  file: File;
}

export default function EpubReader({ file }: EpubReaderProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<Book | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [toc, setToc] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [fontSize, setFontSize] = useState(100);

  useEffect(() => {
    if (!viewerRef.current || !file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = e.target?.result;
      if (!data) return;

      const book = ePub(data as ArrayBuffer);
      bookRef.current = book;

      const rendition = book.renderTo(viewerRef.current!, {
        width: '100%',
        height: '100%',
        flow: 'paginated',
        manager: 'framed',
      });

      renditionRef.current = rendition;

      // Register themes before displaying
      rendition.themes.register('dark', {
        body: {
          background: 'transparent !important',
          color: '#e4e4e7 !important',
          'font-family': 'var(--font-sans) !important',
          'line-height': '1.6 !important',
        }
      });

      rendition.themes.select('dark');
      
      // Wait for book to be ready before displaying
      await book.ready;
      
      const displayed = rendition.display();
      
      displayed.then(() => {
        setIsLoaded(true);
      });

      book.loaded.navigation.then((nav) => {
        setToc(nav.toc);
      });

      rendition.on('relocated', (location: any) => {
        setCurrentLocation(location);
      });
    };

    reader.readAsArrayBuffer(file);

    return () => {
      if (bookRef.current) {
        bookRef.current.destroy();
      }
    };
  }, [file]);

  const prevPage = () => {
    if (renditionRef.current) renditionRef.current.prev();
  };
  const nextPage = () => {
    if (renditionRef.current) renditionRef.current.next();
  };

  const goToChapter = (href: string) => {
    if (renditionRef.current) {
      renditionRef.current.display(href);
      setIsTocOpen(false);
    }
  };

  const changeFontSize = (delta: number) => {
    if (renditionRef.current) {
      const newSize = Math.max(80, Math.min(150, fontSize + delta));
      setFontSize(newSize);
      renditionRef.current.themes.fontSize(`${newSize}%`);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative bg-zinc-950 overflow-hidden">
      {/* Reader Controls */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 p-1.5 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl">
        <button 
          onClick={() => setIsTocOpen(!isTocOpen)}
          className={`p-2 rounded-xl transition-colors ${isTocOpen ? 'bg-blue-600 text-white' : 'hover:bg-zinc-800 text-zinc-400'}`}
          title="Sumário"
        >
          <List size={20} />
        </button>
        <div className="w-px h-6 bg-zinc-800 mx-1" />
        <button 
          onClick={() => changeFontSize(-10)}
          className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 transition-colors"
          title="Diminuir Fonte"
        >
          <Type size={16} />
        </button>
        <span className="text-xs font-mono text-zinc-500 w-10 text-center">{fontSize}%</span>
        <button 
          onClick={() => changeFontSize(10)}
          className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 transition-colors"
          title="Aumentar Fonte"
        >
          <Type size={22} />
        </button>
        <div className="w-px h-6 bg-zinc-800 mx-1" />
        <button className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 transition-colors">
          <Bookmark size={20} />
        </button>
      </div>

      {/* Main Viewer */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 lg:p-12">
        <div className="w-full max-w-4xl h-full bg-zinc-900/20 rounded-3xl border border-zinc-800/50 shadow-inner overflow-hidden relative group">
          <div ref={viewerRef} className="w-full h-full" />
          
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-zinc-500 text-sm font-medium animate-pulse">Carregando páginas...</p>
              </div>
            </div>
          )}

          {/* Navigation Overlays */}
          <button 
            onClick={prevPage}
            className="absolute left-0 top-0 bottom-0 w-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-zinc-950/50 to-transparent text-white"
          >
            <div className="w-12 h-12 rounded-full bg-zinc-900/80 backdrop-blur-md flex items-center justify-center border border-zinc-800 shadow-xl">
              <ChevronLeft size={24} />
            </div>
          </button>
          <button 
            onClick={nextPage}
            className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-zinc-950/50 to-transparent text-white"
          >
            <div className="w-12 h-12 rounded-full bg-zinc-900/80 backdrop-blur-md flex items-center justify-center border border-zinc-800 shadow-xl">
              <ChevronRight size={24} />
            </div>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-12 px-8 flex items-center gap-4 bg-zinc-950/50 backdrop-blur-sm border-t border-zinc-900">
        <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${currentLocation?.start?.percentage * 100 || 0}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-zinc-500 whitespace-nowrap">
          {Math.round(currentLocation?.start?.percentage * 100 || 0)}% CONCLUÍDO
        </span>
      </div>

      {/* Table of Contents Sidebar */}
      <AnimatePresence>
        {isTocOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTocOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              className="absolute top-0 left-0 bottom-0 w-80 bg-zinc-900 border-r border-zinc-800 z-[70] flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="font-display font-bold text-lg text-white">Sumário</h3>
                <button onClick={() => setIsTocOpen(false)} className="text-zinc-500 hover:text-white">
                  <ChevronLeft size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {toc.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => goToChapter(item.href)}
                    className="w-full text-left p-3 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-blue-400 transition-all text-sm font-medium flex items-center gap-3 group"
                  >
                    <span className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-600 group-hover:bg-blue-600/20 group-hover:text-blue-400 transition-colors">
                      {index + 1}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
