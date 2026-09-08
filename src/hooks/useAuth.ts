import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { db } from '../db/database';
import type { MemberProfile, InstrumentType } from '../types';

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

  // Carrega ou valida a sessão
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user) {
            const user = sessionData.session.user;
            // Busca o perfil no banco ou monta um baseado no user
            const localProfile = await db.profiles.where('id').equals(user.id).first();
            if (localProfile) {
              setCurrentProfile(localProfile);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(localProfile));
            } else {
              const fallback: MemberProfile = {
                id: user.id,
                band_id: 'b001-rock-band',
                name: user.user_metadata?.name || user.email?.split('@')[0] || 'Músico',
                email: user.email || '',
                instrument: (user.user_metadata?.instrument as InstrumentType) || 'guitar_1',
                role: (user.user_metadata?.role as 'leader' | 'member') || 'member',
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

  // Login com e-mail e senha via Supabase
  const loginWithSupabase = useCallback(async (email: string, pass: string) => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthError('Supabase não está configurado neste ambiente');
      return false;
    }

    setLoading(true);
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass
      });

      if (error) {
        setAuthError(error.message);
        return false;
      }

      if (data.user) {
        const user = data.user;
        const profile: MemberProfile = {
          id: user.id,
          band_id: user.user_metadata?.band_id || 'b001-rock-band',
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Músico',
          email: user.email || '',
          instrument: (user.user_metadata?.instrument as InstrumentType) || 'guitar_1',
          role: (user.user_metadata?.role as 'leader' | 'member') || 'member',
          created_at: new Date().toISOString()
        };

        await db.profiles.put(profile);
        setCurrentProfile(profile);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        return true;
      }
      return false;
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao realizar login');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cadastro de novo integrante via Supabase
  const registerWithSupabase = useCallback(
    async (name: string, email: string, pass: string, instrument: InstrumentType, bandName: string) => {
      if (!isSupabaseConfigured || !supabase) {
        setAuthError('Supabase não está configurado neste ambiente');
        return false;
      }

      setLoading(true);
      setAuthError(null);
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: {
            data: {
              name,
              instrument,
              band_name: bandName,
              role: 'member'
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
            email,
            instrument,
            role: 'member',
            created_at: new Date().toISOString()
          };

          await db.profiles.put(profile);
          setCurrentProfile(profile);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
          return true;
        }
        return false;
      } catch (err: any) {
        setAuthError(err.message || 'Erro ao criar conta');
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Logout
  const logout = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentProfile(null);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Erro ao deslogar do Supabase:', err);
      }
    }
  }, []);

  return {
    currentProfile,
    loading,
    authError,
    setAuthError,
    isConfigured: isSupabaseConfigured,
    selectQuickProfile,
    loginWithSupabase,
    registerWithSupabase,
    logout
  };
}
