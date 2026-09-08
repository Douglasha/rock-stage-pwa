import React, { useMemo } from 'react';

interface LyricsViewerProps {
  lyrics: string;
  containerRef: React.RefObject<HTMLDivElement>;
  fontSizeLevel: 'normal' | 'large' | 'huge';
}

interface ParsedBlock {
  type: 'section-header' | 'comment' | 'lyrics';
  text: string;
  tag?: string;
}

export const LyricsViewer: React.FC<LyricsViewerProps> = ({
  lyrics,
  containerRef,
  fontSizeLevel
}) => {
  // Parser para destacar blocos estruturais: [Intro], [Refrão], [Solo], etc.
  const parsedLines = useMemo<ParsedBlock[]>(() => {
    if (!lyrics) return [];

    const lines = lyrics.split('\n');
    return lines.map((line) => {
      const trimmed = line.trim();

      // Verifica se é uma tag de seção de bloco puro [Nome da Seção]
      const sectionMatch = trimmed.match(/^\[(.*?)\]$/);
      if (sectionMatch) {
        return {
          type: 'section-header',
          text: trimmed,
          tag: sectionMatch[1].toLowerCase()
        };
      }

      // Linhas com comentários / indicações de palco em parênteses (ex: riff, compassos)
      if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
        return {
          type: 'comment',
          text: trimmed
        };
      }

      return {
        type: 'lyrics',
        text: line
      };
    });
  }, [lyrics]);

  // Classes de tipografia baseadas no nível de zoom escolhido para o palco
  const fontClasses = {
    normal: 'text-xl md:text-2xl leading-relaxed',
    large: 'text-2xl md:text-3xl leading-loose',
    huge: 'text-3xl md:text-4xl leading-loose font-medium'
  }[fontSizeLevel];

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-black text-white px-4 md:px-8 py-6 select-none touch-pan-y scroll-smooth"
      style={{
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div className={`max-w-3xl mx-auto ${fontClasses}`}>
        {parsedLines.map((block, index) => {
          if (block.type === 'section-header') {
            const isChorus = block.tag?.includes('refrão') || block.tag?.includes('chorus');
            const isSolo = block.tag?.includes('solo');
            const isIntro = block.tag?.includes('intro') || block.tag?.includes('abertura');

            return (
              <div
                key={index}
                className={`mt-8 mb-3 inline-block px-3 py-1 rounded text-sm md:text-base font-black tracking-widest uppercase border ${
                  isChorus
                    ? 'bg-yellow-500 text-black border-yellow-400 shadow-md shadow-yellow-500/20'
                    : isSolo
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/20'
                    : isIntro
                    ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                    : 'bg-zinc-900 text-yellow-300 border-zinc-700'
                }`}
              >
                {block.text}
              </div>
            );
          }

          if (block.type === 'comment') {
            return (
              <div key={index} className="text-zinc-500 italic text-base md:text-lg my-1 font-mono">
                {block.text}
              </div>
            );
          }

          // Linha vazia entre estrofes
          if (!block.text.trim()) {
            return <div key={index} className="h-4" />;
          }

          // Letra normal em alto contraste OLED
          return (
            <div
              key={index}
              className="text-zinc-100 font-semibold tracking-wide py-0.5"
            >
              {block.text}
            </div>
          );
        })}

        {/* Espaçamento extra no final para permitir rolagem completa além da barra de rodapé */}
        <div className="h-64" />
      </div>
    </div>
  );
};
