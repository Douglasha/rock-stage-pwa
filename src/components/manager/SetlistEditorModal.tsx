import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  ListMusic,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Clock
} from 'lucide-react';
import {
  getAllSongs,
  createSetlist,
  updateSetlist,
  getSetlistFullData,
  saveSetlistItems
} from '../../db/database';
import type { Setlist, Song } from '../../types';

interface SetlistEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  setlistToEdit?: Setlist | null;
  onSaved: () => void;
}

interface SetlistItemDraft {
  song_id: string;
  song: Song;
  position: number;
  set_block: string;
  override_key: string;
  specific_note: string;
}

const SET_BLOCKS = ['Abertura', 'Set 1', 'Set 2', 'Set 3', 'Bis', 'Encore'];

export const SetlistEditorModal: React.FC<SetlistEditorModalProps> = ({
  isOpen,
  onClose,
  setlistToEdit,
  onSaved
}) => {
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [items, setItems] = useState<SetlistItemDraft[]>([]);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [selectedSongToAdd, setSelectedSongToAdd] = useState<string>('');

  useEffect(() => {
    const loadAll = async () => {
      const songs = await getAllSongs();
      setAllSongs(songs);
      if (songs.length > 0) {
        setSelectedSongToAdd(songs[0].id);
      }

      if (setlistToEdit) {
        setTitle(setlistToEdit.title);
        setVenue(setlistToEdit.venue || '');
        setEventDate(setlistToEdit.event_date || '');

        const fullItems = await getSetlistFullData(setlistToEdit.id);
        setItems(
          fullItems.map((fi, idx) => ({
            song_id: fi.song.id,
            song: fi.song,
            position: idx + 1,
            set_block: fi.item.set_block || 'Set 1',
            override_key: fi.item.override_key || '',
            specific_note: fi.item.specific_note || ''
          }))
        );
      } else {
        setTitle('Novo Show');
        setVenue('');
        setEventDate(new Date().toISOString().split('T')[0]);
        setItems([]);
      }
    };

    if (isOpen) {
      loadAll();
    }
  }, [isOpen, setlistToEdit]);

  if (!isOpen) return null;

  // Duração total estimada
  const totalSeconds = items.reduce((acc, it) => acc + (it.song.duration_sec || 0), 0);
  const totalMin = Math.floor(totalSeconds / 60);

  const handleAddSong = () => {
    if (!selectedSongToAdd) return;
    const song = allSongs.find((s) => s.id === selectedSongToAdd);
    if (!song) return;

    setItems((prev) => [
      ...prev,
      {
        song_id: song.id,
        song,
        position: prev.length + 1,
        set_block: 'Set 1',
        override_key: '',
        specific_note: ''
      }
    ]);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setItems((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy.map((it, idx) => ({ ...it, position: idx + 1 }));
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    setItems((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy.map((it, idx) => ({ ...it, position: idx + 1 }));
    });
  };

  const handleRemove = (index: number) => {
    setItems((prev) =>
      prev.filter((_, i) => i !== index).map((it, idx) => ({ ...it, position: idx + 1 }))
    );
  };

  const handleUpdateItem = (index: number, field: keyof SetlistItemDraft, value: string) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let targetSetlistId = setlistToEdit?.id;

    if (targetSetlistId) {
      await updateSetlist(targetSetlistId, {
        title: title.trim(),
        venue: venue.trim(),
        event_date: eventDate || null
      });
    } else {
      targetSetlistId = await createSetlist({
        band_id: 'b001-rock-band',
        title: title.trim(),
        venue: venue.trim(),
        event_date: eventDate || null,
        is_active: false
      });
    }

    // Salva itens do setlist
    await saveSetlistItems(
      targetSetlistId,
      items.map((it) => ({
        song_id: it.song_id,
        position: it.position,
        set_block: it.set_block,
        override_key: it.override_key || null,
        specific_note: it.specific_note || ''
      }))
    );

    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl z-10 flex flex-col max-h-[92vh] overflow-hidden text-white">
        {/* Topo do Modal */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-black uppercase tracking-wide">
              {setlistToEdit ? 'Editar Repertório / Ordem do Show' : 'Novo Repertório para o Show'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg active:bg-zinc-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Metadados do Show */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                Nome do Repertório *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex: Rock Fest 2026"
                required
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-yellow-400 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                Local do Show (Venue)
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="ex: Galpão Rock Club"
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-yellow-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                Data do Show
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-yellow-400 text-sm font-mono"
              />
            </div>
          </div>

          {/* Barra de Resumo e Adição de Músicas */}
          <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-zinc-500">MÚSICAS:</span>{' '}
                <strong className="text-yellow-400 text-sm">{items.length}</strong>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-500">TEMPO TOTAL:</span>{' '}
                <strong className="text-cyan-400 text-sm">{totalMin} min</strong>
              </div>
            </div>

            {/* Seletor para adicionar música */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedSongToAdd}
                onChange={(e) => setSelectedSongToAdd(e.target.value)}
                className="flex-1 sm:flex-initial px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-yellow-400"
              >
                {allSongs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.key}) - {s.artist}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddSong}
                className="px-3 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase text-xs rounded-lg flex items-center gap-1 flex-shrink-0 active:scale-95 transition"
              >
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            </div>
          </div>

          {/* Lista de Músicas Ordenadas do Setlist */}
          <div className="space-y-2">
            {items.length === 0 ? (
              <div className="py-10 text-center text-zinc-500 font-mono text-sm border border-dashed border-zinc-800 rounded-xl">
                Nenhuma música neste repertório ainda. Selecione uma música acima para adicionar.
              </div>
            ) : (
              items.map((it, index) => (
                <div
                  key={`${it.song_id}-${index}`}
                  className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
                >
                  {/* Posição e Identificação */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-sm font-bold w-6 text-zinc-500 text-center flex-shrink-0">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    {/* Botões Subir / Descer */}
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Subir na ordem"
                      >
                        <ArrowUp className="w-3 h-3 text-white" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === items.length - 1}
                        className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Descer na ordem"
                      >
                        <ArrowDown className="w-3 h-3 text-white" />
                      </button>
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-white truncate">
                        {it.song.title}
                      </h4>
                      <p className="text-xs text-zinc-400 truncate">
                        {it.song.artist} • Tom original: {it.song.key}
                      </p>
                    </div>
                  </div>

                  {/* Configurações específicas da faixa no show */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Bloco */}
                    <select
                      value={it.set_block}
                      onChange={(e) => handleUpdateItem(index, 'set_block', e.target.value)}
                      className="px-2.5 py-1.5 rounded bg-black border border-zinc-700 text-xs text-yellow-400 font-bold focus:outline-none focus:border-yellow-400"
                    >
                      {SET_BLOCKS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>

                    {/* Override Key */}
                    <input
                      type="text"
                      value={it.override_key}
                      onChange={(e) => handleUpdateItem(index, 'override_key', e.target.value)}
                      placeholder="Tom (+/-)"
                      className="w-16 px-2 py-1.5 rounded bg-black border border-zinc-700 text-xs text-yellow-300 font-mono text-center focus:outline-none focus:border-yellow-400"
                      title="Tom específico para este show (deixe em branco para tom original)"
                    />

                    {/* Specific Note (Cue) */}
                    <input
                      type="text"
                      value={it.specific_note}
                      onChange={(e) => handleUpdateItem(index, 'specific_note', e.target.value)}
                      placeholder="Nota de transição..."
                      className="flex-1 sm:w-44 px-2 py-1.5 rounded bg-black border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-yellow-400"
                      title="Indicação para o palco (ex: sem intervalo, virada de bateria)"
                    />

                    {/* Remover */}
                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 rounded transition"
                      title="Remover do setlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Botões de Ação */}
          <div className="pt-4 border-t border-zinc-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-sm font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-yellow-400 hover:bg-yellow-300 text-black rounded-lg text-sm font-black uppercase flex items-center gap-1.5 shadow-lg shadow-yellow-500/20 active:scale-95 transition"
            >
              <Save className="w-4 h-4" /> Salvar Repertório
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
