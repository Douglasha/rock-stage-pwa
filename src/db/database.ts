import Dexie, { type Table } from 'dexie';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  Band,
  Song,
  Setlist,
  SetlistItem,
  SongNote,
  ActiveStageSong,
  MemberProfile,
  UserStatus,
  UserRole
} from '../types';

export class StageDatabase extends Dexie {
  bands!: Table<Band, string>;
  songs!: Table<Song, string>;
  setlists!: Table<Setlist, string>;
  setlist_items!: Table<SetlistItem, string>;
  song_notes!: Table<SongNote, string>;
  profiles!: Table<MemberProfile, string>;

  constructor() {
    super('RockStageDB');
    this.version(3).stores({
      bands: 'id, name',
      songs: 'id, band_id, title, artist, key, bpm',
      setlists: 'id, band_id, is_active',
      setlist_items: 'id, setlist_id, song_id, position, set_block',
      song_notes: 'id, song_id, instrument',
      profiles: 'id, band_id, email, instrument, role, status'
    });
  }
}

export const db = new StageDatabase();

// ==============================================================================
// SINCRONIZAÇÃO NUVEM (SUPABASE) <-> CACHE LOCAL (DEXIE)
// ==============================================================================

/**
 * Envia todos os dados locais do Dexie para a nuvem do Supabase.
 * Garante que músicas, repertórios e itens cadastrados no navegador subam para o servidor
 * e fiquem imediatamente disponíveis para todos os demais integrantes da banda.
 */
export async function uploadAllLocalDataToSupabase(): Promise<{
  success: boolean;
  songsCount: number;
  setlistsCount: number;
  error?: string;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, songsCount: 0, setlistsCount: 0, error: 'Supabase não está configurado.' };
  }

  try {
    // 1. Garante que a banda padrão exista no Supabase
    await supabase.from('bands').upsert({ id: 'b001-rock-band', name: 'Delta Brothers' });

    const localBands = await db.bands.toArray();
    for (const b of localBands) {
      if (b.id && b.name) {
        await supabase.from('bands').upsert({ id: b.id, name: b.name });
      }
    }

    // 2. Normaliza e envia todas as músicas locais para o Supabase
    const localSongs = await db.songs.toArray();
    const sanitizedSongs = localSongs.map((s) => ({
      id: s.id,
      band_id: s.band_id || 'b001-rock-band',
      title: s.title ? s.title.trim() : 'Sem título',
      artist: s.artist ? s.artist.trim() : 'Delta Brothers',
      key: s.key || 'E',
      bpm: (Number(s.bpm) > 0 && Number(s.bpm) < 350) ? Number(s.bpm) : 120,
      duration_sec: Number(s.duration_sec) || 0,
      lyrics: s.lyrics || '',
      structure: s.structure || '',
      created_at: s.created_at || new Date().toISOString()
    }));

    if (sanitizedSongs.length > 0) {
      // Envia em lotes de 40 músicas para garantir requisições rápidas e sem falhas de payload
      for (let i = 0; i < sanitizedSongs.length; i += 40) {
        const chunk = sanitizedSongs.slice(i, i + 40);
        const { error: songsErr } = await supabase.from('songs').upsert(chunk);
        if (songsErr) {
          console.error('Erro ao enviar lote de músicas para o Supabase:', songsErr);
          return {
            success: false,
            songsCount: 0,
            setlistsCount: 0,
            error: `Erro ao subir músicas: ${songsErr.message}`
          };
        }
      }
    }

    // 3. Normaliza e envia todos os repertórios (setlists) locais
    const localSetlists = await db.setlists.toArray();
    const sanitizedSetlists = localSetlists.map((sl) => ({
      id: sl.id,
      band_id: sl.band_id || 'b001-rock-band',
      title: sl.title ? sl.title.trim() : 'Repertório',
      event_date: sl.event_date || null,
      venue: sl.venue || '',
      is_active: Boolean(sl.is_active),
      created_at: sl.created_at || new Date().toISOString()
    }));

    if (sanitizedSetlists.length > 0) {
      const { error: slErr } = await supabase.from('setlists').upsert(sanitizedSetlists);
      if (slErr) console.warn('Aviso ao enviar setlists para o Supabase:', slErr);
    }

    // 4. Envia todos os itens de setlists (músicas dentro dos repertórios)
    const localItems = await db.setlist_items.toArray();
    if (localItems.length > 0) {
      const validSongIds = new Set(sanitizedSongs.map((s) => s.id));
      const validItems = localItems
        .filter((it) => validSongIds.has(it.song_id))
        .map((it) => ({
          id: it.id,
          setlist_id: it.setlist_id,
          song_id: it.song_id,
          position: it.position,
          set_block: it.set_block || 'Set 1',
          override_key: it.override_key || null,
          specific_note: it.specific_note || '',
          created_at: it.created_at || new Date().toISOString()
        }));

      if (validItems.length > 0) {
        for (let i = 0; i < validItems.length; i += 40) {
          const chunk = validItems.slice(i, i + 40);
          const { error: itemsErr } = await supabase.from('setlist_items').upsert(chunk);
          if (itemsErr) console.warn('Aviso ao enviar itens de setlist:', itemsErr);
        }
      }
    }

    // 5. Envia notas de músicas se houver
    const localNotes = await db.song_notes.toArray();
    if (localNotes.length > 0) {
      const { error: notesErr } = await supabase.from('song_notes').upsert(localNotes);
      if (notesErr) console.warn('Aviso ao enviar notas para o Supabase:', notesErr);
    }

    return {
      success: true,
      songsCount: sanitizedSongs.length,
      setlistsCount: sanitizedSetlists.length
    };
  } catch (err: any) {
    console.error('Falha ao subir dados locais para o Supabase:', err);
    return {
      success: false,
      songsCount: 0,
      setlistsCount: 0,
      error: err.message || 'Falha de comunicação com o Supabase'
    };
  }
}

