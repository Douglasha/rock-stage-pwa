import { useEffect } from 'react';

interface UsePedalControlsOptions {
  onNextSong: () => void;
  onPrevSong: () => void;
  onToggleScroll?: () => void;
  onScrollToTop?: () => void;
  enabled?: boolean;
}

/**
 * Hook para suporte a pedais de pé Bluetooth (AirTurn, PageFlip, Donner, etc.)
 * e atalhos de teclado de troca instantânea.
 */
export function usePedalControls({
  onNextSong,
  onPrevSong,
  onToggleScroll,
  onScrollToTop,
  enabled = true
}: UsePedalControlsOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignora se o usuário estiver digitando em um input ou textarea
      const target = event.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      switch (event.code) {
        case 'ArrowRight':
        case 'PageDown':
          event.preventDefault();
          onNextSong();
          break;

        case 'ArrowLeft':
        case 'PageUp':
          event.preventDefault();
          onPrevSong();
          break;

        case 'Space':
          event.preventDefault();
          if (onToggleScroll) {
            onToggleScroll();
          }
          break;

        case 'Home':
        case 'KeyT':
          event.preventDefault();
          if (onScrollToTop) {
            onScrollToTop();
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, onNextSong, onPrevSong, onToggleScroll, onScrollToTop]);
}
