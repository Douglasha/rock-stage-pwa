import React, { useState, useEffect } from 'react';
import {
  Plus,
  Play,
  Edit2,
  Trash2,
  Calendar,
  MapPin,
  Clock,
  Music,
  CheckCircle2
} from 'lucide-react';
import {
  getAllSetlists,
  setActiveSetlist,
  deleteSetlist,
  getSetlistFullData
} from '../../db/database';
import { SetlistEditorModal } from './SetlistEditorModal';
import type { Setlist } from '../../types';

interface SetlistManagerProps {
  onEnterStage: (setlistId?: string) => void;
}

interface SetlistWithStats extends Setlist {
  songCount: number;
  totalDurationMin: number;
}

export const SetlistManager: React.FC<SetlistManagerProps> = ({ onEnterStage }) => {
  const [setlists, setSetlists] = useState<SetlistWithStats[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedSetlist, setSelectedSetlist] = useState<Setlist | null>(null);

  const loadSetlists = async () => {
    const list = await getAllSetlists();
    const withStats: SetlistWithStats[] = [];

    for (const s of list) {
      const fullSongs = await getSetlistFullData(s.id);
      const totalSec = fullSongs.reduce((acc, it) => acc + (it.song.duration_sec || 0), 0);
      withStats.push({
        ...s,
        songCount: fullSongs.length,
        totalDurationMin: Math.floor(totalSec / 60)
      });
    }

    setSetlists(withStats);
  };

  useEffect(() => {
    loadSetlists();
  }, []);

  const handleActivateAndPlay = async (setlistId: string) => {
    await setActiveSetlist(setlistId);
    await loadSetlists();
    onEnterStage(setlistId);
  };

  const handleEdit = (setlist: Setlist) => {
    setSelectedSetlist(setlist);
    setIsEditorOpen(true);
  };

  const handleCreate = () => {
    setSelectedSetlist(null);
    setIsEditorOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o repertório "${title}"?`)) {
      await deleteSetlist(id);
      await loadSetlists();
    }
  };

  return (
    <div className="space-y-4">
      {/* Topo: Resumo e Botão Criar */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wide">
            Repertórios Cadastrados ({setlists.length})
          </h3>
          <p className="text-xs text-zinc-500">
            Escolha o repertório que a banda vai tocar hoje no palco:
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-wider text-xs rounded-lg shadow-lg shadow-yellow-500/20 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          Novo Repertório
        </button>
      </div>

      {/* Grid de Repertórios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {setlists.map((s) => (
          <div
            key={s.id}
            className={`p-4 rounded-xl border transition flex flex-col justify-between gap-4 ${
              s.is_active
                ? 'bg-zinc-950 border-yellow-500/80 shadow-xl shadow-yellow-500/10'
                : 'bg-zinc-950 border-zinc-800/90 hover:border-zinc-700'
            }`}
          >
            {/* Cabeçalho do Card */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-black text-lg text-white uppercase tracking-tight">
                    {s.title}
                  </h4>
                  {s.venue && (
                    <div className="flex items-center gap-1 text-xs text-zinc-400 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                      <span>{s.venue}</span>
                    </div>
                  )}
                </div>

                {s.is_active && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-yellow-400 text-black shadow-md">
                    <CheckCircle2 className="w-3 h-3" />
                    ATIVO NO SHOW
                  </span>
                )}
              </div>

              {/* Informações de Data e Duração */}
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-zinc-400 font-mono">
                {s.event_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{new Date(s.event_date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-yellow-400">
                  <Music className="w-3.5 h-3.5" />
                  <span>{s.songCount} músicas</span>
                </div>
                {s.totalDurationMin > 0 && (
                  <div className="flex items-center gap-1 text-cyan-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>~{s.totalDurationMin} min</span>
                  </div>
                )}
              </div>
            </div>

            {/* Ações do Card */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-800/80">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(s)}
                  className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-yellow-400 transition"
                  title="Editar repertório e ordem das músicas"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(s.id, s.title)}
                  className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition"
                  title="Excluir repertório"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => handleActivateAndPlay(s.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition active:scale-95 ${
                  s.is_active
                    ? 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-lg shadow-yellow-500/20'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {s.is_active ? 'Tocar no Palco ⚡' : 'Ativar e Tocar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Edição */}
      <SetlistEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        setlistToEdit={selectedSetlist}
        onSaved={loadSetlists}
      />
    </div>
  );
};