export async function syncFromSupabase(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    // 1. Verifica se temos dados locais no dispositivo
    const localSongCount = await db.songs.count();

    // 2. Busca lista de IDs da nuvem para conferir volume
    const { data: cloudSongs } = await supabase.from('songs').select('id');
    const cloudCount = cloudSongs?.length ?? 0;

    // Se o banco local possui músicas cadastradas e a nuvem possui menos (ou nenhuma),
    // subimos os dados locais automaticamente para a nuvem
    if (localSongCount > 0 && cloudCount < localSongCount) {
      console.log(`Subindo ${localSongCount} músicas locais para a nuvem Supabase...`);
      await uploadAllLocalDataToSupabase();
    }

    // 3. Busca todos os dados da nuvem para atualizar o cache local
    const [bandsRes, songsRes, setlistsRes, itemsRes, notesRes, profilesRes] = await Promise.all([
      supabase.from('bands').select('*'),
      supabase.from('songs').select('*').order('title'),
      supabase.from('setlists').select('*'),
      supabase.from('setlist_items').select('*'),
      supabase.from('song_notes').select('*'),
      supabase.from('profiles').select('*')
    ]);

    await db.transaction('rw', [db.bands, db.songs, db.setlists, db.setlist_items, db.song_notes, db.profiles], async () => {
      if (bandsRes.data?.length) {
        for (const b of bandsRes.data) await db.bands.put(b);
      }
      if (songsRes.data?.length) {
        for (const s of songsRes.data) await db.songs.put(s);
      }
      if (setlistsRes.data?.length) {
        for (const sl of setlistsRes.data) await db.setlists.put(sl);
      }
      if (itemsRes.data?.length) {
        for (const it of itemsRes.data) await db.setlist_items.put(it);
      }
      if (notesRes.data?.length) {
        for (const n of notesRes.data) await db.song_notes.put(n);
      }
      if (profilesRes.data?.length) {
        for (const p of profilesRes.data) await db.profiles.put(p);
      }
    });
  } catch (err) {
    console.warn('Erro ao sincronizar com o Supabase:', err);
  }
}

// ==============================================================================
// SETLIST CRUD
// ==============================================================================

export async function getAllSetlists(): Promise<Setlist[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('setlists')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        for (const sl of data) {
          await db.setlists.put(sl);
        }
      }
    } catch (err) {
      console.warn('Erro ao buscar setlists do Supabase:', err);
    }
  }
  return await db.setlists.toArray();
}

export async function getActiveSetlist(): Promise<Setlist | undefined> {
  const active = await db.setlists.filter((s) => Boolean(s.is_active)).first();
  if (active) return active;
  return await db.setlists.toCollection().first();
}

export async function getSetlistById(id: string): Promise<Setlist | undefined> {
  return await db.setlists.get(id);
}

export async function setActiveSetlist(setlistId: string): Promise<void> {
  await db.transaction('rw', db.setlists, async () => {
    const all = await db.setlists.toArray();
    for (const s of all) {
      await db.setlists.update(s.id, { is_active: s.id === setlistId });
    }
  });

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('setlists').update({ is_active: false }).neq('id', setlistId);
      await supabase.from('setlists').update({ is_active: true }).eq('id', setlistId);
    } catch (err) {
      console.warn('Erro ao sincronizar setlist ativo com Supabase:', err);
    }
  }
}

