import React, { useState, useEffect } from 'react';
import { X, Play, Music, Search, ArrowLeft, Sparkles } from 'lucide-react';
import { db } from '../../db/database';
import type { ActiveStageSong, Song } from '../../types';

interface SetlistQuickDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  songs: ActiveStageSong[];
  currentIndex: number;
  onSelectSong: (index: number) => void;
  setlistTitle?: string;
  isStandalone?: boolean;
  onSelectStandaloneSong?: (song: Song) => void;
  onRestoreOriginalSetlist?: () => void;
}

export const SetlistQuickDrawer: React.FC<SetlistQuickDrawerProps> = ({
  isOpen,
  onClose,
  songs,
  currentIndex,
  onSelectSong,
  setlistTitle,
  isStandalone = false,
  onSelectStandaloneSong,
  onRestoreOriginalSetlist
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [librarySongs, setLibrarySongs] = useState<Song[]>([]);

  // Carrega todas as músicas da biblioteca local Dexie quando o drawer abre
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      db.songs.orderBy('title').toArray().then(setLibrarySongs).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const searchResults = normalizedSearch
    ? librarySongs.filter(
        (s) =>
          s.title.toLowerCase().includes(normalizedSearch) ||
          s.artist.toLowerCase().includes(normalizedSearch)
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop escurecido */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Painel lateral */}
      <div className="relative w-full max-w-md bg-black border-r border-zinc-800 text-white flex flex-col h-full z-10 shadow-2xl">
        {/* Topo do drawer */}
        <div className="p-4 border-b border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Music className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <h2 className="text-lg font-black uppercase tracking-wider truncate">
                {isStandalone ? 'Música Avulsa' : (setlistTitle || 'Repertório do Show')}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-lg active:bg-zinc-800 transition"
              aria-label="Fechar repertório"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Botão para retornar ao repertório original se estiver tocando avulsa */}
          {isStandalone && onRestoreOriginalSetlist && (
            <button
              onClick={() => {
                onRestoreOriginalSetlist();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-black uppercase text-xs tracking-wider rounded-lg shadow-lg active:scale-[0.98] transition"
            >
              <ArrowLeft className="w-4 h-4 stroke-[3]" />
              <span>Voltar ao Repertório do Show</span>
            </button>
          )}

          {/* Campo de busca na biblioteca */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar música fora do repertório..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 font-sans"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Corpo: Resultados da busca ou Repertório Atual */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {normalizedSearch ? (
            <>
              <div className="flex items-center justify-between px-1 py-1 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                <span>Biblioteca ({searchResults.length})</span>
                <span className="text-yellow-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Toque para tocar avulso
                </span>
              </div>

              {searchResults.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 text-xs font-mono">
                  Nenhuma música encontrada para "{searchTerm}"
                </div>
              ) : (
                searchResults.map((song) => (
                  <div
                    key={song.id}
                    onClick={() => {
                      if (onSelectStandaloneSong) {
                        onSelectStandaloneSong(song);
                        onClose();
                      }
                    }}
                    className="p-3 rounded-lg border bg-zinc-950 border-zinc-800/80 hover:bg-zinc-900 hover:border-yellow-500/50 cursor-pointer transition active:scale-[0.99] flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-white group-hover:text-yellow-400 transition truncate">
                        {song.title}
                      </div>
                      <div className="text-xs text-zinc-400 truncate">
                        {song.artist}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="bg-zinc-900 border border-zinc-700 text-yellow-400 font-black text-xs px-2 py-1 rounded">
                        {song.key}
                      </span>
                      {song.bpm > 0 && (
                        <span className="bg-zinc-900 border border-zinc-800 text-cyan-300 font-mono text-xs px-1.5 py-1 rounded">
                          {song.bpm}
                        </span>
                      )}
                      <span className="flex items-center gap-1 bg-yellow-400 hover:bg-yellow-300 text-black text-[11px] font-black uppercase px-2 py-1 rounded shadow transition">
                        <Play className="w-3 h-3 fill-current" /> Tocar
                      </span>
                    </div>
                  </div>
                ))
              )}
            </>
          ) : (
            <>
              {isStandalone && (
                <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs text-yellow-300 font-mono mb-2">
                  ⚡ Você está em modo <strong>Música Avulsa</strong>. Use a busca acima para tocar qualquer outra música ou clique no botão acima para voltar ao show.
                </div>
              )}

              {songs.map((item, index) => {
                const isCurrent = index === currentIndex;

                return (
                  <div
                    key={item.song.id}
                    onClick={() => {
                      onSelectSong(index);
                      onClose();
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition active:scale-[0.99] flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-yellow-500/10 border-yellow-500 text-white shadow-lg shadow-yellow-500/10'
                        : 'bg-zinc-950 border-zinc-800/80 hover:bg-zinc-900 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`font-mono text-sm font-bold w-6 text-center ${
                          isCurrent ? 'text-yellow-400' : 'text-zinc-500'
                        }`}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base truncate">
                            {item.song.title}
                          </span>
                          {isCurrent && (
                            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-yellow-400 text-black px-1.5 py-0.5 rounded">
                              <Play className="w-2.5 h-2.5 fill-current" /> AGORA
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400 truncate">
                          {item.song.artist}
                          {item.item.set_block && (
                            <span className="ml-2 text-zinc-400 font-mono">
                              • {item.item.set_block}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="bg-zinc-900 border border-zinc-700 text-yellow-400 font-black text-xs px-2 py-1 rounded">
                        {item.effectiveKey}
                      </span>
                      {item.song.bpm > 0 && (
                        <span className="bg-zinc-900 border border-zinc-800 text-cyan-300 font-mono text-xs px-1.5 py-1 rounded">
                          {item.song.bpm}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Rodapé informativo */}
        <div className="p-3 border-t border-zinc-800 text-center text-xs text-zinc-500 font-mono">
          {normalizedSearch
            ? `${searchResults.length} música(s) encontrada(s)`
            : `Total de ${songs.length} música(s) programada(s)`}
        </div>
      </div>
    </div>
  );
};
