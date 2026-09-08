import React, { useState, useEffect } from 'react';
import { X, Save, Music, Eye, Edit3, Plus, Trash2 } from 'lucide-react';
import { saveSong, getSongNotes, saveSongNote, deleteSongNote } from '../../db/database';
import type { Song, SongNote, InstrumentType } from '../../types';

interface SongEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  songToEdit?: Song | null;
  onSaved: () => void;
}

const COMMON_KEYS = [
  'C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B',
  'Am', 'Bm', 'Cm', 'Dm', 'Em', 'Fm', 'Gm'
];

export const SongEditorModal: React.FC<SongEditorModalProps> = ({
  isOpen,
  onClose,
  songToEdit,
  onSaved
}) => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [key, setKey] = useState('E');
  const [bpm, setBpm] = useState<number>(120);
  const [durationMin, setDurationMin] = useState('3:30');
  const [lyrics, setLyrics] = useState('');
  const [notes, setNotes] = useState<SongNote[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [newNoteInstrument, setNewNoteInstrument] = useState<InstrumentType>('guitar_1');
  const [newNoteContent, setNewNoteContent] = useState('');

  useEffect(() => {
    if (songToEdit) {
      setTitle(songToEdit.title);
      setArtist(songToEdit.artist);
      setKey(songToEdit.key);
      setBpm(songToEdit.bpm || 120);
      const min = Math.floor(songToEdit.duration_sec / 60);
      const sec = songToEdit.duration_sec % 60;
      setDurationMin(`${min}:${String(sec).padStart(2, '0')}`);
      setLyrics(songToEdit.lyrics || '');

      getSongNotes(songToEdit.id).then(setNotes);
    } else {
      setTitle('');
      setArtist('');
      setKey('E');
      setBpm(120);
      setDurationMin('3:30');
      setLyrics(`[Intro]\n(Riff inicial)\n\n[Verso 1]\nPrimeira estrofe...\n\n[Refrão]\nRefrão da música!\n\n[Solo]\n(Solo de guitarra)\n\n[Outro]\nFinal`);
      setNotes([]);
    }
  }, [songToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) return;

    // Converte min:sec para segundos
    let durationSec = 210;
    if (durationMin.includes(':')) {
      const [m, s] = durationMin.split(':');
      durationSec = (parseInt(m, 10) || 0) * 60 + (parseInt(s, 10) || 0);
    } else {
      durationSec = parseInt(durationMin, 10) || 0;
    }

    const songId = await saveSong({
      id: songToEdit?.id,
      band_id: songToEdit?.band_id || 'b001-rock-band',
      title: title.trim(),
      artist: artist.trim(),
      key,
      bpm: Number(bpm) || 120,
      duration_sec: durationSec,
      lyrics,
      structure: ''
    });

    // Salva notas pendentes se houver
    if (newNoteContent.trim()) {
      await saveSongNote({
        song_id: songId,
        instrument: newNoteInstrument,
        content: newNoteContent.trim()
      });
    }

    onSaved();
    onClose();
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;
    if (songToEdit?.id) {
      const noteId = await saveSongNote({
        song_id: songToEdit.id,
        instrument: newNoteInstrument,
        content: newNoteContent.trim()
      });
      setNotes((prev) => [
        ...prev,
        {
          id: noteId,
          song_id: songToEdit.id,
          instrument: newNoteInstrument,
          content: newNoteContent.trim(),
          created_at: new Date().toISOString()
        }
      ]);
      setNewNoteContent('');
    }
  };

  const handleDeleteNote = async (id: string) => {
    await deleteSongNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl z-10 flex flex-col max-h-[90vh] overflow-hidden text-white">
        {/* Topo do Modal */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-black uppercase tracking-wide">
              {songToEdit ? 'Editar Música' : 'Nova Música para o Repertório'}
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
          {/* Linha 1: Título e Artista */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                Título da Música *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex: Highway to Hell"
                required
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-yellow-400 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                Artista / Banda Original *
              </label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="ex: AC/DC"
                required
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-yellow-400 text-sm"
              />
            </div>
          </div>

          {/* Linha 2: Tom, BPM, Duração */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-yellow-400 uppercase mb-1">
                Tom (Key)
              </label>
              <select
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-yellow-400 font-bold focus:outline-none focus:border-yellow-400 text-sm"
              >
                {COMMON_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-cyan-400 uppercase mb-1">
                BPM
              </label>
              <input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                min={30}
                max={300}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-cyan-300 font-mono focus:outline-none focus:border-yellow-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                Duração (M:SS)
              </label>
              <input
                type="text"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                placeholder="3:45"
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-yellow-400 text-sm"
              />
            </div>
          </div>

          {/* Seção Letra com Toggle de Preview */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide">
                Letra e Estrutura (Tags: [Intro], [Verso], [Refrão], [Solo])
              </label>
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className="flex items-center gap-1 text-xs font-bold text-yellow-400 hover:text-yellow-300 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded"
              >
                {previewMode ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{previewMode ? 'Editar Texto' : 'Pré-visualizar no Palco'}</span>
              </button>
            </div>

            {previewMode ? (
              <div className="h-64 overflow-y-auto bg-black border border-zinc-800 rounded-lg p-4 font-sans space-y-2 select-none">
                {lyrics.split('\n').map((line, i) => {
                  const trimmed = line.trim();
                  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                    const isChorus = trimmed.toLowerCase().includes('refrão');
                    const isSolo = trimmed.toLowerCase().includes('solo');
                    return (
                      <div
                        key={i}
                        className={`inline-block px-2.5 py-0.5 rounded text-xs font-black uppercase my-1 border ${
                          isChorus
                            ? 'bg-yellow-400 text-black border-yellow-300'
                            : isSolo
                            ? 'bg-cyan-500 text-black border-cyan-400'
                            : 'bg-zinc-800 text-zinc-200 border-zinc-700'
                        }`}
                      >
                        {trimmed}
                      </div>
                    );
                  }
                  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
                    return (
                      <div key={i} className="text-zinc-500 italic text-xs font-mono">
                        {trimmed}
                      </div>
                    );
                  }
                  if (!trimmed) return <div key={i} className="h-2" />;
                  return (
                    <div key={i} className="text-zinc-200 text-sm font-semibold">
                      {line}
                    </div>
                  );
                })}
              </div>
            ) : (
              <textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                rows={10}
                placeholder="Cole aqui a letra da música com seções entre colchetes..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono text-sm leading-relaxed focus:outline-none focus:border-yellow-400"
              />
            )}
          </div>

          {/* Anotações de Palco do Instrumento */}
          {songToEdit && (
            <div className="pt-2 border-t border-zinc-800">
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">
                Anotações Técnicas por Instrumento
              </label>

              {/* Lista de notas existentes */}
              <div className="space-y-1.5 mb-3">
                {notes.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-center justify-between p-2 rounded bg-zinc-900 border border-zinc-800 text-xs"
                  >
                    <div>
                      <span className="font-bold text-yellow-400 uppercase mr-2">
                        [{n.instrument}]:
                      </span>
                      <span className="text-zinc-200">{n.content}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(n.id)}
                      className="text-zinc-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Adicionar nova anotação */}
              <div className="flex gap-2">
                <select
                  value={newNoteInstrument}
                  onChange={(e) => setNewNoteInstrument(e.target.value as InstrumentType)}
                  className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-yellow-400"
                >
                  <option value="guitar_1">Guitarra 1</option>
                  <option value="guitar_2">Guitarra 2</option>
                  <option value="bass">Baixo</option>
                  <option value="drums">Bateria</option>
                  <option value="vocals">Voz</option>
                  <option value="keys">Teclado</option>
                  <option value="general">Geral</option>
                </select>

                <input
                  type="text"
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="ex: Afinar meio tom, ligar chorus no refrão..."
                  className="flex-1 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-yellow-400"
                />

                <button
                  type="button"
                  onClick={handleAddNote}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded text-xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </div>
            </div>
          )}

          {/* Botões do Rodapé */}
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
              <Save className="w-4 h-4" /> Salvar Música
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