export async function createSetlist(
  data: Omit<Setlist, 'id' | 'created_at'>
): Promise<string> {
  const id = `setlist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newSetlist: Setlist = {
    ...data,
    id,
    created_at: new Date().toISOString()
  };
  await db.setlists.put(newSetlist);

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('setlists').upsert(newSetlist);
      if (error) console.error('Erro ao salvar setlist no Supabase:', error);
    } catch (err) {
      console.warn('Erro ao salvar setlist no Supabase:', err);
    }
  }

  return id;
}

export async function updateSetlist(id: string, updates: Partial<Setlist>): Promise<void> {
  await db.setlists.update(id, updates);

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('setlists').update(updates).eq('id', id);
      if (error) console.error('Erro ao atualizar setlist no Supabase:', error);
    } catch (err) {
      console.warn('Erro ao atualizar setlist no Supabase:', err);
    }
  }
}

export async function deleteSetlist(id: string): Promise<void> {
  await db.transaction('rw', [db.setlists, db.setlist_items], async () => {
    await db.setlist_items.where('setlist_id').equals(id).delete();
    await db.setlists.delete(id);
  });

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('setlists').delete().eq('id', id);
    } catch (err) {
      console.warn('Erro ao deletar setlist no Supabase:', err);
    }
  }
}

// ==============================================================================
// SONGS CRUD
// ==============================================================================

export async function getAllSongs(): Promise<Song[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('title');
      if (!error && data) {
        for (const s of data) {
          await db.songs.put(s);
        }
      }
    } catch (err) {
      console.warn('Erro ao buscar músicas do Supabase:', err);
    }
  }
  return await db.songs.orderBy('title').toArray();
}

export async function getSongById(id: string): Promise<Song | undefined> {
  return await db.songs.get(id);
}

export async function saveSong(
  data: Omit<Song, 'id' | 'created_at'> & { id?: string }
): Promise<string> {
  const id = data.id || `song-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const bpmNum = Number(data.bpm);
  const song: Song = {
    id,
    band_id: data.band_id || 'b001-rock-band',
    title: data.title ? data.title.trim() : 'Sem título',
    artist: data.artist ? data.artist.trim() : 'Delta Brothers',
    key: data.key || 'E',
    bpm: (bpmNum > 0 && bpmNum < 350) ? bpmNum : 120,
    duration_sec: Number(data.duration_sec) || 0,
    lyrics: data.lyrics || '',
    structure: data.structure || '',
    created_at: new Date().toISOString()
  };

  await db.songs.put(song);

  if (isSupabaseConfigured && supabase) {
    try {
      // Garante que a banda exista no Supabase antes de inserir a música
      await supabase.from('bands').upsert({ id: 'b001-rock-band', name: 'Delta Brothers' });
      const { error } = await supabase.from('songs').upsert(song);
      if (error) {
        console.error('Erro ao salvar música no Supabase:', error);
      }
    } catch (err) {
      console.warn('Erro ao sincronizar música no Supabase:', err);
    }
  }

  return id;
}

export async function deleteSong(songId: string): Promise<void> {
  await db.transaction('rw', [db.songs, db.setlist_items, db.song_notes], async () => {
    await db.setlist_items.where('song_id').equals(songId).delete();
    await db.song_notes.where('song_id').equals(songId).delete();
    await db.songs.delete(songId);
  });

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('songs').delete().eq('id', songId);
    } catch (err) {
      console.warn('Erro ao deletar música no Supabase:', err);
    }
  }
}

// ==============================================================================
// SETLIST ITEMS & STAGE
// ==============================================================================

export async function getSetlistFullData(setlistId: string): Promise<ActiveStageSong[]> {
  // Se online, atualiza os itens desse setlist do Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: cloudItems, error } = await supabase
        .from('setlist_items')
        .select('*')
        .eq('setlist_id', setlistId)
        .order('position');
      if (!error && cloudItems && cloudItems.length > 0) {
        await db.transaction('rw', db.setlist_items, async () => {
          await db.setlist_items.where('setlist_id').equals(setlistId).delete();
          for (const it of cloudItems) {
            await db.setlist_items.put(it);
          }
        });
      }
    } catch (err) {
      console.warn('Erro ao sincronizar itens do setlist:', err);
    }
  }

  const items = await db.setlist_items
    .where('setlist_id')
    .equals(setlistId)
    .sortBy('position');

  const result: ActiveStageSong[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let song = await db.songs.get(item.song_id);

    // Se a música ainda não estiver no banco local, busca do Supabase
    if (!song && isSupabaseConfigured && supabase) {
      try {
        const { data: cloudSong } = await supabase
          .from('songs')
          .select('*')
          .eq('id', item.song_id)
          .single();
        if (cloudSong) {
          song = cloudSong as Song;
          await db.songs.put(song);
        }
      } catch {}
    }

    if (!song) continue;

    const notes = await db.song_notes.where('song_id').equals(song.id).toArray();

    result.push({
      item,
      song,
      effectiveKey: item.override_key || song.key,
      notes,
      totalInSet: items.length,
      currentIndex: i
    });
  }

  return result;
}

