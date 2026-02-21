'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { History, Book, FileText, ChevronRight, Clock, Trash2 } from 'lucide-react';

interface HistoryItem {
  id: string;
  name: string;
  type: 'epub' | 'pdf';
  lastRead: number;
  progress: number;
}

export default function HistoryView() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('arquivos_templo_recent_books');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const timer = setTimeout(() => {
          setHistory(parsed);
        }, 0);
        return () => clearTimeout(timer);
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  const clearHistory = () => {
    if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
      setHistory([]);
      localStorage.removeItem('arquivos_templo_recent_books');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-4xl font-display font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-4">
              <History className="text-blue-500" size={36} />
              Histórico
            </h2>
            <p className="text-zinc-500 text-lg">
              Veja tudo o que você leu recentemente.
            </p>
          </div>
          {history.length > 0 && (
            <button 
              onClick={clearHistory}
              className="flex items-center gap-2 px-4 py-2 text-zinc-500 hover:text-red-400 transition-colors text-sm font-bold"
            >
              <Trash2 size={18} />
              Limpar Tudo
            </button>
          )}
        </div>

        {history.length > 0 ? (
          <div className="space-y-4">
            {history.map((item, i) => (
              <motion.div
                key={item.id || i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group flex items-center gap-6 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-4 hover:bg-white dark:hover:bg-zinc-900 hover:border-blue-500/30 transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  item.type === 'epub' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                }`}>
                  {item.type === 'epub' ? <Book size={24} /> : <FileText size={24} />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-zinc-900 dark:text-white truncate">{item.name}</h4>
                  <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-bold text-zinc-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(item.lastRead).toLocaleDateString()}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span>{item.type}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Progresso</p>
                    <p className="text-sm font-mono text-blue-500">{item.progress || 0}%</p>
                  </div>
                  <ChevronRight size={20} className="text-zinc-700 group-hover:text-blue-500 transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="h-64 rounded-3xl border-2 border-dashed border-zinc-900 flex flex-col items-center justify-center gap-4 text-zinc-600">
            <History size={48} className="opacity-20" />
            <p className="font-medium">Nenhum histórico de leitura encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
