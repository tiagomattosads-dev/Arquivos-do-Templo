'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { History, Book, FileText, ChevronRight, Clock, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';
import ConfirmModal from './ConfirmModal';

interface HistoryItem {
  id: string;
  title: string;
  file_type: 'epub' | 'pdf';
  created_at: string;
  progress: number;
}

interface HistoryViewProps {
  onOpenBook: (book: any) => void;
}

export default function HistoryView({ onOpenBook }: HistoryViewProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { showToast } = useToast();

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      console.error('Error fetching history:', error);
      showToast('Erro ao carregar histórico.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const clearHistory = async () => {
    // In a real app, we might have a separate history table
    // For now, we'll just show a toast as we don't want to delete the books themselves
    showToast('Funcionalidade de limpar histórico em desenvolvimento.', 'info');
    setIsConfirmOpen(false);
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-12">
      <ConfirmModal 
        isOpen={isConfirmOpen}
        title="Limpar Histórico"
        message="Tem certeza que deseja limpar todo o seu histórico de leitura? Esta ação não pode ser desfeita."
        onConfirm={clearHistory}
        onCancel={() => setIsConfirmOpen(false)}
        confirmText="Limpar Histórico"
      />
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
              onClick={() => setIsConfirmOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-zinc-500 hover:text-red-400 transition-colors text-sm font-bold"
            >
              <Trash2 size={18} />
              Limpar Tudo
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-zinc-900 rounded-2xl animate-pulse border border-zinc-800" />
            ))}
          </div>
        ) : history.length > 0 ? (
          <div className="space-y-4">
            {history.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => onOpenBook(item)}
                className="group flex items-center gap-6 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-4 hover:bg-white dark:hover:bg-zinc-900 hover:border-blue-500/30 transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="w-12 h-16 rounded-lg overflow-hidden bg-zinc-800 shrink-0 shadow-lg">
                  <img 
                    src={`https://picsum.photos/seed/${item.title}/100/150`}
                    alt={item.title}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-zinc-900 dark:text-white truncate">{item.title}</h4>
                  <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-bold text-zinc-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span>{item.file_type}</span>
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