export async function saveSetlistItems(
  setlistId: string,
  items: Array<{
    song_id: string;
    position: number;
    set_block: string;
    override_key?: string | null;
    specific_note?: string;
  }>
): Promise<void> {
  const newItems: SetlistItem[] = items.map((it) => ({
    id: `item-${setlistId}-${it.position}-${Math.random().toString(36).substring(2, 6)}`,
    setlist_id: setlistId,
    song_id: it.song_id,
    position: it.position,
    set_block: it.set_block || 'Set 1',
    override_key: it.override_key || null,
    specific_note: it.specific_note || '',
    created_at: new Date().toISOString()
  }));

  await db.transaction('rw', db.setlist_items, async () => {
    await db.setlist_items.where('setlist_id').equals(setlistId).delete();
    for (const it of newItems) {
      await db.setlist_items.add(it);
    }
  });

  if (isSupabaseConfigured && supabase) {
    try {
      // Garante que todas as músicas associadas a este setlist estejam salvas no Supabase
      // para evitar falhas de chave estrangeira (Foreign Key violation)
      for (const it of items) {
        const localSong = await db.songs.get(it.song_id);
        if (localSong) {
          const bpmNum = Number(localSong.bpm);
          await supabase.from('songs').upsert({
            id: localSong.id,
            band_id: localSong.band_id || 'b001-rock-band',
            title: localSong.title ? localSong.title.trim() : 'Sem título',
            artist: localSong.artist ? localSong.artist.trim() : 'Delta Brothers',
            key: localSong.key || 'E',
            bpm: (bpmNum > 0 && bpmNum < 350) ? bpmNum : 120,
            duration_sec: Number(localSong.duration_sec) || 0,
            lyrics: localSong.lyrics || '',
            structure: localSong.structure || '',
            created_at: localSong.created_at || new Date().toISOString()
          });
        }
      }

      await supabase.from('setlist_items').delete().eq('setlist_id', setlistId);
      if (newItems.length > 0) {
        const { error } = await supabase.from('setlist_items').insert(newItems);
        if (error) console.error('Erro ao salvar itens no Supabase:', error);
      }
    } catch (err) {
      console.warn('Erro ao sincronizar itens do setlist no Supabase:', err);
    }
  }
}

// ==============================================================================
// SONG NOTES
// ==============================================================================

export async function getSongNotes(songId: string): Promise<SongNote[]> {
  return await db.song_notes.where('song_id').equals(songId).toArray();
}

