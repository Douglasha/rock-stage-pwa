// ==============================================================================
// ROCK STAGE PWA - DATA TYPES & SCHEMAS
// ==============================================================================

export interface Band {
  id: string;
  name: string;
  created_at: string;
}

export interface Song {
  id: string;
  band_id: string;
  title: string;
  artist: string;
  key: string;
  bpm: number;
  duration_sec: number;
  lyrics: string;
  structure: string; // e.g., "[Intro] [V1] [Refrão] [Solo] [Outro]"
  created_at: string;
}

export interface Setlist {
  id: string;
  band_id: string;
  title: string;
  event_date: string | null;
  venue: string;
  is_active: boolean;
  created_at: string;
}

export interface SetlistItem {
  id: string;
  setlist_id: string;
  song_id: string;
  position: number;
  set_block: string; // e.g. "Abertura", "Bloco 1", "Bloco 2", "Bis"
  override_key?: string | null;
  specific_note?: string;
  created_at: string;
}

export interface SongNote {
  id: string;
  song_id: string;
  user_id?: string | null;
  instrument: string; // 'guitar_1' | 'guitar_2' | 'bass' | 'drums' | 'keys' | 'vocals' | 'general'
  content: string;
  created_at: string;
}

// Composite type for the active performance view on stage
export interface ActiveStageSong {
  item: SetlistItem;
  song: Song;
  effectiveKey: string;
  notes: SongNote[];
  totalInSet: number;
  currentIndex: number;
}

export type InstrumentType =
  | 'guitar_1'
  | 'guitar_2'
  | 'bass'
  | 'drums'
  | 'keys'
  | 'vocals'
  | 'general';

export type UserStatus = 'pending' | 'approved' | 'blocked';
export type UserRole = 'admin' | 'member';

export interface MemberProfile {
  id: string;
  band_id: string;
  name: string;
  email: string;
  instrument: InstrumentType;
  role: UserRole;
  status: UserStatus;
  approved_by?: string | null;
  approved_at?: string | null;
  created_at: string;
}

export type AppViewMode = 'stage' | 'manager' | 'login' | 'pending';


