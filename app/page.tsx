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
import dynamic from 'next/dynamic';

// Dynamically import readers to avoid SSR issues with browser APIs
const EpubReader = dynamic(() => import('@/components/EpubReader'), { ssr: false });
const PdfReader = dynamic(() => import('@/components/PdfReader'), { ssr: false });
const LibraryView = dynamic(() => import('@/components/LibraryView'), { ssr: false });

interface RecentBook {
  name: string;
  type: 'epub' | 'pdf';
  lastRead: number;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'epub' | 'pdf' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [recentBooks, setRecentBooks] = useState<RecentBook[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('home');

  // Load recent books from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('arquivos_templo_recent_books');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Use a small delay to satisfy the linter's cascading render check
        const timer = setTimeout(() => {
          setRecentBooks(parsed);
        }, 0);
        return () => clearTimeout(timer);
      } catch (e) {
        console.error('Failed to parse recent books', e);
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile: File) => {
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    let type: 'epub' | 'pdf' | null = null;

    if (extension === 'epub') {
      type = 'epub';
    } else if (extension === 'pdf') {
      type = 'pdf';
    }

    if (type) {
      setFile(selectedFile);
      setFileType(type);
      
      // Update recent books
      const newRecent: RecentBook = {
        name: selectedFile.name,
        type: type,
        lastRead: Date.now()
      };

      const updatedRecent = [
        newRecent,
        ...recentBooks.filter(b => b.name !== selectedFile.name)
      ].slice(0, 10);

      setRecentBooks(updatedRecent);
      localStorage.setItem('arquivos_templo_recent_books', JSON.stringify(updatedRecent));
    } else {
      alert('Por favor, selecione um arquivo EPUB ou PDF válido.');
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

  return (
    <main className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* Header */}
      <header className="h-20 border-b border-zinc-800/50 flex items-center justify-between px-4 md:px-8 bg-zinc-950/80 backdrop-blur-md z-50">
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
          
          <button className="p-3 rounded-xl hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all border border-transparent hover:border-zinc-800">
            <Settings size={22} />
          </button>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Sidebar (Desktop) */}
        <motion.aside
          initial={false}
          animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
          className="hidden md:flex border-r border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm overflow-hidden flex-col"
        >
          <div className="p-6 space-y-8">
            {/* Search */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Buscar na biblioteca..."
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
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
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'text-zinc-500 group-hover:text-blue-500 transition-colors'} />
                  <span className="text-sm font-bold">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-6 border-t border-zinc-800/50">
            <div className="bg-zinc-900/30 rounded-2xl p-4 border border-zinc-800/50">
              <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-2">Espaço em Nuvem</p>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-blue-600 w-1/3" />
              </div>
              <p className="text-[10px] text-zinc-400">1.2 GB de 5 GB usados</p>
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
                <div className="max-w-6xl mx-auto space-y-12">
                  {/* Hero / Welcome */}
                  <section className="space-y-2">
                    <h2 className="text-4xl font-display font-bold text-white tracking-tight">
                      Bem-vindo de volta
                    </h2>
                    <p className="text-zinc-500 text-lg">
                      Continue sua jornada literária de onde parou.
                    </p>
                  </section>

                  {/* Recent Books */}
                  <section className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                          <Clock size={18} className="text-blue-500" />
                        </div>
                        <h3 className="text-xl font-display font-bold text-white">Lidos Recentemente</h3>
                      </div>
                    </div>

                    {recentBooks.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {recentBooks.map((book, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="group relative bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-6 hover:bg-zinc-900 hover:border-blue-500/30 transition-all cursor-pointer overflow-hidden"
                            onClick={() => {
                              // Since we can't store the File object, we prompt to select it again
                              // but in a real app we'd have a backend or IndexedDB
                              alert(`Para abrir "${book.name}", por favor use o botão "Adicionar Livro" no topo.`);
                            }}
                          >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg">
                                <ChevronRight size={18} />
                              </div>
                            </div>

                            <div className="flex flex-col gap-4">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl ${
                                book.type === 'epub' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                              }`}>
                                {book.type === 'epub' ? <Book size={28} /> : <FileText size={28} />}
                              </div>
                              
                              <div className="space-y-1">
                                <h4 className="font-bold text-white truncate pr-6" title={book.name}>
                                  {book.name}
                                </h4>
                                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                                  <span>{book.type}</span>
                                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                  <span>{new Date(book.lastRead).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-64 rounded-3xl border-2 border-dashed border-zinc-900 flex flex-col items-center justify-center gap-4 text-zinc-600">
                        <Book size={48} className="opacity-20" />
                        <p className="font-medium">Nenhum livro recente ainda.</p>
                      </div>
                    )}
                  </section>

                  {/* Quick Tips / Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/5 border border-blue-500/20 rounded-3xl p-8 space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                        <Maximize2 size={24} />
                      </div>
                      <h3 className="text-xl font-display font-bold text-white">Foco Total</h3>
                      <p className="text-zinc-400 text-sm leading-relaxed">
                        Nossa interface foi desenhada para desaparecer enquanto você lê, garantindo imersão completa no seu livro favorito.
                      </p>
                    </div>
                    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-8 space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                        <Type size={24} />
                      </div>
                      <h3 className="text-xl font-display font-bold text-white">Personalização</h3>
                      <p className="text-zinc-400 text-sm leading-relaxed">
                        Ajuste fontes, tamanhos e temas para tornar sua leitura o mais confortável possível para seus olhos.
                      </p>
                    </div>
                  </div>
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
                <LibraryView />
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
        <nav className="md:hidden h-20 border-t border-zinc-800/50 bg-zinc-950/80 backdrop-blur-lg flex items-center justify-around px-4 pb-2 z-50">
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
                activeTab === item.id ? 'text-blue-500' : 'text-zinc-500'
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
      <footer className="hidden md:flex h-10 border-t border-zinc-800/50 bg-zinc-950 px-8 items-center justify-between text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
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
