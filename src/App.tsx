import { useState, useEffect, useCallback } from 'react';
import { seedDatabaseIfNeeded } from './db/seed';
import { getActiveSetlist, getSetlistFullData, getSetlistById } from './db/database';
import { StageView } from './components/stage/StageView';
import { ManagerLayout } from './components/manager/ManagerLayout';
import { LoginScreen } from './components/auth/LoginScreen';
import { PendingApprovalScreen } from './components/auth/PendingApprovalScreen';
import { useAuth } from './hooks/useAuth';
import type { ActiveStageSong, Setlist, AppViewMode, MemberProfile } from './types';
import { Flame, RefreshCw, WifiOff } from 'lucide-react';

export function App() {
  const [viewMode, setViewMode] = useState<AppViewMode>('stage');
  const [loading, setLoading] = useState(true);
  const [setlist, setSetlist] = useState<Setlist | null>(null);
  const [songs, setSongs] = useState<ActiveStageSong[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const {
    currentProfile,
    loginWithSupabase,
    registerWithSupabase,
    selectQuickProfile,
    refreshProfile,
    logout,
    authError,
    isConfigured: isSupabaseConfigured
  } = useAuth();

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

  const loadData = useCallback(async (customSetlistId?: string) => {
    try {
      setLoading(true);
      await seedDatabaseIfNeeded();

      let targetSetlist: Setlist | undefined;
      if (customSetlistId) {
        targetSetlist = await getSetlistById(customSetlistId);
      } else {
        targetSetlist = await getActiveSetlist();
      }

      if (targetSetlist) {
        setSetlist(targetSetlist);
        const stageSongs = await getSetlistFullData(targetSetlist.id);
        setSongs(stageSongs);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do banco offline (Dexie):', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Se não houver perfil salvo e o usuário não estiver já no modo palco direto, exibe tela de login/acesso
  useEffect(() => {
    const hasVisited = localStorage.getItem('rock_stage_has_visited');
    if (!hasVisited && !currentProfile) {
      setViewMode('login');
      localStorage.setItem('rock_stage_has_visited', 'true');
    }
  }, [currentProfile]);

  const handleLoginSuccess = (profile: MemberProfile) => {
    selectQuickProfile(profile);
    setViewMode('stage');
  };

  const handleEnterStage = async (setlistId?: string) => {
    if (setlistId) {
      await loadData(setlistId);
    } else {
      await loadData();
    }
    setViewMode('stage');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-black text-white font-mono gap-4 select-none">
        <Flame className="w-12 h-12 text-yellow-400 animate-bounce" />
        <div className="text-xl font-black uppercase tracking-widest text-zinc-100">
          Carregando Rock Stage...
        </div>
        <div className="text-xs text-zinc-500">
          Sincronizando armazenamento local Dexie.js (Offline First)
        </div>
      </div>
    );
  }

  // 1. TELA DE AGUARDANDO APROVAÇÃO (SE USUÁRIO FOR PENDENTE OU BLOQUEADO)
  if (currentProfile && (currentProfile.status === 'pending' || currentProfile.status === 'blocked')) {
    return (
      <PendingApprovalScreen
        currentProfile={currentProfile}
        onRefreshStatus={refreshProfile}
        onLogout={logout}
      />
    );
  }

  // 2. TELA DE LOGIN / ACESSO RÁPIDO DO INTEGRANTE
  if (viewMode === 'login') {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        onEnterStageDirectly={() => setViewMode('stage')}
        loginWithSupabase={loginWithSupabase}
        registerWithSupabase={registerWithSupabase}
        authError={authError}
        isSupabaseConfigured={isSupabaseConfigured}
      />
    );
  }

  // 2. PAINEL DE GERENCIAMENTO (SETLISTS, BIBLIOTECA, MÚSICAS)
  if (viewMode === 'manager') {
    return (
      <ManagerLayout
        currentProfile={currentProfile}
        onEnterStage={handleEnterStage}
        onLogout={logout}
        onChangeProfile={() => setViewMode('login')}
      />
    );
  }

  // 3. SE NÃO HOUVER MÚSICAS NO SETLIST
  if (songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-black text-white p-6 text-center select-none font-mono">
        <Flame className="w-12 h-12 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-black uppercase mb-2">Nenhum Repertório Encontrado</h2>
        <p className="text-zinc-400 max-w-md text-sm mb-6">
          Nenhuma música foi encontrada no banco local. Clique no botão abaixo para restaurar o repertório de demonstração.
        </p>
        <div className="flex gap-3">
          <button
            onClick={async () => {
              setLoading(true);
              await seedDatabaseIfNeeded(true);
              await loadData();
            }}
            className="flex items-center gap-2 px-6 py-3 bg-yellow-400 text-black font-black uppercase tracking-wider rounded-lg shadow-lg active:scale-95 transition text-xs"
          >
            <RefreshCw className="w-4 h-4" />
            Restaurar Demonstração
          </button>
          <button
            onClick={() => setViewMode('manager')}
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase tracking-wider rounded-lg text-xs transition"
          >
            Ir ao Gerenciador
          </button>
        </div>
      </div>
    );
  }

  // 4. MODO PALCO (OLED #000000, WAKE LOCK, CONTROLES DE PÉ E TOUCH)
  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden">
      {!isOnline && (
        <div className="absolute top-1 right-2 z-50 flex items-center gap-1 bg-zinc-900/90 border border-zinc-700 text-zinc-400 text-[10px] px-2 py-0.5 rounded-full font-mono pointer-events-none">
          <WifiOff className="w-3 h-3 text-yellow-400" />
          <span>OFFLINE (DEXIE)</span>
        </div>
      )}
      <StageView
        songs={songs}
        setlist={setlist}
        onExitStage={() => setViewMode('manager')}
      />
    </div>
  );
}

export default App;
