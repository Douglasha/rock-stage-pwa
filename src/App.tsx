import { useState, useEffect, useCallback } from 'react';
import { seedDatabaseIfNeeded } from './db/seed';
import { getActiveSetlist, getSetlistFullData, getSetlistById } from './db/database';
import { StageView } from './components/stage/StageView';
import { ManagerLayout } from './components/manager/ManagerLayout';
import { LoginScreen } from './components/auth/LoginScreen';
import { PendingApprovalScreen } from './components/auth/PendingApprovalScreen';
import { useAuth } from './hooks/useAuth';
import type { ActiveStageSong, Setlist, AppViewMode, MemberProfile } from './types';
import { Flame, WifiOff } from 'lucide-react';

export function App() {
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

  const [viewMode, setViewMode] = useState<AppViewMode>(() => {
    return currentProfile ? 'manager' : 'login';
  });
  const [loading, setLoading] = useState(true);
  const [setlist, setSetlist] = useState<Setlist | null>(null);
  const [songs, setSongs] = useState<ActiveStageSong[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Solicita persistência de dados no navegador
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }

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

  const handleLoginSuccess = (profile: MemberProfile) => {
    selectQuickProfile(profile);
    if (profile.status === 'approved') {
      setViewMode('manager');
    }
  };

  const handleEnterStage = async (setlistId?: string) => {
    if (setlistId) {
      await loadData(setlistId);
    } else {
      await loadData();
    }
    setViewMode('stage');
  };

  const handleLogout = async () => {
    await logout();
    setViewMode('login');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-black text-white font-mono gap-4 select-none">
        <Flame className="w-12 h-12 text-yellow-400 animate-bounce" />
        <div className="text-xl font-black uppercase tracking-widest text-zinc-100">
          Carregando Delta Brothers...
        </div>
        <div className="text-xs text-zinc-500">
          Sincronizando armazenamento local Dexie.js (Offline First)
        </div>
      </div>
    );
  }

  // 1. SE NÃO HOUVER USUÁRIO LOGADO OU O MODO FOR LOGIN: EXIBE TELA DE LOGIN
  if (!currentProfile || viewMode === 'login') {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        onEnterStageDirectly={() => {
          const guestProfile: MemberProfile = {
            id: `guest-${Date.now()}`,
            band_id: 'b001-rock-band',
            name: 'Convidado de Palco',
            email: 'convidado@banda.com',
            instrument: 'general',
            role: 'member',
            status: 'approved',
            created_at: new Date().toISOString()
          };
          selectQuickProfile(guestProfile);
          setViewMode('stage');
        }}
        loginWithSupabase={loginWithSupabase}
        registerWithSupabase={registerWithSupabase}
        authError={authError}
        isSupabaseConfigured={isSupabaseConfigured}
      />
    );
  }

  // 2. SE USUÁRIO ESTIVER PENDENTE DE APROVAÇÃO OU BLOQUEADO: TELA DE ESPERA
  if (currentProfile.status === 'pending' || currentProfile.status === 'blocked') {
    return (
      <PendingApprovalScreen
        currentProfile={currentProfile}
        onRefreshStatus={refreshProfile}
        onLogout={handleLogout}
      />
    );
  }

  // 3. PAINEL DE GERENCIAMENTO (SETLISTS, BIBLIOTECA, MÚSICAS, PERMISSÕES)
  if (viewMode === 'manager') {
    return (
      <ManagerLayout
        currentProfile={currentProfile}
        onEnterStage={handleEnterStage}
        onLogout={handleLogout}
        onChangeProfile={handleLogout}
      />
    );
  }

  // 4. SE NÃO HOUVER MÚSICAS NO SETLIST SELECIONADO
  if (songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-black text-white p-6 text-center select-none font-mono">
        <Flame className="w-12 h-12 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-black uppercase mb-2">Setlist Vazio</h2>
        <p className="text-zinc-400 max-w-md text-sm mb-6">
          O setlist ativo não possui músicas vinculadas no momento. Abra o Gerenciador de Repertórios para adicionar músicas ao setlist.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setViewMode('manager')}
            className="flex items-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-wider rounded-lg shadow-lg active:scale-95 transition text-xs"
          >
            Abrir Gerenciador de Repertórios
          </button>
        </div>
      </div>
    );
  }

  // 5. MODO PALCO (OLED #000000, WAKE LOCK, CONTROLES DE PÉ E TOUCH)
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