export async function saveSongNote(
  data: Omit<SongNote, 'id' | 'created_at'> & { id?: string }
): Promise<string> {
  const id = data.id || `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const note: SongNote = {
    id,
    song_id: data.song_id,
    user_id: data.user_id || null,
    instrument: data.instrument,
    content: data.content,
    created_at: new Date().toISOString()
  };
  await db.song_notes.put(note);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('song_notes').upsert(note);
    } catch (err) {
      console.warn('Erro ao salvar nota no Supabase:', err);
    }
  }

  return id;
}

export async function deleteSongNote(noteId: string): Promise<void> {
  await db.song_notes.delete(noteId);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('song_notes').delete().eq('id', noteId);
    } catch (err) {
      console.warn('Erro ao deletar nota no Supabase:', err);
    }
  }
}

// ==============================================================================
// PROFILES
// ==============================================================================

export async function getAllProfiles(): Promise<MemberProfile[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at');
      if (!error && data) {
        for (const p of data) {
          await db.profiles.put(p);
        }
      }
    } catch (err) {
      console.warn('Erro ao buscar perfis do Supabase:', err);
    }
  }
  return await db.profiles.toArray();
}

export async function saveProfile(profile: MemberProfile): Promise<void> {
  await db.profiles.put(profile);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('profiles').upsert(profile);
    } catch (err) {
      console.warn('Erro ao salvar perfil no Supabase:', err);
    }
  }
}

export async function updateUserStatus(
  userId: string,
  status: UserStatus,
  approvedBy?: string
): Promise<void> {
  const updates: Partial<MemberProfile> = {
    status,
    approved_by: status === 'approved' ? approvedBy || 'admin' : null,
    approved_at: status === 'approved' ? new Date().toISOString() : null
  };
  await db.profiles.update(userId, updates);

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
      if (error) {
        console.error('Erro ao aprovar/bloquear usuário no Supabase:', error);
      }
    } catch (err) {
      console.warn('Erro ao atualizar status do usuário no Supabase:', err);
    }
  }
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<void> {
  await db.profiles.update(userId, { role });

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('profiles').update({ role }).eq('id', userId);
    } catch (err) {
      console.warn('Erro ao atualizar papel do usuário no Supabase:', err);
    }
  }
}

export async function deleteUser(userId: string): Promise<void> {
  await db.profiles.delete(userId);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('profiles').delete().eq('id', userId);
    } catch (err) {
      console.warn('Erro ao remover usuário no Supabase:', err);
    }
  }
}

export async function adminResetUserPassword(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' };
  }

  // 1. Atualiza no cache local do Dexie
  try {
    await db.profiles.update(userId, { password: newPassword });
  } catch (localErr) {
    console.warn('Aviso ao atualizar senha no cache local:', localErr);
  }

  // 2. Se Supabase estiver configurado, invoca a função RPC admin_reset_password
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.rpc('admin_reset_password', {
        target_user_id: userId,
        new_password: newPassword
      });

      if (error) {
        console.error('Erro na RPC admin_reset_password:', error);
        if (error.message?.includes('function') && error.message?.includes('does not exist')) {
          return {
            success: false,
            error: 'A função admin_reset_password ainda não foi executada no Supabase. Cole o script do schema.sql no SQL Editor do Supabase.'
          };
        }
        return {
          success: false,
          error: error.message || 'Erro ao atualizar senha no Supabase.'
        };
      }
    } catch (err: any) {
      console.error('Falha de conexão com o Supabase ao redefinir senha:', err);
      return {
        success: false,
        error: err.message || 'Falha de comunicação com o Supabase.'
      };
    }
  }

  return { success: true };
}


// ==============================================================================
// BACKUP & RESTORE (PERSISTÊNCIA DE SEGURANÇA)
// ==============================================================================

export interface DatabaseBackup {
  version: number;
  exportedAt: string;
  bands?: Band[];
  songs?: Song[];
  setlists?: Setlist[];
  setlist_items?: SetlistItem[];
  song_notes?: SongNote[];
}

export async function exportDatabaseBackup(): Promise<string> {
  const bands = await db.bands.toArray();
  const songs = await db.songs.toArray();
  const setlists = await db.setlists.toArray();
  const setlist_items = await db.setlist_items.toArray();
  const song_notes = await db.song_notes.toArray();

  const backup: DatabaseBackup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    bands,
    songs,
    setlists,
    setlist_items,
    song_notes
  };

  return JSON.stringify(backup, null, 2);
}

export async function importDatabaseBackup(jsonContent: string): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const data: DatabaseBackup = JSON.parse(jsonContent);
    if (!data.songs || !Array.isArray(data.songs)) {
      return { success: false, count: 0, error: 'Arquivo de backup inválido: lista de músicas não encontrada.' };
    }

    const songsToImport = data.songs;

    await db.transaction('rw', [db.bands, db.songs, db.setlists, db.setlist_items, db.song_notes], async () => {
      if (data.bands?.length) {
        for (const b of data.bands) {
          await db.bands.put(b);
        }
      }
      for (const s of songsToImport) {
        await db.songs.put(s);
      }
      if (data.setlists?.length) {
        for (const sl of data.setlists) {
          await db.setlists.put(sl);
        }
      }
      if (data.setlist_items?.length) {
        for (const item of data.setlist_items) {
          await db.setlist_items.put(item);
        }
      }
      if (data.song_notes?.length) {
        for (const note of data.song_notes) {
          await db.song_notes.put(note);
        }
      }
    });

    // Se o Supabase estiver configurado, sincroniza tudo imediatamente com a nuvem
    if (isSupabaseConfigured && supabase) {
      try {
        await uploadAllLocalDataToSupabase();
      } catch (uploadErr) {
        console.warn('Aviso: dados importados localmente, mas houve falha ao enviar para o Supabase:', uploadErr);
      }
    }

    return { success: true, count: data.songs.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Erro ao processar arquivo de backup.' };
  }
}


