import React, { useState, useEffect } from 'react';
import {
  Flame,
  Guitar,
  Mic,
  Drum,
  UserCheck,
  LogIn,
  UserPlus,
  Zap,
  Wifi,
  WifiOff,
  AlertCircle
} from 'lucide-react';
import { db } from '../../db/database';
import type { MemberProfile, InstrumentType } from '../../types';

interface LoginScreenProps {
  onLoginSuccess: (profile: MemberProfile) => void;
  onEnterStageDirectly: () => void;
  loginWithSupabase: (email: string, pass: string) => Promise<boolean>;
  registerWithSupabase: (
    name: string,
    email: string,
    pass: string,
    instrument: InstrumentType,
    bandName: string
  ) => Promise<boolean>;
  authError: string | null;
  isSupabaseConfigured: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onEnterStageDirectly,
  loginWithSupabase,
  registerWithSupabase,
  authError,
  isSupabaseConfigured
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'quick'>('login');
  const [profiles, setProfiles] = useState<MemberProfile[]>([]);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [bandName, setBandName] = useState('Delta Brothers');
  const [instrument, setInstrument] = useState<InstrumentType>('guitar_1');
  const [submitting, setSubmitting] = useState(false);

  // Carrega perfis do banco local (Dexie)
  useEffect(() => {
    const loadProfiles = async () => {
      const list = await db.profiles.toArray();
      setProfiles(list);
    };
    loadProfiles();
  }, []);

  const instrumentIcons: Record<InstrumentType, React.ReactNode> = {
    guitar_1: <Guitar className="w-5 h-5 text-yellow-400" />,
    guitar_2: <Guitar className="w-5 h-5 text-amber-500" />,
    bass: <Guitar className="w-5 h-5 text-cyan-400" />,
    drums: <Drum className="w-5 h-5 text-rose-400" />,
    vocals: <Mic className="w-5 h-5 text-yellow-300" />,
    keys: <Zap className="w-5 h-5 text-purple-400" />,
    general: <UserCheck className="w-5 h-5 text-zinc-400" />
  };

  const instrumentLabels: Record<InstrumentType, string> = {
    guitar_1: 'Guitarra Solo (G1)',
    guitar_2: 'Guitarra Base (G2)',
    bass: 'Contrabaixo',
    drums: 'Bateria',
    vocals: 'Voz Principal',
    keys: 'Teclado',
    general: 'Geral'
  };

