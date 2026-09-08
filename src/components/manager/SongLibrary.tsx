import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Clock, Zap } from 'lucide-react';
import { getAllSongs, deleteSong } from '../../db/database';
import { SongEditorModal } from './SongEditorModal';
import type { Song } from '../../types';

export const SongLibrary: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKey, setFilterKey] = useState<string>('all');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const loadSongs = async () => {
    const list = await getAllSongs();
    setSongs(list);
  };

  useEffect(() => {
    loadSongs();
  }, []);

  const handleEditSong = (song: Song) => {
    setSelectedSong(song);
    setIsEditorOpen(true);
  };

  const handleCreateSong = () => {
    setSelectedSong(null);
    setIsEditorOpen(true);
  };

  const handleDeleteSong = async (id: string, title: string) => {
    if (window.confirm(`Tem certeza que deseja remover a música "${title}" da biblioteca?`)) {
      await deleteSong(id);
      await loadSongs();
    }
  };

  // Filtragem de músicas
  const filteredSongs = songs.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKey = filterKey === 'all' || s.key === filterKey;
    return matchesSearch && matchesKey;
  });

  const availableKeys = Array.from(new Set(songs.map((s) => s.key))).sort();

  return (
    <div className="space-y-4">
      {/* Barra de Ações: Busca, Filtros e Botão Adicionar */}
      <div className="flex flex-col sm:flex-row gap-2.5 justify-between items-stretch sm:items-center">
        <div className="flex flex-1 gap-2">
          {/* Campo de Busca */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título ou artista..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-yellow-400"
            />
          </div>

          {/* Filtro de Tom */}
          <select
            value={filterKey}
            onChange={(e) => setFilterKey(e.target.value)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold text-yellow-400 focus:outline-none focus:border-yellow-400"
          >
            <option value="all">Todos os Tons</option>
            {availableKeys.map((k) => (
              <option key={k} value={k}>
                Tom {k}
              </option>
            ))}
          </select>
        </div>

        {/* Botão Nova Música */}
        <button
          onClick={handleCreateSong}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-wider text-xs rounded-lg shadow-lg shadow-yellow-500/20 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          Nova Música
        </button>
      </div>

      {/* Lista de Músicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {filteredSongs.length === 0 ? (
          <div className="col-span-full py-12 text-center text-zinc-500 font-mono text-sm">
            Nenhuma música encontrada com os filtros selecionados.
          </div>
        ) : (
          filteredSongs.map((song) => {
            const min = Math.floor(song.duration_sec / 60);
            const sec = song.duration_sec % 60;

            return (
              <div
                key={song.id}
                className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 p-3.5 rounded-xl flex items-center justify-between gap-3 transition group"
              >
                <div className="min-w-0 flex items-center gap-3">
                  {/* Badge de Tom */}
                  <div className="w-11 h-11 rounded-lg bg-yellow-400/10 border border-yellow-500/30 flex flex-col items-center justify-center text-yellow-400 font-black flex-shrink-0">
                    <span className="text-[9px] uppercase leading-none font-bold text-yellow-500/80">TOM</span>
                    <span className="text-base leading-tight">{song.key}</span>
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-white truncate group-hover:text-yellow-400 transition">
                      {song.title}
                    </h4>
                    <p className="text-xs text-zinc-400 truncate">{song.artist}</p>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500 font-mono">
                      {song.bpm > 0 && (
                        <span className="flex items-center gap-0.5 text-cyan-400">
                          <Zap className="w-3 h-3" /> {song.bpm} BPM
                        </span>
                      )}
                      {song.duration_sec > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" /> {min}:{String(sec).padStart(2, '0')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleEditSong(song)}
                    className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-yellow-400 transition"
                    title="Editar música e letra"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSong(song.id, song.title)}
                    className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition"
                    title="Remover música"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Edição */}
      <SongEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        songToEdit={selectedSong}
        onSaved={loadSongs}
      />
    </div>
  );
};
