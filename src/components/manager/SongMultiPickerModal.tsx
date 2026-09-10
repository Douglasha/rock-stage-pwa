import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  CheckSquare,
  Square,
  ListPlus,
  Music,
  Clock
} from 'lucide-react';
import type { Song } from '../../types';

interface SongMultiPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  allSongs: Song[];
  existingSongIds: string[];
  onAddSongs: (selectedSongs: Song[], targetBlock: string) => void;
  defaultBlock?: string;
}

const SET_BLOCKS = ['Set 1', 'Set 2', 'Set 3', 'Abertura', 'Bis', 'Encore'];

export const SongMultiPickerModal: React.FC<SongMultiPickerModalProps> = ({
  isOpen,
  onClose,
  allSongs,
  existingSongIds,
  onAddSongs,
  defaultBlock = 'Set 1'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetBlock, setTargetBlock] = useState(defaultBlock);
  const [hideAlreadyAdded, setHideAlreadyAdded] = useState(false);

  // Mapeamento rápido de contagem de quantas vezes cada música já está no repertório
  const existingCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const id of existingSongIds) {
      map[id] = (map[id] || 0) + 1;
    }
    return map;
  }, [existingSongIds]);

  // Filtra as músicas conforme a busca e filtros
  const filteredSongs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return allSongs.filter((song) => {
      if (hideAlreadyAdded && (existingCountMap[song.id] || 0) > 0) {
        return false;
      }
      if (!term) return true;
      return (
        song.title.toLowerCase().includes(term) ||
        song.artist.toLowerCase().includes(term) ||
        (song.key && song.key.toLowerCase().includes(term))
      );
    });
  }, [allSongs, searchTerm, hideAlreadyAdded, existingCountMap]);

  if (!isOpen) return null;

  const handleToggleSelect = (songId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(songId)) {
        return prev.filter((id) => id !== songId);
      } else {
        return [...prev, songId];
      }
    });
  };

  const handleSelectAllFiltered = () => {
    const newIds = [...selectedIds];
    for (const song of filteredSongs) {
      if (!newIds.includes(song.id)) {
        newIds.push(song.id);
      }
    }
    setSelectedIds(newIds);
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleConfirm = () => {
    if (selectedIds.length === 0) return;

    // Recupera os objetos Song na ordem em que foram selecionados
    const songMap = new Map(allSongs.map((s) => [s.id, s]));
    const songsToAdd: Song[] = [];
    for (const id of selectedIds) {
      const s = songMap.get(id);
      if (s) songsToAdd.push(s);
    }

    onAddSongs(songsToAdd, targetBlock);
    setSelectedIds([]);
    onClose();
  };

  const formatDuration = (sec?: number) => {
    if (!sec || sec <= 0) return null;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl z-10 flex flex-col max-h-[90vh] overflow-hidden text-white">
        {/* Topo do Modal */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListPlus className="w-5 h-5 text-yellow-400" />
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wider">
                Selecionar Músicas para o Repertório
              </h2>
              <p className="text-xs text-zinc-400">
                Selecione várias músicas de uma vez para adicionar ao show
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg active:bg-zinc-800 transition"
            aria-label="Fechar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Barra de Filtros & Configuração */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/30 space-y-3">
          {/* Busca e Destino do Bloco */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Campo de Busca */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por título, artista ou tom..."
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 font-sans"
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

            {/* Bloco de Destino */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-bold text-zinc-400 uppercase whitespace-nowrap">
                Adicionar ao:
              </span>
              <select
                value={targetBlock}
                onChange={(e) => setTargetBlock(e.target.value)}
                className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-bold text-yellow-400 focus:outline-none focus:border-yellow-400"
              >
                {SET_BLOCKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ações de Seleção Rápida e Filtro de Repetição */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-medium active:scale-95 transition"
              >
                Marcar Visíveis ({filteredSongs.length})
              </button>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded font-medium active:scale-95 transition"
                >
                  Desmarcar Todas
                </button>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-zinc-400 hover:text-zinc-200 text-xs">
              <input
                type="checkbox"
                checked={hideAlreadyAdded}
                onChange={(e) => setHideAlreadyAdded(e.target.checked)}
                className="rounded bg-zinc-900 border-zinc-700 text-yellow-400 focus:ring-0 cursor-pointer"
              />
              <span>Ocultar músicas já no repertório</span>
            </label>
          </div>
        </div>

        {/* Lista de Músicas com Seleção por Checkbox */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 divide-y divide-zinc-900/60">
          {filteredSongs.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 font-mono text-sm">
              <Music className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Nenhuma música encontrada para os filtros atuais.
            </div>
          ) : (
            filteredSongs.map((song) => {
              const isSelected = selectedIds.includes(song.id);
              const countInSetlist = existingCountMap[song.id] || 0;
              const durationStr = formatDuration(song.duration_sec);

              return (
                <div
                  key={song.id}
                  onClick={() => handleToggleSelect(song.id)}
                  className={`p-2.5 sm:p-3 rounded-xl cursor-pointer transition flex items-center justify-between gap-3 border active:scale-[0.99] ${
                    isSelected
                      ? 'bg-yellow-500/10 border-yellow-500/80 text-white shadow-sm shadow-yellow-500/5'
                      : 'bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      aria-label={isSelected ? 'Desmarcar' : 'Marcar'}
                      className="flex-shrink-0 text-yellow-400 hover:text-yellow-300 transition"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 fill-yellow-400 text-black stroke-[2.5]" />
                      ) : (
                        <Square className="w-5 h-5 text-zinc-600" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white truncate">
                          {song.title}
                        </span>
                        {countInSetlist > 0 && (
                          <span className="text-[10px] bg-zinc-800 text-zinc-400 font-mono px-1.5 py-0.5 rounded border border-zinc-700">
                            Já no setlist ({countInSetlist}x)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 truncate">
                        {song.artist}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {song.key && (
                      <span className="bg-zinc-900 border border-zinc-700 text-yellow-400 font-black text-xs px-2 py-0.5 rounded">
                        {song.key}
                      </span>
                    )}
                    {song.bpm > 0 && (
                      <span className="bg-zinc-900 border border-zinc-800 text-cyan-300 font-mono text-xs px-1.5 py-0.5 rounded hidden sm:inline-block">
                        {song.bpm} BPM
                      </span>
                    )}
                    {durationStr && (
                      <span className="flex items-center gap-1 text-zinc-500 text-xs font-mono hidden sm:flex">
                        <Clock className="w-3 h-3" />
                        {durationStr}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé com Contador e Botões de Confirmação */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-mono text-zinc-400 w-full sm:w-auto text-center sm:text-left">
            {selectedIds.length > 0 ? (
              <span className="text-yellow-400 font-bold">
                ✓ {selectedIds.length} música(s) selecionada(s)
              </span>
            ) : (
              <span>Nenhuma música selecionada</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs sm:text-sm font-bold active:scale-95 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedIds.length === 0}
              className="flex-1 sm:flex-initial px-5 py-2 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 disabled:pointer-events-none text-black font-black uppercase text-xs sm:text-sm rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-yellow-500/20 active:scale-95 transition"
            >
              <ListPlus className="w-4 h-4 stroke-[2.5]" />
              <span>
                {selectedIds.length > 0
                  ? `Adicionar ${selectedIds.length} Música(s)`
                  : 'Adicionar Músicas'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
