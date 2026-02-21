'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Book, 
  FileText, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  Menu,
  Maximize2,
  Minimize2,
  Type,
  Moon,
  Sun,
  Clock,
  Plus,
  Home as HomeIcon,
  Library,
  Heart,
  History,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Dynamically import readers to avoid SSR issues with browser APIs
const EpubReader = dynamic(() => import('@/components/EpubReader'), { ssr: false });
const PdfReader = dynamic(() => import('@/components/PdfReader'), { ssr: false });
const LibraryView = dynamic(() => import('@/components/LibraryView'), { ssr: false });
const FavoritesView = dynamic(() => import('@/components/FavoritesView'), { ssr: false });
const HistoryView = dynamic(() => import('@/components/HistoryView'), { ssr: false });
const AuthView = dynamic(() => import('@/components/AuthView'), { ssr: false });

interface RecentBook {
  name: string;
  type: 'epub' | 'pdf';
  lastRead: number;
  progress: number;
  cover?: string;
}

export default function Home() {
  const [file, setFile] = useState<File | string | null>(null);
  const [fileType, setFileType] = useState<'epub' | 'pdf' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [recentBooks, setRecentBooks] = useState<RecentBook[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const { showToast } = useToast();

  // Toggle dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Check auth on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsAuthChecking(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load recent books from Supabase
  useEffect(() => {
    if (!user) return;

    const fetchRecentBooks = async () => {
      try {
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(4);

        if (error) throw error;
        setRecentBooks(data || []);
      } catch (error) {
        console.error('Error fetching recent books:', error);
      }
    };

    fetchRecentBooks();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = async (selectedFile: File) => {
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    let type: 'epub' | 'pdf' | null = null;

    if (extension === 'epub') {
      type = 'epub';
    } else if (extension === 'pdf') {
      type = 'pdf';
    }

    if (type) {
      showToast('Enviando arquivo...', 'info');
      try {
        // 1. Verify session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          alert('Usuário não autenticado no banco de dados');
          throw new Error('Usuário não autenticado no banco de dados');
        }

        const user = session.user;

        // 2. Upload to Storage
        const fileExt = selectedFile.name.split('.').pop();
        const uniqueFileName = `${Date.now()}_${selectedFile.name}`;
        const filePath = `${user.id}/${uniqueFileName}`;

        const { error: uploadError } = await supabase.storage.from('arquivos_templo').upload(filePath, selectedFile);

        if (uploadError) {
          console.error('Full Storage Error:', uploadError);
          alert('Erro do Supabase: ' + uploadError.message);
          throw uploadError;
        }

        // 3. Get Public URL
        const { data: { publicUrl } } = supabase.storage.from('arquivos_templo').getPublicUrl(filePath);

        // 3. Save to Database
        const { error: dbError } = await supabase
          .from('books')
          .insert({
            title: selectedFile.name,
            file_url: publicUrl,
            file_type: type,
            user_id: user.id,
            cover: `https://picsum.photos/seed/${selectedFile.name}/300/450`
          });

        if (dbError) throw dbError;

        setFile(selectedFile);
        setFileType(type);
        showToast(`Arquivo "${selectedFile.name}" carregado com sucesso!`, 'success');
        
        // Refresh recent books
        const { data } = await supabase
          .from('books')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(4);
        
        setRecentBooks(data || []);
      } catch (error: any) {
        console.error('Upload error:', error);
        showToast(error.message || 'Erro ao enviar arquivo.', 'error');
      }
    } else if (!user) {
      showToast('Usuário não autenticado.', 'error');
    } else {
      showToast('Por favor, selecione um arquivo EPUB ou PDF válido.', 'error');
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const resetFile = () => {
    setFile(null);
    setFileType(null);
  };

  const handleLogin = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    showToast('Sessão encerrada.', 'info');
  };

  const handleOpenBook = (book: any) => {
    setFile(book.file_url);
    setFileType(book.file_type);
    showToast(`Abrindo "${book.title}"...`, 'info');
  };

  if (isAuthChecking) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthView onLogin={handleLogin} />;
  }

  return (
    <main className="h-screen flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden transition-colors duration-300">
      {/* Header */}
      <header className="h-20 border-b border-zinc-200 dark:border-zinc-800/50 flex items-center justify-between px-4 md:px-8 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-50 shrink-0">
        <div className="flex items-center gap-3 md:gap-6">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden md:flex p-2 rounded-xl hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all border border-transparent hover:border-zinc-800"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Book className="text-white w-6 h-6 md:w-7 md:h-7" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-display font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                arquivos do templo
              </h1>
              <p className="hidden md:block text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Reader Premium</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          {!file && (
            <label 
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`relative cursor-pointer group flex items-center gap-2 md:gap-3 px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl border-2 border-dashed transition-all ${
                isDragging 
                  ? 'border-blue-500 bg-blue-500/10 scale-105' 
                  : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50'
              }`}
            >
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Plus size={18} />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs md:text-sm font-bold text-white leading-none">Adicionar</p>
                <p className="text-[8px] md:text-[10px] text-zinc-500 mt-0.5 md:mt-1">EPUB/PDF</p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept=".epub,.pdf"
                onChange={handleFileChange}
              />
            </label>
          )}

          {file && (
            <button 
              onClick={resetFile}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-red-950/30 text-zinc-400 hover:text-red-400 transition-all border border-zinc-800 hover:border-red-900/50"
            >
              <X size={18} />
              <span className="text-sm font-bold">Fechar</span>
            </button>
          )}

          <div className="w-px h-8 bg-zinc-800" />
          
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-3 rounded-xl hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all border border-transparent hover:border-zinc-800"
            title={isDarkMode ? "Mudar para modo claro" : "Mudar para modo escuro"}
          >
            {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
          </button>

          <button 
            onClick={handleLogout}
            className="p-3 rounded-xl hover:bg-zinc-900 text-zinc-400 hover:text-red-400 transition-all border border-transparent hover:border-zinc-800"
            title="Sair"
          >
            <X size={22} />
          </button>

          <button className="p-3 rounded-xl hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all border border-transparent hover:border-zinc-800">
            <Settings size={22} />
          </button>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 relative flex overflow-hidden">
        <motion.aside
          initial={false}
          animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
          className="hidden md:flex border-r border-zinc-200 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-950/50 backdrop-blur-sm overflow-hidden flex-col"
        >
          <div className="p-6 space-y-8">
            {/* Search */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Buscar na biblioteca..."
                className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-zinc-900 dark:text-white"
              />
            </div>

            {/* Nav Items */}
            <nav className="space-y-2">
              {[
                { id: 'home', label: 'Início', icon: HomeIcon },
                { id: 'library', label: 'Biblioteca', icon: Library },
                { id: 'favorites', label: 'Favoritos', icon: Heart },
                { id: 'history', label: 'Histórico', icon: History },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                    activeTab === item.id 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                      : 'text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800'
                  }`}
                >
                  <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-blue-500 transition-colors'} />
                  <span className="text-sm font-bold">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-6 border-t border-zinc-200 dark:border-zinc-800/50">
            <div className="flex items-center gap-3 mb-6 p-2 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                {(user.user_metadata?.full_name || user.email)?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{user.user_metadata?.full_name || user.email?.split('@')[0]}</p>
                <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900/30 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800/50">
              <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 dark:text-zinc-500 mb-2">Espaço em Nuvem</p>
              <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-blue-600 w-1/3" />
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">1.2 GB de 5 GB usados</p>
            </div>
          </div>
        </motion.aside>

        <AnimatePresence mode="wait">
          {!file ? (
            activeTab === 'home' ? (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-1 overflow-y-auto custom-scrollbar p-12"
              >
                <div className="max-w-6xl mx-auto">
                  {/* Recent Books Grid Only */}
                  <section>
                    {recentBooks.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {recentBooks.map((book: any, i) => (
                          <motion.div
                            key={book.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="group relative aspect-[2/3] bg-zinc-900 rounded-2xl overflow-hidden cursor-pointer shadow-xl hover:shadow-blue-500/20 transition-all border border-zinc-800 hover:border-blue-500/50"
                            onClick={() => handleOpenBook(book)}
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
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-64 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-900 flex flex-col items-center justify-center gap-4 text-zinc-400 dark:text-zinc-600">
                        <Book size={48} className="opacity-20" />
                        <p className="font-medium text-lg">Sua biblioteca está vazia.</p>
                        <p className="text-sm">Adicione arquivos EPUB ou PDF para começar sua leitura.</p>
                      </div>
                    )}
                  </section>
                </div>
              </motion.div>
            ) : activeTab === 'library' ? (
              <motion.div 
                key="library"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex overflow-hidden"
              >
                <LibraryView onOpenBook={handleOpenBook} />
              </motion.div>
            ) : activeTab === 'favorites' ? (
              <motion.div 
                key="favorites"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex overflow-hidden"
              >
                <FavoritesView onOpenBook={handleOpenBook} />
              </motion.div>
            ) : activeTab === 'history' ? (
              <motion.div 
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex overflow-hidden"
              >
                <HistoryView onOpenBook={handleOpenBook} />
              </motion.div>
            ) : (
              <motion.div 
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex items-center justify-center text-zinc-500"
              >
                Em breve: {activeTab}
              </motion.div>
            )
          ) : (
            <motion.div 
              key="reader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex overflow-hidden"
            >
              {fileType === 'epub' ? (
                <EpubReader file={file} />
              ) : (
                <PdfReader file={file} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation (Mobile) */}
      {!file && (
        <nav className="md:hidden h-20 border-t border-zinc-200 dark:border-zinc-800/50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl flex items-center justify-around px-4 pb-safe z-50 shrink-0">
          {[
            { id: 'home', label: 'Início', icon: HomeIcon },
            { id: 'library', label: 'Biblioteca', icon: Library },
            { id: 'favorites', label: 'Favoritos', icon: Heart },
            { id: 'history', label: 'Histórico', icon: History },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1.5 transition-all ${
                activeTab === item.id ? 'text-blue-500' : 'text-zinc-400 dark:text-zinc-500'
              }`}
            >
              <div className={`p-2 rounded-xl transition-all ${
                activeTab === item.id ? 'bg-blue-500/10' : ''
              }`}>
                <item.icon size={24} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tighter">
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      )}

      {/* Footer / Status Bar (Desktop Only) */}
      <footer className="hidden md:flex h-10 border-t border-zinc-200 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 px-8 items-center justify-between text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-bold shrink-0">
        <div className="flex gap-6">
          <span>arquivos do templo v1.1</span>
          <span className="text-zinc-800">|</span>
          <span>Premium Reader</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse" />
          Sistema Ativo
        </div>
      </footer>
    </main>
  );
}
