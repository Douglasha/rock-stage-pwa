import { useState, useEffect } from 'react';
import { seedDatabaseIfNeeded } from './db/seed';
import { getActiveSetlist, getSetlistFullData } from './db/database';
import { StageView } from './components/stage/StageView';
import type { ActiveStageSong, Setlist } from './types';
import { Flame, RefreshCw, WifiOff } from 'lucide-react';

export function App() {
  const [loading, setLoading] = useState(true);
  const [setlist, setSetlist] = useState<Setlist | null>(null);
  const [songs, setSongs] = useState<ActiveStageSong[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await seedDatabaseIfNeeded();

      const activeSetlist = await getActiveSetlist();
      if (activeSetlist) {
        setSetlist(activeSetlist);
        const stageSongs = await getSetlistFullData(activeSetlist.id);
        setSongs(stageSongs);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do banco offline (Dexie):', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-black text-white font-mono gap-4 select-none">
        <Flame className="w-12 h-12 text-yellow-400 animate-bounce" />
        <div className="text-xl font-black uppercase tracking-widest text-zinc-100">
          Carregando Modo Palco...
        </div>
        <div className="text-xs text-zinc-500">
          Inicializando armazenamento local Dexie.js (Offline First)
        </div>
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-black text-white p-6 text-center select-none font-mono">
        <Flame className="w-12 h-12 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-black uppercase mb-2">Nenhum Repertório Encontrado</h2>
        <p className="text-zinc-400 max-w-md text-sm mb-6">
          Nenhuma música foi encontrada no banco local. Clique no botão abaixo para restaurar o repertório de demonstração.
        </p>
        <button
          onClick={async () => {
            setLoading(true);
            await seedDatabaseIfNeeded(true);
            await loadData();
          }}
          className="flex items-center gap-2 px-6 py-3 bg-yellow-400 text-black font-black uppercase tracking-wider rounded-lg shadow-lg active:scale-95 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Carregar Repertório Rock Demo
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden">
      {!isOnline && (
        <div className="absolute top-1 right-2 z-50 flex items-center gap-1 bg-zinc-900/90 border border-zinc-700 text-zinc-400 text-[10px] px-2 py-0.5 rounded-full font-mono pointer-events-none">
          <WifiOff className="w-3 h-3 text-yellow-400" />
          <span>OFFLINE (DEXIE)</span>
        </div>
      )}
      <StageView songs={songs} setlist={setlist} />
    </div>
  );
}

export default App;
