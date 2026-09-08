import React, { useState } from 'react';
import { X, FileText, AlertCircle, Guitar, Mic, Drum } from 'lucide-react';
import type { ActiveStageSong } from '../../types';

interface StageNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSong: ActiveStageSong;
}

export const StageNotesModal: React.FC<StageNotesModalProps> = ({
  isOpen,
  onClose,
  currentSong
}) => {
  const [selectedInstrument, setSelectedInstrument] = useState<string>('all');

  if (!isOpen) return null;

  const { song, item, notes } = currentSong;

  const instrumentLabels: Record<string, { label: string; icon: React.ReactNode }> = {
    guitar_1: { label: 'Guitarra 1', icon: <Guitar className="w-4 h-4" /> },
    guitar_2: { label: 'Guitarra 2', icon: <Guitar className="w-4 h-4" /> },
    bass: { label: 'Contrabaixo', icon: <Guitar className="w-4 h-4" /> },
    drums: { label: 'Bateria', icon: <Drum className="w-4 h-4" /> },
    vocals: { label: 'Voz / Backing', icon: <Mic className="w-4 h-4" /> },
    general: { label: 'Geral', icon: <FileText className="w-4 h-4" /> }
  };

  const filteredNotes = selectedInstrument === 'all'
    ? notes
    : notes.filter((n) => n.instrument === selectedInstrument);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-black border border-zinc-700 text-white rounded-xl shadow-2xl z-10 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Cabeçalho do modal */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-yellow-400" />
            <div>
              <h3 className="font-black text-base uppercase">{song.title}</h3>
              <p className="text-xs text-zinc-400">Anotações técnicas de palco</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg active:bg-zinc-800"
            aria-label="Fechar modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Nota específica do Setlist atual (se houver) */}
        {item.specific_note && (
          <div className="mx-4 mt-4 p-3 bg-amber-500/10 border border-amber-500/40 rounded-lg flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Indicação para este show:
              </div>
              <div className="text-sm text-amber-100 font-medium mt-0.5">
                {item.specific_note}
              </div>
            </div>
          </div>
        )}

        {/* Filtro por Instrumento */}
        <div className="px-4 pt-3 flex gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedInstrument('all')}
            className={`px-3 py-1.5 rounded-full font-bold uppercase transition flex-shrink-0 ${
              selectedInstrument === 'all'
                ? 'bg-yellow-400 text-black'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
            }`}
          >
            Todos ({notes.length})
          </button>
          {Array.from(new Set(notes.map((n) => n.instrument))).map((inst) => (
            <button
              key={inst}
              onClick={() => setSelectedInstrument(inst)}
              className={`px-3 py-1.5 rounded-full font-bold uppercase transition flex-shrink-0 ${
                selectedInstrument === inst
                  ? 'bg-yellow-400 text-black'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
              }`}
            >
              {instrumentLabels[inst]?.label || inst}
            </button>
          ))}
        </div>

        {/* Lista de Notas */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-sm italic">
              Nenhuma anotação cadastrada para esta seleção.
            </div>
          ) : (
            filteredNotes.map((note) => {
              const info = instrumentLabels[note.instrument] || {
                label: note.instrument,
                icon: <FileText className="w-4 h-4" />
              };

              return (
                <div
                  key={note.id}
                  className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-lg space-y-1"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-yellow-400 uppercase tracking-wide">
                    {info.icon}
                    <span>{info.label}</span>
                  </div>
                  <p className="text-sm md:text-base text-zinc-200 font-medium">
                    {note.content}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-lg text-sm"
          >
            Voltar ao Palco
          </button>
        </div>
      </div>
    </div>
  );
};
