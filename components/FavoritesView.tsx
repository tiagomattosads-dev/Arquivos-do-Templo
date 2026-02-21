'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, Book, FileText, ChevronRight, Clock } from 'lucide-react';

interface FavoriteBook {
  id: string;
  name: string;
  type: 'epub' | 'pdf';
  addedAt: number;
}

export default function FavoritesView() {
  const [favorites, setFavorites] = useState<FavoriteBook[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('arquivos_templo_favorites');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const timer = setTimeout(() => {
          setFavorites(parsed);
        }, 0);
        return () => clearTimeout(timer);
      } catch (e) {
        console.error('Failed to parse favorites', e);
      }
    }
  }, []);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="space-y-1">
          <h2 className="text-4xl font-display font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-4">
            <Heart className="text-red-500 fill-red-500" size={36} />
            Favoritos
          </h2>
          <p className="text-zinc-500 text-lg">
            Seus arquivos mais importantes em um só lugar.
          </p>
        </div>

        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((book, i) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group relative bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-6 hover:bg-zinc-900 hover:border-red-500/30 transition-all cursor-pointer overflow-hidden"
              >
                <div className="flex flex-col gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl ${
                    book.type === 'epub' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {book.type === 'epub' ? <Book size={28} /> : <FileText size={28} />}
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="font-bold text-zinc-900 dark:text-white truncate pr-6" title={book.name}>
                      {book.name}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                      <span>{book.type}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-700" />
                      <span>{new Date(book.addedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="h-64 rounded-3xl border-2 border-dashed border-zinc-900 flex flex-col items-center justify-center gap-4 text-zinc-600">
            <Heart size={48} className="opacity-20" />
            <p className="font-medium text-center max-w-xs">
              Você ainda não favoritou nenhum arquivo. Clique no ícone de coração ao ler um livro para adicioná-lo aqui.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
