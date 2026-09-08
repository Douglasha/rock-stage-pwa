import { useState, useEffect, useRef, useCallback, RefObject } from 'react';

export type ScrollSpeed = 1 | 1.5 | 2 | 2.5;

interface UseAutoScrollOptions {
  containerRef: RefObject<HTMLElement>;
  basePixelsPerSecond?: number;
}

export function useAutoScroll({ containerRef, basePixelsPerSecond = 30 }: UseAutoScrollOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<ScrollSpeed>(1);

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const speedRef = useRef(speed);
  speedRef.current = speed;

  const animationFrameId = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (animationFrameId.current !== null) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    lastTimestampRef.current = null;
  }, []);

  const play = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) {
      pause();
    } else {
      play();
    }
  }, [pause, play]);

  const scrollToTop = useCallback(() => {
    pause();
    const el = containerRef.current;
    if (el) {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [containerRef, pause]);

  // Loop requestAnimationFrame
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isPlaying) {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      lastTimestampRef.current = null;
      return;
    }

    const step = (timestamp: number) => {
      if (!isPlayingRef.current) return;

      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      }

      const delta = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      const pixelsToScroll = basePixelsPerSecond * speedRef.current * delta;

      // Increment scroll position
      if (el) {
        el.scrollTop += pixelsToScroll;

        // Stop if reached the very end
        const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 2;
        if (isAtBottom) {
          pause();
          return;
        }
      }

      animationFrameId.current = requestAnimationFrame(step);
    };

    animationFrameId.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [isPlaying, containerRef, basePixelsPerSecond, pause]);

  // Pausa automática ao toque ou rolagem manual do usuário
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleUserInteraction = () => {
      if (isPlayingRef.current) {
        pause();
      }
    };

    el.addEventListener('touchstart', handleUserInteraction, { passive: true });
    el.addEventListener('wheel', handleUserInteraction, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleUserInteraction);
      el.removeEventListener('wheel', handleUserInteraction);
    };
  }, [containerRef, pause]);

  return {
    isPlaying,
    speed,
    setSpeed,
    play,
    pause,
    togglePlay,
    scrollToTop
  };
}
