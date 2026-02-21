'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, Book, FileText, ChevronRight, Clock } from 'lucide-react';

import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';

interface FavoriteBook {
  id: string;
  title: string;
  file_type: 'epub' | 'pdf';
  file_url: string;
  progress?: number;
  cover?: string;
  is_favorite?: boolean;
}

interface FavoritesViewProps {
  onOpenBook: (book: FavoriteBook) => void;
}

export default function FavoritesView({ onOpenBook }: FavoritesViewProps) {
  const [favorites, setFavorites] = useState<FavoriteBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_favorite', true);

      if (error) throw error;
      setFavorites(data || []);
    } catch (error: any) {
      console.error('Error fetching favorites:', error);
      // If column doesn't exist, we'll just show empty for now
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  };

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

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[2/3] bg-zinc-900 rounded-2xl animate-pulse border border-zinc-800" />
            ))}
          </div>
        ) : favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((book, i) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onOpenBook(book)}
                className="group relative aspect-[2/3] bg-zinc-900 rounded-2xl overflow-hidden cursor-pointer shadow-xl hover:shadow-red-500/20 transition-all border border-zinc-800 hover:border-red-500/50"
              >
                {/* Book Cover */}
                <img 
                  src={book.cover || `https://picsum.photos/seed/${book.title}/300/450`}
                  alt={book.title}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                  referrerPolicy="no-referrer"
                />

                {/* Overlay Info (Top) */}
                <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <h4 className="font-bold text-white text-sm truncate" title={book.title}>
                    {book.title}
                  </h4>
                </div>

                {/* Progress Bar (Bottom) */}
                <div className="absolute bottom-4 inset-x-4">
                  <div className="relative h-8 bg-zinc-950/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden flex items-center justify-center">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${book.progress || 0}%` }}
                      className="absolute inset-y-0 left-0 bg-red-600/80"
                    />
                    <span className="relative z-10 text-xs font-bold text-white drop-shadow-md">
                      {book.progress || 0}%
                    </span>
                  </div>
                </div>

                {/* Type Badge */}
                <div className="absolute top-4 left-4">
                  <span className={`px-2 py-1 rounded-md text-[8px] font-bold uppercase tracking-widest ${
                    book.file_type === 'epub' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {book.file_type}
                  </span>
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
