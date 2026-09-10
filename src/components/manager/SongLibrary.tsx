import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, Clock, Zap, Download, Upload, RefreshCw, CheckCircle2, Play } from 'lucide-react';
import {
  getAllSongs,
  deleteSong,
  exportDatabaseBackup,
  importDatabaseBackup,
  uploadAllLocalDataToSupabase,
  syncFromSupabase
} from '../../db/database';
import { SongEditorModal } from './SongEditorModal';
import type { Song } from '../../types';

interface SongLibraryProps {
  onPlayStandaloneSong?: (song: Song) => void;
}

export const SongLibrary: React.FC<SongLibraryProps> = ({ onPlayStandaloneSong }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKey, setFilterKey] = useState<string>('all');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const loadSongs = async () => {
    const list = await getAllSongs();
    setSongs(list);
  };

  useEffect(() => {
    loadSongs();
  }, []);

  const handleSyncCloud = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await uploadAllLocalDataToSupabase();
      await syncFromSupabase();
      await loadSongs();
      if (res.success) {
        setSyncMessage(`Sincronização concluída! ${res.songsCount} músicas e ${res.setlistsCount} repertórios disponíveis na nuvem para todos os integrantes.`);
      } else {
        alert(res.error || 'Erro ao sincronizar com a nuvem.');
      }
    } catch (err: any) {
      alert(`Falha ao sincronizar: ${err?.message || err}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const handleEditSong = (song: Song) => {
    setSelectedSong(song);
    setIsEditorOpen(true);
  };

  const handleCreateSong = () => {
    setSelectedSong(null);
    setIsEditorOpen(true);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportBackup = async () => {
    try {
      const json = await exportDatabaseBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `delta-brothers-backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Erro ao exportar backup.');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const res = await importDatabaseBackup(text);
      if (res.success) {
        await loadSongs();
        alert(`Backup restaurado com sucesso! ${res.count} músicas processadas.`);
      } else {
        alert(`Falha ao restaurar: ${res.error}`);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
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

        <div className="flex items-center gap-2">
          {/* Input oculto para carregar JSON de backup */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />

          <button
            type="button"
            onClick={handleExportBackup}
            title="Exportar arquivo JSON com todas as músicas e cifras para backup"
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-bold text-xs rounded-lg transition"
          >
            <Download className="w-3.5 h-3.5 text-yellow-400" />
            <span className="hidden sm:inline">Exportar Backup</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Restaurar músicas a partir de um arquivo de backup JSON"
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-bold text-xs rounded-lg transition"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Importar Backup</span>
          </button>

          <button
            type="button"
            onClick={handleSyncCloud}
            disabled={isSyncing}
            title="Sincronizar todas as músicas locais com a nuvem (Supabase) para que apareçam para todos os integrantes"
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 font-bold text-xs rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Nuvem'}</span>
          </button>

          {/* Botão Nova Música */}
          <button
            onClick={handleCreateSong}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-wider text-xs rounded-lg shadow-lg shadow-yellow-500/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Música</span>
          </button>
        </div>
      </div>

      {/* Alerta de Sincronização */}
      {syncMessage && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs font-bold rounded-xl flex items-center gap-2 animate-fade-in shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Contador de Músicas */}
      <div className="flex items-center justify-between text-xs text-zinc-400 font-mono px-1">
        <span>Repertório total: <strong className="text-yellow-400 font-bold">{songs.length}</strong> músicas cadastradas</span>
        {filteredSongs.length !== songs.length && (
          <span>Filtradas: <strong className="text-white">{filteredSongs.length}</strong></span>
        )}
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
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {onPlayStandaloneSong && (
                    <button
                      onClick={() => onPlayStandaloneSong(song)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase text-xs shadow-md shadow-yellow-500/10 active:scale-95 transition"
                      title="Abrir imediatamente no Modo Palco Avulso"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Palco</span>
                    </button>
                  )}

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
        onPlayStandaloneSong={onPlayStandaloneSong}
      />
    </div>
  );
};
