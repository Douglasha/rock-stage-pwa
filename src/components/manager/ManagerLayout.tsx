import React, { useState } from 'react';
import {
  ListMusic,
  Library,
  Users,
  Play,
  LogOut,
  Flame,
  Guitar,
  Mic,
  Drum,
  UserCheck
} from 'lucide-react';
import { SetlistManager } from './SetlistManager';
import { SongLibrary } from './SongLibrary';
import { UserManagement } from './UserManagement';
import type { MemberProfile, InstrumentType, Song } from '../../types';

interface ManagerLayoutProps {
  currentProfile: MemberProfile | null;
  onEnterStage: (setlistId?: string) => void;
  onPlayStandaloneSong?: (song: Song) => void;
  onLogout: () => void;
  onChangeProfile: () => void;
}

export const ManagerLayout: React.FC<ManagerLayoutProps> = ({
  currentProfile,
  onEnterStage,
  onPlayStandaloneSong,
  onLogout,
  onChangeProfile
}) => {
  const [activeTab, setActiveTab] = useState<'setlists' | 'songs' | 'users'>('setlists');
  const isAdmin = currentProfile?.role === 'admin';

  const instrumentIcons: Record<InstrumentType, React.ReactNode> = {
    guitar_1: <Guitar className="w-4 h-4 text-yellow-400" />,
    guitar_2: <Guitar className="w-4 h-4 text-amber-500" />,
    bass: <Guitar className="w-4 h-4 text-cyan-400" />,
    drums: <Drum className="w-4 h-4 text-rose-400" />,
    vocals: <Mic className="w-4 h-4 text-yellow-300" />,
    keys: <Guitar className="w-4 h-4 text-purple-400" />,
    general: <UserCheck className="w-4 h-4 text-zinc-400" />
  };

  return (
    <div className="min-h-screen w-screen bg-black text-white flex flex-col selection:bg-yellow-500 selection:text-black">
      {/* Top Header */}
      <header className="bg-zinc-950 border-b border-zinc-800 px-4 py-3 select-none">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Logo e Nome da Banda */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-yellow-400/10 border border-yellow-500/30 text-yellow-400">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
                Delta Brothers
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                  GERENCIADOR
                </span>
              </h1>
              {currentProfile && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  {instrumentIcons[currentProfile.instrument]}
                  <span>{currentProfile.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Ações de Topo: Botão MODO PALCO + Perfil */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEnterStage()}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-wider text-xs sm:text-sm rounded-xl shadow-xl shadow-yellow-500/20 active:scale-95 transition"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Modo Palco ⚡</span>
            </button>

            <button
              onClick={onChangeProfile}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition"
              title="Trocar Integrante / Instrumento"
            >
              <Users className="w-4 h-4" />
            </button>

            <button
              onClick={onLogout}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-red-400 transition"
              title="Desconectar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Abas de Navegação */}
      <div className="bg-zinc-950/70 border-b border-zinc-800/80 px-4">
        <div className="max-w-6xl mx-auto flex gap-4 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('setlists')}
            className={`flex items-center gap-2 py-3 border-b-2 transition ${
              activeTab === 'setlists'
                ? 'border-yellow-400 text-yellow-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <ListMusic className="w-4 h-4" />
            <span>Repertórios (Setlists)</span>
          </button>

          <button
            onClick={() => setActiveTab('songs')}
            className={`flex items-center gap-2 py-3 border-b-2 transition ${
              activeTab === 'songs'
                ? 'border-yellow-400 text-yellow-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Library className="w-4 h-4" />
            <span>Biblioteca de Músicas</span>
          </button>

          {/* Aba exclusiva para Administradores */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 py-3 border-b-2 transition ${
                activeTab === 'users'
                  ? 'border-yellow-400 text-yellow-400 font-black'
                  : 'border-transparent text-yellow-500/80 hover:text-yellow-400'
              }`}
            >
              <Users className="w-4 h-4 text-yellow-400" />
              <span>Integrantes & Permissões</span>
            </button>
          )}
        </div>
      </div>

      {/* Área de Conteúdo */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6">
        {activeTab === 'setlists' && <SetlistManager onEnterStage={onEnterStage} />}
        {activeTab === 'songs' && <SongLibrary onPlayStandaloneSong={onPlayStandaloneSong} />}
        {activeTab === 'users' && <UserManagement currentAdminId={currentProfile?.id || ''} />}
      </main>
    </div>
  );
};
