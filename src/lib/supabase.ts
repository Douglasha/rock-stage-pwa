import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Remove /rest/v1 ou barras extras no final caso o usuário cole com a rota REST
const cleanUrl = rawUrl
  ? rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
  : '';

export const isSupabaseConfigured = Boolean(cleanUrl && rawKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(cleanUrl, rawKey)
  : null;
