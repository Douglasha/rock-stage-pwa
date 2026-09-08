import React, { useState, useRef, useCallback } from 'react';
import { StageHeader } from './StageHeader';
import { LyricsViewer } from './LyricsViewer';
import { StageFooter } from './StageFooter';
import { SetlistQuickDrawer } from './SetlistQuickDrawer';
import { StageNotesModal } from './StageNotesModal';
import { useWakeLock } from '../../hooks/useWakeLock';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { usePedalControls } from '../../hooks/usePedalControls';
import { useSwipe } from '../../hooks/useSwipe';
import type { ActiveStageSong, Setlist } from '../../types';

interface StageViewProps {
  songs: ActiveStageSong[];
  initialSongIndex?: number;
  setlist?: Setlist | null;
}

export const StageView: React.FC<StageViewProps> = ({
  songs,
  initialSongIndex = 0,
  setlist
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialSongIndex);
  const [isSetlistOpen, setIsSetlistOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [fontSizeLevel, setFontSizeLevel] = useState<'normal' | 'large' | 'huge'>('large');

  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  // 1. Wake Lock para manter a tela 100% acesa durante o show
  const { isLocked: isWakeLocked } = useWakeLock(true);

  // 2. Rolagem Automática suave via requestAnimationFrame
  const {
    isPlaying: isPlayingScroll,
    speed: scrollSpeed,
    setSpeed: setScrollSpeed,
    togglePlay: toggleScroll,
    pause: pauseScroll,
    scrollToTop
  } = useAutoScroll({
    containerRef: lyricsContainerRef,
    basePixelsPerSecond: 28
  });

  // Navegação de músicas
  const currentSong = songs[currentIndex];
  const nextSong = currentIndex < songs.length - 1 ? songs[currentIndex + 1] : undefined;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < songs.length - 1;

  const goToNextSong = useCallback(() => {
    if (currentIndex < songs.length - 1) {
      pauseScroll();
      setCurrentIndex((prev) => prev + 1);
      // Resetar scroll para o topo imediatamente
      if (lyricsContainerRef.current) {
        lyricsContainerRef.current.scrollTop = 0;
      }
    }
  }, [currentIndex, songs.length, pauseScroll]);

  const goToPrevSong = useCallback(() => {
    if (currentIndex > 0) {
      pauseScroll();
      setCurrentIndex((prev) => prev - 1);
      if (lyricsContainerRef.current) {
        lyricsContainerRef.current.scrollTop = 0;
      }
    }
  }, [currentIndex, pauseScroll]);

  const goToSong = useCallback((index: number) => {
    if (index >= 0 && index < songs.length) {
      pauseScroll();
      setCurrentIndex(index);
      if (lyricsContainerRef.current) {
        lyricsContainerRef.current.scrollTop = 0;
      }
    }
  }, [songs.length, pauseScroll]);

  // 3. Controle por Pedais Bluetooth e Teclado
  usePedalControls({
    onNextSong: goToNextSong,
    onPrevSong: goToPrevSong,
    onToggleScroll: toggleScroll,
    onScrollToTop: scrollToTop,
    enabled: !isSetlistOpen && !isNotesOpen
  });

  // 4. Troca rápida de música via Swipe Horizontal no Touchscreen
  useSwipe({
    containerRef: lyricsContainerRef,
    onSwipeLeft: goToNextSong,
    onSwipeRight: goToPrevSong,
    enabled: !isSetlistOpen && !isNotesOpen
  });

  // Alternador de velocidades
  const cycleSpeed = () => {
    const speeds: Array<typeof scrollSpeed> = [1, 1.5, 2, 2.5];
    const nextIdx = (speeds.indexOf(scrollSpeed) + 1) % speeds.length;
    setScrollSpeed(speeds[nextIdx]);
  };

  // Alternador de tamanho de fonte
  const cycleFontSize = () => {
    const levels: Array<typeof fontSizeLevel> = ['normal', 'large', 'huge'];
    const nextIdx = (levels.indexOf(fontSizeLevel) + 1) % levels.length;
    setFontSizeLevel(levels[nextIdx]);
  };

  if (!currentSong) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white font-mono">
        Nenhuma música no setlist
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-black text-white overflow-hidden select-none">
      {/* 1. Cabeçalho de Alto Contraste */}
      <StageHeader
        currentSong={currentSong}
        nextSong={nextSong}
        isWakeLocked={isWakeLocked}
        onOpenSetlist={() => setIsSetlistOpen(true)}
        onOpenNotes={() => setIsNotesOpen(true)}
      />

      {/* 2. Visualizador de Letras com Parser de Blocos */}
      <LyricsViewer
        lyrics={currentSong.song.lyrics}
        containerRef={lyricsContainerRef}
        fontSizeLevel={fontSizeLevel}
      />

      {/* 3. Rodapé com Botões Touch Grandes */}
      <StageFooter
        onPrev={goToPrevSong}
        onNext={goToNextSong}
        hasPrev={hasPrev}
        hasNext={hasNext}
        isPlayingScroll={isPlayingScroll}
        onToggleScroll={toggleScroll}
        onScrollToTop={scrollToTop}
        speed={scrollSpeed}
        onChangeSpeed={cycleSpeed}
        fontSizeLevel={fontSizeLevel}
        onChangeFontSize={cycleFontSize}
      />

      {/* 4. Drawer de Repertório para Salto Rápido */}
      <SetlistQuickDrawer
        isOpen={isSetlistOpen}
        onClose={() => setIsSetlistOpen(false)}
        songs={songs}
        currentIndex={currentIndex}
        onSelectSong={goToSong}
        setlistTitle={setlist?.title}
      />

      {/* 5. Modal de Anotações por Instrumento */}
      <StageNotesModal
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        currentSong={currentSong}
      />
    </div>
  );
};
