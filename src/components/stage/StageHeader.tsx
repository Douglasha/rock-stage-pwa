import React from 'react';
import { ShieldCheck, ShieldAlert, ListMusic, FileText, Music2 } from 'lucide-react';
import type { ActiveStageSong } from '../../types';

interface StageHeaderProps {
  currentSong: ActiveStageSong;
  nextSong?: ActiveStageSong;
  isWakeLocked: boolean;
  onOpenSetlist: () => void;
  onOpenNotes: () => void;
}

export const StageHeader: React.FC<StageHeaderProps> = ({
  currentSong,
  nextSong,
  isWakeLocked,
  onOpenSetlist,
  onOpenNotes,
}) => {
  const { song, item, effectiveKey, currentIndex, totalInSet, notes } = currentSong;
  const hasNotes = notes && notes.length > 0;

  return (
    <header className="bg-black border-b border-zinc-800 px-4 py-3 select-none">
      {/* Barra de Status e Controles Superiores */}
      <div className="flex items-center justify-between gap-2 text-xs font-mono mb-2">
        <div className="flex items-center gap-2">
          {/* Indicador de Bloco e Posição */}
          <span className="bg-zinc-800 text-yellow-400 font-bold px-2 py-0.5 rounded uppercase tracking-wider text-xs border border-zinc-700">
            {item.set_block || 'Set'}
          </span>
          <span className="text-zinc-300 font-semibold">
            {String(currentIndex + 1).padStart(2, '0')} / {String(totalInSet).padStart(2, '0')}
          </span>
        </div>

        {/* Indicadores de Sistema (Wake Lock & Status) */}
        <div className="flex items-center gap-2">
          {/* Wake Lock Status */}
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] ${
              isWakeLocked
                ? 'bg-emerald-950/70 border-emerald-600 text-emerald-300'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400'
            }`}
            title={isWakeLocked ? 'Tela bloqueada contra desligamento (Wake Lock Ativo)' : 'Wake Lock Inativo'}
          >
            {isWakeLocked ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">TELA ACESA</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">OFF</span>
              </>
            )}
          </div>

          {/* Botão de Anotações do Instrumento */}
          <button
            onClick={onOpenNotes}
            className={`flex items-center gap-1 px-2.5 py-1 rounded font-sans text-xs font-bold transition active:scale-95 ${
              hasNotes
                ? 'bg-amber-500/20 text-yellow-300 border border-yellow-500/50 hover:bg-amber-500/30'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800'
            }`}
            title="Anotações do instrumento para esta música"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>NOTAS {hasNotes ? `(${notes.length})` : ''}</span>
          </button>

          {/* Botão Rápido de Setlist */}
          <button
            onClick={onOpenSetlist}
            className="flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 text-white font-sans text-xs font-bold px-2.5 py-1 rounded border border-zinc-700 transition active:scale-95"
            title="Abrir lista de músicas do show"
          >
            <ListMusic className="w-3.5 h-3.5 text-yellow-400" />
            <span className="hidden sm:inline">SETLIST</span>
          </button>
        </div>
      </div>

      {/* Identificação Principal da Música */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white uppercase truncate">
            {song.title}
          </h1>
          <p className="text-sm sm:text-base font-semibold text-zinc-400 truncate">
            {song.artist}
          </p>
        </div>

        {/* Badges de Palco: Tom e BPM */}
        <div className="flex items-center gap-2 mt-1 sm:mt-0 flex-shrink-0">
          {/* Tom / Key */}
          <div className="flex flex-col items-center justify-center bg-yellow-400 text-black px-3 py-1 rounded-md shadow-lg shadow-yellow-500/20 font-black min-w-[58px]">
            <span className="text-[10px] uppercase tracking-wider font-extrabold leading-none">TOM</span>
            <span className="text-xl sm:text-2xl leading-none">{effectiveKey}</span>
          </div>

          {/* BPM */}
          {song.bpm > 0 && (
            <div className="flex flex-col items-center justify-center bg-cyan-950 text-cyan-300 border border-cyan-500/50 px-3 py-1 rounded-md font-mono min-w-[58px]">
              <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-400 leading-none">BPM</span>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
                <span className="text-xl sm:text-2xl font-black leading-none">{song.bpm}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Barra de Próxima Música (Zero Dead Air) */}
      <div className="bg-zinc-950 border border-zinc-800/80 rounded px-2.5 py-1 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-zinc-400 font-mono truncate">
          <Music2 className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
          <span className="text-yellow-400 font-bold uppercase">PRÓXIMA:</span>
          {nextSong ? (
            <span className="text-zinc-200 font-bold truncate">
              {nextSong.song.title} ({nextSong.effectiveKey})
            </span>
          ) : (
            <span className="text-zinc-500 italic">Fim do show / Bis</span>
          )}
        </div>

        {item.specific_note && (
          <span className="text-yellow-300/90 text-[11px] font-sans truncate ml-2 hidden md:inline">
            ⚠️ {item.specific_note}
          </span>
        )}
      </div>
    </header>
  );
};
