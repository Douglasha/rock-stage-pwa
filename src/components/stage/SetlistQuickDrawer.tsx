import React from 'react';
import { X, Play, Music } from 'lucide-react';
import type { ActiveStageSong } from '../../types';

interface SetlistQuickDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  songs: ActiveStageSong[];
  currentIndex: number;
  onSelectSong: (index: number) => void;
  setlistTitle?: string;
}

export const SetlistQuickDrawer: React.FC<SetlistQuickDrawerProps> = ({
  isOpen,
  onClose,
  songs,
  currentIndex,
  onSelectSong,
  setlistTitle
}) => {
  if (!isOpen) return null;

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
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 min-w-0">
            <Music className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <h2 className="text-lg font-black uppercase tracking-wider truncate">
              {setlistTitle || 'Repertório do Show'}
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

        {/* Lista de músicas com agrupamento visual */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
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
        </div>

        {/* Rodapé informativo */}
        <div className="p-3 border-t border-zinc-800 text-center text-xs text-zinc-500 font-mono">
          Total de {songs.length} músicas programadas
        </div>
      </div>
    </div>
  );
};
