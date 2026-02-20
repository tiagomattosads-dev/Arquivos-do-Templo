'use client';

import React, { useState, useEffect } from 'react';
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

interface BookItem {
  id: string;
  name: string;
  type: 'epub' | 'pdf';
  addedAt: number;
}

interface Session {
  id: string;
  name: string;
  books: BookItem[];
}

export default function LibraryView() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');

  // Load library from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('arquivos_templo_library');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const timer = setTimeout(() => {
          setSessions(parsed);
        }, 0);
        return () => clearTimeout(timer);
      } catch (e) {
        console.error('Failed to parse library', e);
      }
    } else {
      // Default sessions
      const defaults: Session[] = [
        { id: '1', name: 'Leituras Atuais', books: [] },
        { id: '2', name: 'Favoritos', books: [] },
        { id: '3', name: 'Para Ler Depois', books: [] }
      ];
      const timer = setTimeout(() => {
        setSessions(defaults);
      }, 0);
      localStorage.setItem('arquivos_templo_library', JSON.stringify(defaults));
      return () => clearTimeout(timer);
    }
  }, []);

  const saveLibrary = (updatedSessions: Session[]) => {
    setSessions(updatedSessions);
    localStorage.setItem('arquivos_templo_library', JSON.stringify(updatedSessions));
  };

  const addSession = () => {
    if (!newSessionName.trim()) return;
    const newSession: Session = {
      id: Date.now().toString(),
      name: newSessionName,
      books: []
    };
    saveLibrary([...sessions, newSession]);
    setNewSessionName('');
    setIsAddingSession(false);
  };

  const deleteSession = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta sessão?')) {
      saveLibrary(sessions.filter(s => s.id !== id));
    }
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-4xl font-display font-bold text-white tracking-tight">
              Sua Biblioteca
            </h2>
            <p className="text-zinc-500 text-lg">
              Organize seus arquivos em sessões personalizadas.
            </p>
          </div>
          <button 
            onClick={() => setIsAddingSession(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/20"
          >
            <FolderPlus size={20} />
            Nova Sessão
          </button>
        </div>

        {/* Add Session Modal/Input */}
        <AnimatePresence>
          {isAddingSession && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-zinc-900/50 border border-blue-500/30 rounded-3xl p-6 flex items-center gap-4"
            >
              <input 
                autoFocus
                type="text" 
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSession()}
                placeholder="Nome da nova sessão..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-all"
              />
              <button 
                onClick={addSession}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all"
              >
                Criar
              </button>
              <button 
                onClick={() => setIsAddingSession(false)}
                className="p-3 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sessions Grid */}
        <div className="space-y-12">
          {sessions.map((session) => (
            <section key={session.id} className="space-y-6">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                  <h3 className="text-2xl font-display font-bold text-white">{session.name}</h3>
                  <span className="text-xs font-mono text-zinc-600 bg-zinc-900 px-2 py-1 rounded-md">
                    {session.books.length} ARQUIVOS
                  </span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => deleteSession(session.id)}
                    className="p-2 text-zinc-600 hover:text-red-400 transition-colors"
                    title="Excluir Sessão"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button className="p-2 text-zinc-600 hover:text-white transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>

              {session.books.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {session.books.map((book) => (
                    <div 
                      key={book.id}
                      className="group bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-6 hover:bg-zinc-900 hover:border-blue-500/30 transition-all cursor-pointer"
                    >
                      <div className="flex flex-col gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          book.type === 'epub' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {book.type === 'epub' ? <Book size={24} /> : <FileText size={24} />}
                        </div>
                        <h4 className="font-bold text-white truncate">{book.name}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 rounded-3xl border-2 border-dashed border-zinc-900 flex flex-col items-center justify-center gap-2 text-zinc-700 hover:border-zinc-800 hover:text-zinc-600 transition-all cursor-pointer group">
                  <Plus size={24} className="group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium">Adicionar arquivos a esta sessão</p>
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
