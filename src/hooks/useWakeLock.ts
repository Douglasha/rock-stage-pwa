import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseWakeLockReturn {
  isSupported: boolean;
  isLocked: boolean;
  requestWakeLock: () => Promise<void>;
  releaseWakeLock: () => Promise<void>;
  error: string | null;
}

/**
 * Hook para manter a tela do celular/tablet acesa no palco
 * Utiliza a Screen Wake Lock API e reativa automaticamente ao retornar ao app.
 */
export function useWakeLock(autoRequest = true): UseWakeLockReturn {
  const [isLocked, setIsLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wakeLockRef = useRef<any>(null);

  const isSupported = typeof window !== 'undefined' && 'wakeLock' in navigator;

  const requestWakeLock = useCallback(async () => {
    if (!isSupported) {
      setError('Screen Wake Lock não é suportado neste navegador');
      return;
    }

    try {
      const lock = await (navigator as any).wakeLock.request('screen');
      wakeLockRef.current = lock;
      setIsLocked(true);
      setError(null);

      lock.addEventListener('release', () => {
        setIsLocked(false);
      });
    } catch (err: any) {
      setError(err?.message || 'Falha ao solicitar Wake Lock');
      setIsLocked(false);
    }
  }, [isSupported]);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch (err: any) {
        console.warn('Erro ao liberar Wake Lock:', err);
      } finally {
        wakeLockRef.current = null;
        setIsLocked(false);
      }
    }
  }, []);

  // Re-solicita wake lock quando a aba/app volta para o primeiro plano
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && autoRequest && !isLocked) {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [autoRequest, isLocked, requestWakeLock]);

  // Ativa automaticamente na montagem se solicitado
  useEffect(() => {
    if (autoRequest) {
      requestWakeLock();
    }
    return () => {
      releaseWakeLock();
    };
  }, [autoRequest, requestWakeLock, releaseWakeLock]);

  return {
    isSupported,
    isLocked,
    requestWakeLock,
    releaseWakeLock,
    error
  };
}
