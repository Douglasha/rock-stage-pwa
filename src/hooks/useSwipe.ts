import { useEffect, useRef, RefObject } from 'react';

interface UseSwipeOptions {
  containerRef: RefObject<HTMLElement>;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minSwipeDistance?: number;
  maxVerticalRatio?: number;
  enabled?: boolean;
}

/**
 * Hook para detectar gestos de deslize horizontal (Swipe) em telas sensíveis ao toque
 * Permite trocar de música sem interferir na rolagem vertical da letra.
 */
export function useSwipe({
  containerRef,
  onSwipeLeft,
  onSwipeRight,
  minSwipeDistance = 60,
  maxVerticalRatio = 0.8,
  enabled = true
}: UseSwipeOptions) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;

      // Reset
      touchStartX.current = null;
      touchStartY.current = null;

      // Se o movimento vertical for preponderante, é uma rolagem normal da letra
      if (Math.abs(deltaY) > Math.abs(deltaX) * maxVerticalRatio) {
        return;
      }

      // Deslize para a esquerda (próxima música)
      if (deltaX < -minSwipeDistance && onSwipeLeft) {
        onSwipeLeft();
      }

      // Deslize para a direita (música anterior)
      if (deltaX > minSwipeDistance && onSwipeRight) {
        onSwipeRight();
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [containerRef, onSwipeLeft, onSwipeRight, minSwipeDistance, maxVerticalRatio, enabled]);
}
