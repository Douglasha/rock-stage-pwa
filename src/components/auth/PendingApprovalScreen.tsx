import React, { useState } from 'react';
import { Clock, ShieldX, RefreshCw, LogOut, Flame } from 'lucide-react';
import type { MemberProfile } from '../../types';

interface PendingApprovalScreenProps {
  currentProfile: MemberProfile;
  onRefreshStatus: () => Promise<void>;
  onLogout: () => void;
}

export const PendingApprovalScreen: React.FC<PendingApprovalScreenProps> = ({
  currentProfile,
  onRefreshStatus,
  onLogout
}) => {
  const [checking, setChecking] = useState(false);
  const isBlocked = currentProfile.status === 'blocked';

  const handleCheck = async () => {
    setChecking(true);
    await onRefreshStatus();
    setChecking(false);
  };

  return (
    <div className="min-h-screen w-screen bg-black text-white flex flex-col items-center justify-center p-4 selection:bg-yellow-500 selection:text-black">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-center space-y-6">
        {/* Ícone */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border shadow-xl mx-auto transition">
          {isBlocked ? (
            <div className="w-full h-full rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
              <ShieldX className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-full h-full rounded-full bg-yellow-400/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>
          )}
        </div>

        {/* Título e Explicação */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
            {isBlocked ? 'Acesso Bloqueado' : 'Aguardando Aprovação'}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            {isBlocked
              ? 'Seu acesso a este aplicativo foi suspenso por um Administrador da banda. Entre em contato com o líder da banda para liberar o uso.'
              : 'Seu cadastro foi recebido com sucesso! Para proteger os repertórios, letras e cifras, um Administrador da banda precisa autorizar o seu perfil antes do primeiro show.'}
          </p>
        </div>

        {/* Card com Detalhes do Usuário */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-left text-xs font-mono space-y-2">
          <div className="flex justify-between">
            <span className="text-zinc-500 uppercase">Integrante:</span>
            <span className="font-bold text-white">{currentProfile.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 uppercase">E-mail:</span>
            <span className="text-zinc-300">{currentProfile.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 uppercase">Instrumento:</span>
            <span className="text-yellow-400 font-bold uppercase">{currentProfile.instrument}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 uppercase">Status Atual:</span>
            <span
              className={`font-black uppercase px-2 py-0.5 rounded text-[10px] ${
                isBlocked
                  ? 'bg-red-950 text-red-400 border border-red-800'
                  : 'bg-yellow-950 text-yellow-400 border border-yellow-800'
              }`}
            >
              {isBlocked ? 'BLOQUEADO' : 'PENDENTE'}
            </span>
          </div>
        </div>

        {/* Ações */}
        <div className="space-y-2.5 pt-2">
          {!isBlocked && (
            <button
              onClick={handleCheck}
              disabled={checking}
              className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-yellow-400/20 active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'Verificando...' : 'Verificar Aprovação Novamente'}</span>
            </button>
          )}

          <button
            onClick={onLogout}
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-zinc-800 transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Trocar de Perfil / Sair</span>
          </button>
        </div>

        <div className="flex items-center justify-center gap-1 text-[11px] text-zinc-500 font-mono">
          <Flame className="w-3.5 h-3.5 text-yellow-500" />
          <span>Delta Brothers - Modo Palco</span>
        </div>
      </div>
    </div>
  );
};
