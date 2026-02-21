'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  FolderPlus, 
  MoreVertical, 
  Book, 
  FileText, 
  ChevronRight, 
  Search,
  Trash2,
  Edit2,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';

interface BookItem {
  id: string;
  title: string;
  file_type: 'epub' | 'pdf';
  file_url: string;
  created_at: string;
  progress?: number;
  cover?: string;
  user_id: string;
}

interface Session {
  id: string;
  name: string;
  books: BookItem[];
}

interface LibraryViewProps {
  onOpenBook: (book: BookItem) => void;
}

export default function LibraryView({ onOpenBook }: LibraryViewProps) {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { showToast } = useToast();

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchBooks = useCallback(async () => {
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
      setBooks(data || []);
    } catch (error: any) {
      console.error('Error fetching books:', error);
      showToast('Erro ao carregar biblioteca.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Load library from Supabase
  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleAddFileClick = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'epub' && extension !== 'pdf') {
      showToast('Por favor, selecione um arquivo EPUB ou PDF.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // 1. Upload to Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('arquivos_templo').upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage.from('arquivos_templo').getPublicUrl(filePath);

      // 3. Save to Database
      const { error: dbError } = await supabase
        .from('books')
        .insert({
          title: file.name,
          file_url: publicUrl,
          file_type: extension as 'epub' | 'pdf',
          user_id: user.id,
          cover: `https://picsum.photos/seed/${file.name}/300/450`
        });

      if (dbError) throw dbError;

      showToast(`"${file.name}" adicionado à biblioteca.`, 'success');
      fetchBooks();
    } catch (error: any) {
      console.error('Upload error:', error);
      showToast(error.message || 'Erro ao fazer upload do arquivo.', 'error');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const deleteBook = async (id: string, filePath: string) => {
    if (!confirm('Tem certeza que deseja excluir este livro?')) return;

    try {
      // Delete from DB
      const { error: dbError } = await supabase
        .from('books')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      // Delete from Storage (extract path from URL if needed, but here we might need the original path)
      // For simplicity, we'll just delete from DB in this step as the user didn't specify storage cleanup
      
      setBooks(books.filter(b => b.id !== id));
      showToast('Livro removido.', 'info');
    } catch (error: any) {
      showToast('Erro ao excluir livro.', 'error');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-12">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".epub,.pdf" 
        onChange={onFileChange} 
      />
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-4xl font-display font-bold text-zinc-900 dark:text-white tracking-tight">
              Sua Biblioteca
            </h2>
            <p className="text-zinc-500 text-lg">
              Gerencie seus arquivos salvos no Templo.
            </p>
          </div>
          <button 
            onClick={handleAddFileClick}
            disabled={isUploading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/20"
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus size={20} />
            )}
            {isUploading ? 'Enviando...' : 'Adicionar Livro'}
          </button>
        </div>

        {/* Books Grid */}
        <div className="space-y-12">
          <section className="space-y-6">
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                <h3 className="text-2xl font-display font-bold text-zinc-900 dark:text-white">Todos os Arquivos</h3>
                <span className="text-xs font-mono text-zinc-400 dark:text-zinc-600 bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded-md">
                  {books.length} ARQUIVOS
                </span>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-[2/3] bg-zinc-900 rounded-2xl animate-pulse border border-zinc-800" />
                ))}
              </div>
            ) : books.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {books.map((book) => (
                  <div 
                    key={book.id}
                    onClick={() => onOpenBook(book)}
                    className="group relative aspect-[2/3] bg-zinc-900 rounded-2xl overflow-hidden cursor-pointer shadow-xl hover:shadow-blue-500/20 transition-all border border-zinc-800 hover:border-blue-500/50"
                  >
                    {/* Book Cover */}
                    <img 
                      src={book.cover || `https://picsum.photos/seed/${book.title}/300/450`}
                      alt={book.title}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                      referrerPolicy="no-referrer"
                    />

                    {/* Overlay Info (Top) */}
                    <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-start">
                      <h4 className="font-bold text-white text-sm truncate flex-1 mr-2" title={book.title}>
                        {book.title}
                      </h4>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBook(book.id, book.file_url);
                        }}
                        className="p-1.5 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Progress Bar (Bottom) */}
                    <div className="absolute bottom-4 inset-x-4">
                      <div className="relative h-8 bg-zinc-950/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden flex items-center justify-center">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${book.progress || 0}%` }}
                          className="absolute inset-y-0 left-0 bg-blue-600/80"
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
                  </div>
                ))}
              </div>
            ) : (
              <div 
                onClick={handleAddFileClick}
                className="h-64 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-900 flex flex-col items-center justify-center gap-4 text-zinc-400 dark:text-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-800 hover:text-zinc-500 dark:hover:text-zinc-600 transition-all cursor-pointer group"
              >
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus size={32} />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-zinc-300">Sua biblioteca está vazia</p>
                  <p className="text-sm">Clique para adicionar seu primeiro livro</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
