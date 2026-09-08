import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  ArrowUpToLine,
  Gauge,
  Type
} from 'lucide-react';
import type { ScrollSpeed } from '../../hooks/useAutoScroll';

interface StageFooterProps {
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  isPlayingScroll: boolean;
  onToggleScroll: () => void;
  onScrollToTop: () => void;
  speed: ScrollSpeed;
  onChangeSpeed: () => void;
  fontSizeLevel: 'normal' | 'large' | 'huge';
  onChangeFontSize: () => void;
}

export const StageFooter: React.FC<StageFooterProps> = ({
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  isPlayingScroll,
  onToggleScroll,
  onScrollToTop,
  speed,
  onChangeSpeed,
  fontSizeLevel,
  onChangeFontSize
}) => {
  return (
    <footer className="bg-black border-t border-zinc-800 px-3 py-2 flex items-center justify-between gap-2 select-none">
      {/* Botão MÚSICA ANTERIOR (Alvo de toque grande) */}
      <button
        onClick={onPrev}
        disabled={!hasPrev}
        className={`flex-1 min-h-[58px] flex items-center justify-center gap-1.5 rounded-lg font-bold text-sm md:text-base uppercase tracking-wider transition active:scale-95 ${
          hasPrev
            ? 'bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 shadow-md'
            : 'bg-zinc-950 text-zinc-600 border border-zinc-900 cursor-not-allowed'
        }`}
        aria-label="Música anterior"
      >
        <ChevronLeft className="w-6 h-6 text-yellow-400" />
        <span className="hidden sm:inline">ANTERIOR</span>
      </button>

      {/* Bloco Central de Controles de Rolagem */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Retornar ao Topo */}
        <button
          onClick={onScrollToTop}
          className="min-h-[58px] px-3 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-800 flex flex-col items-center justify-center transition active:scale-95"
          title="Voltar ao início da letra"
        >
          <ArrowUpToLine className="w-5 h-5" />
          <span className="text-[10px] font-mono mt-0.5">TOPO</span>
        </button>

        {/* Play / Pause Auto-Scroll */}
        <button
          onClick={onToggleScroll}
          className={`min-h-[58px] px-4 sm:px-6 rounded-lg font-bold flex items-center justify-center gap-2 border transition active:scale-95 ${
            isPlayingScroll
              ? 'bg-yellow-500 hover:bg-yellow-400 text-black border-yellow-300 shadow-lg shadow-yellow-500/30'
              : 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-700'
          }`}
          title={isPlayingScroll ? 'Pausar rolagem automática' : 'Iniciar rolagem automática'}
        >
          {isPlayingScroll ? (
            <>
              <Pause className="w-6 h-6 fill-current" />
              <span className="text-xs sm:text-sm font-black uppercase">PAUSAR</span>
            </>
          ) : (
            <>
              <Play className="w-6 h-6 fill-current text-yellow-400" />
              <span className="text-xs sm:text-sm font-black uppercase">ROLAR</span>
            </>
          )}
        </button>

        {/* Velocidade de Rolagem */}
        <button
          onClick={onChangeSpeed}
          className="min-h-[58px] px-3 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 text-cyan-300 rounded-lg border border-zinc-800 flex flex-col items-center justify-center font-mono transition active:scale-95"
          title="Alterar velocidade de rolagem"
        >
          <div className="flex items-center gap-0.5">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold">{speed}x</span>
          </div>
          <span className="text-[9px] text-zinc-400 uppercase mt-0.5">VELOC</span>
        </button>

        {/* Alternar Tamanho da Fonte */}
        <button
          onClick={onChangeFontSize}
          className="min-h-[58px] px-3 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-800 flex flex-col items-center justify-center transition active:scale-95"
          title={`Tamanho da fonte: ${fontSizeLevel}`}
        >
          <Type className="w-4 h-4 text-yellow-400" />
          <span className="text-[10px] font-bold uppercase mt-0.5">
            {fontSizeLevel === 'normal' ? '1X' : fontSizeLevel === 'large' ? '2X' : '3X'}
          </span>
        </button>
      </div>

      {/* Botão PRÓXIMA MÚSICA (Alvo de toque grande) */}
      <button
        onClick={onNext}
        disabled={!hasNext}
        className={`flex-1 min-h-[58px] flex items-center justify-center gap-1.5 rounded-lg font-bold text-sm md:text-base uppercase tracking-wider transition active:scale-95 ${
          hasNext
            ? 'bg-yellow-500 hover:bg-yellow-400 text-black border border-yellow-300 shadow-lg shadow-yellow-500/20'
            : 'bg-zinc-950 text-zinc-600 border border-zinc-900 cursor-not-allowed'
        }`}
        aria-label="Próxima música"
      >
        <span className="hidden sm:inline">PRÓXIMA</span>
        <ChevronRight className="w-6 h-6 text-black" />
      </button>
    </footer>
  );
};