  const handleQuickSelect = (profile: MemberProfile) => {
    onLoginSuccess(profile);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    const success = await loginWithSupabase(email, password);
    setSubmitting(false);
    if (success) {
      const cleanEmail = email.trim().toLowerCase();
      const saved = await db.profiles.filter((p) => p.email.toLowerCase() === cleanEmail).first();
      if (saved) onLoginSuccess(saved);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;
    setSubmitting(true);
    const success = await registerWithSupabase(name, email, password, instrument, bandName);
    setSubmitting(false);
    if (success) {
      const cleanEmail = email.trim().toLowerCase();
      const saved = await db.profiles.filter((p) => p.email.toLowerCase() === cleanEmail).first();
      if (saved) onLoginSuccess(saved);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-black text-white flex flex-col items-center justify-center p-4 selection:bg-yellow-500 selection:text-black">
      {/* Card Principal */}
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="p-6 text-center border-b border-zinc-800/80 bg-zinc-900/30 relative">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-yellow-400/10 border border-yellow-500/30 text-yellow-400 mb-3 shadow-lg shadow-yellow-500/10">
            <Flame className="w-8 h-8 fill-current" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-white">
            Delta Brothers
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Repertório ao vivo, cifras e letras sem dead air
          </p>

          {/* Indicador de Conexão Supabase */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono border bg-zinc-900 border-zinc-800">
            {isSupabaseConfigured ? (
              <>
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Supabase Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-yellow-400" />
                <span className="text-zinc-400">Armazenamento Local (Dexie)</span>
              </>
            )}
          </div>
        </div>

        {/* Abas de Navegação */}
        <div className="flex border-b border-zinc-800 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-3 text-center border-b-2 transition ${
              tab === 'login'
                ? 'border-yellow-400 text-yellow-400 bg-yellow-400/5'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-3 text-center border-b-2 transition ${
              tab === 'register'
                ? 'border-yellow-400 text-yellow-400 bg-yellow-400/5'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Cadastrar
          </button>
          <button
            onClick={() => setTab('quick')}
            className={`flex-1 py-3 text-center border-b-2 transition ${
              tab === 'quick'
                ? 'border-yellow-400 text-yellow-400 bg-yellow-400/5'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Acesso Rápido
          </button>
        </div>

        {/* Mensagem de Erro se houver */}
        {authError && (
          <div className="mx-6 mt-4 p-3 bg-red-950/60 border border-red-800/80 rounded-lg flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{authError}</span>
          </div>
        )}

        {/* Conteúdo das Abas */}
        <div className="p-6">
          {/* 1. ABA: LOGIN */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                  E-mail do Integrante
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: vocalista@banda.com ou douglas@banda.com"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400 text-sm font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400 text-sm font-sans"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-wider rounded-xl shadow-lg shadow-yellow-400/20 active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                {submitting ? 'Entrando...' : 'Entrar no Aplicativo'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setTab('register')}
                  className="text-xs text-zinc-400 hover:text-yellow-400 transition"
                >
                  Novo na banda? <strong className="text-yellow-400 underline">Crie sua conta aqui</strong>
                </button>
              </div>
            </form>
          )}

          {/* 2. ABA: CADASTRAR INTEGRANTE */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                  Seu Nome
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Douglas, Slash, Bruce"
                  className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                  Instrumento Principal
                </label>
                <select
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value as InstrumentType)}
                  className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-yellow-400 text-sm"
                >
                  <option value="vocals">Voz Principal / Vocalista</option>
                  <option value="guitar_1">Guitarra Solo (G1)</option>
                  <option value="guitar_2">Guitarra Base (G2)</option>
                  <option value="bass">Contrabaixo</option>
                  <option value="drums">Bateria</option>
                  <option value="keys">Teclado</option>
                  <option value="general">Outro / Geral</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                  Nome da Banda
                </label>
                <input
                  type="text"
                  value={bandName}
                  onChange={(e) => setBandName(e.target.value)}
                  placeholder="Nome da sua banda"
                  className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@banda.com"
                  className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400 text-sm"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-wider rounded-xl shadow-lg shadow-yellow-400/20 active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                {submitting ? 'Cadastrando...' : 'Criar Perfil na Banda'}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className="text-xs text-zinc-400 hover:text-yellow-400 transition"
                >
                  Já tem uma conta? <strong className="text-yellow-400 underline">Faça login</strong>
                </button>
              </div>
            </form>
          )}

          {/* 3. ABA: ACESSO RÁPIDO DE PALCO (OFFLINE) */}
          {tab === 'quick' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wide">
                  Selecione seu perfil pré-configurado:
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Ideal para passagens de som rápidas ou celulares de palco sem conexão à internet:
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleQuickSelect(p)}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800 hover:border-yellow-500/60 transition active:scale-[0.98] text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-black border border-zinc-800 group-hover:border-zinc-700">
                        {instrumentIcons[p.instrument] || <UserCheck className="w-5 h-5 text-yellow-400" />}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white group-hover:text-yellow-400 transition">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono">
                          {instrumentLabels[p.instrument] || p.instrument} •{' '}
                          <span className={p.role === 'admin' ? 'text-yellow-400 font-bold' : ''}>
                            {p.role === 'admin' ? 'ADMIN' : 'MEMBRO'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-yellow-400 group-hover:translate-x-0.5 transition">
                      Entrar →
                    </span>
                  </button>
                ))}
              </div>

              {/* Acesso rápido sem perfil */}
              <div className="pt-2 border-t border-zinc-800/80">
                <button
                  onClick={onEnterStageDirectly}
                  className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl active:scale-95 transition flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Entrar como Convidado de Palco ⚡
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
