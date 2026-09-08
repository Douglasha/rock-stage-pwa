import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { db } from '../db/database';
import type { MemberProfile, InstrumentType, UserRole, UserStatus } from '../types';

const STORAGE_KEY = 'rock_stage_active_profile';

export function useAuth() {
  const [currentProfile, setCurrentProfile] = useState<MemberProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Recarrega o perfil mais recente do banco local / Supabase
  const refreshProfile = useCallback(async () => {
    if (!currentProfile) return;
    try {
      const updated = await db.profiles.get(currentProfile.id);
      if (updated) {
        setCurrentProfile(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (err) {
      console.warn('Erro ao atualizar perfil:', err);
    }
  }, [currentProfile]);

  // Carrega ou valida a sessão ao montar
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user) {
            const user = sessionData.session.user;
            const localProfile = await db.profiles.where('id').equals(user.id).first();
            if (localProfile) {
              setCurrentProfile(localProfile);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(localProfile));
            } else {
              const profilesCount = await db.profiles.count();
              const isFirstUser = profilesCount === 0;

              const fallback: MemberProfile = {
                id: user.id,
                band_id: 'b001-rock-band',
                name: user.user_metadata?.name || user.email?.split('@')[0] || 'Músico',
                email: user.email?.toLowerCase() || '',
                instrument: (user.user_metadata?.instrument as InstrumentType) || 'guitar_1',
                role: isFirstUser ? 'admin' : (user.user_metadata?.role as UserRole) || 'member',
                status: isFirstUser ? 'approved' : 'pending',
                approved_at: isFirstUser ? new Date().toISOString() : null,
                created_at: new Date().toISOString()
              };
              await db.profiles.put(fallback);
              setCurrentProfile(fallback);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
            }
          }
        }
      } catch (err) {
        console.warn('Erro ao inicializar sessão do Supabase:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Seleciona um perfil localmente (Acesso Rápido de Palco / Offline)
  const selectQuickProfile = useCallback((profile: MemberProfile) => {
    setCurrentProfile(profile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    setAuthError(null);
  }, []);

  // Login com e-mail e senha (compatível com Supabase Online e Dexie Local Offline)
  const loginWithSupabase = useCallback(async (email: string, pass: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    setLoading(true);
    setAuthError(null);

    try {
      // 1. MODO ONLINE VIA SUPABASE (SE CONFIGURADO)
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: pass
        });

        if (error) {
          setAuthError(error.message);
          return false;
        }

        if (data.user) {
          const user = data.user;
          const local = await db.profiles.where('id').equals(user.id).first();
          if (local) {
            setCurrentProfile(local);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(local));
          } else {
            const profile: MemberProfile = {
              id: user.id,
              band_id: user.user_metadata?.band_id || 'b001-rock-band',
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'Músico',
              email: cleanEmail,
              instrument: (user.user_metadata?.instrument as InstrumentType) || 'guitar_1',
              role: (user.user_metadata?.role as UserRole) || 'member',
              status: (user.user_metadata?.status as UserStatus) || 'pending',
              created_at: new Date().toISOString()
            };

            await db.profiles.put(profile);
            setCurrentProfile(profile);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
          }
          return true;
        }
        return false;
      }

      // 2. MODO OFFLINE / LOCAL VIA DEXIE.JS (SE SUPABASE NÃO CONFIGURADO)
      const localUser = await db.profiles
        .filter((p) => p.email.toLowerCase() === cleanEmail)
        .first();

      if (localUser) {
        setCurrentProfile(localUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(localUser));
        return true;
      }

      setAuthError(`E-mail "${cleanEmail}" não encontrado no banco local. Se você ainda não criou uma conta, cadastre-se na aba "Cadastrar".`);
      return false;
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao realizar login');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cadastro de novo integrante (compatível com Supabase Online e Dexie Local Offline)
  const registerWithSupabase = useCallback(
    async (
      name: string,
      email: string,
      pass: string,
      instrument: InstrumentType,
      bandName: string
    ): Promise<boolean> => {
      const cleanEmail = email.trim().toLowerCase();
      setLoading(true);
      setAuthError(null);

      try {
        // Regra do primeiro cadastro: se for o primeiro usuário da base, nasce como Admin aprovado
        const profilesCount = await db.profiles.count();
        const isFirstUser = profilesCount === 0;
        const role: UserRole = isFirstUser ? 'admin' : 'member';
        const status: UserStatus = isFirstUser ? 'approved' : 'pending';

        // 1. MODO ONLINE VIA SUPABASE
        if (isSupabaseConfigured && supabase) {
          const { data, error } = await supabase.auth.signUp({
            email: cleanEmail,
            password: pass,
            options: {
              data: {
                name,
                instrument,
                band_name: bandName,
                role,
                status
              }
            }
          });

          if (error) {
            setAuthError(error.message);
            return false;
          }

          if (data.user) {
            const profile: MemberProfile = {
              id: data.user.id,
              band_id: 'b001-rock-band',
              name,
              email: cleanEmail,
              instrument,
              role,
              status,
              approved_at: isFirstUser ? new Date().toISOString() : null,
              created_at: new Date().toISOString()
            };

            await db.profiles.put(profile);
            setCurrentProfile(profile);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
            return true;
          }
          return false;
        }

        // 2. MODO OFFLINE / LOCAL VIA DEXIE.JS
        const existing = await db.profiles
          .filter((p) => p.email.toLowerCase() === cleanEmail)
          .first();

        if (existing) {
          setAuthError(`O e-mail "${cleanEmail}" já está cadastrado. Faça login na aba "Login".`);
          return false;
        }

        const newProfile: MemberProfile = {
          id: `local-user-${Date.now()}`,
          band_id: 'b001-rock-band',
          name: name.trim(),
          email: cleanEmail,
          instrument,
          role,
          status,
          approved_at: isFirstUser ? new Date().toISOString() : null,
          created_at: new Date().toISOString()
        };

        await db.profiles.put(newProfile);
        setCurrentProfile(newProfile);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
        return true;
      } catch (err: any) {
        setAuthError(err.message || 'Erro ao criar conta');
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Logout completo
  const logout = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentProfile(null);
    setAuthError(null);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Erro ao deslogar do Supabase:', err);
      }
    }
  }, []);

  const isAdmin = currentProfile?.role === 'admin';
  const isApproved = currentProfile?.status === 'approved';
  const isPending = currentProfile?.status === 'pending';
  const isBlocked = currentProfile?.status === 'blocked';

  return {
    currentProfile,
    loading,
    authError,
    setAuthError,
    isConfigured: isSupabaseConfigured,
    isAdmin,
    isApproved,
    isPending,
    isBlocked,
    selectQuickProfile,
    loginWithSupabase,
    registerWithSupabase,
    refreshProfile,
    logout
  };
}
