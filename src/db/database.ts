import Dexie, { type Table } from 'dexie';
import type { Band, Song, Setlist, SetlistItem, SongNote, ActiveStageSong } from '../types';

export class StageDatabase extends Dexie {
  bands!: Table<Band, string>;
  songs!: Table<Song, string>;
  setlists!: Table<Setlist, string>;
  setlist_items!: Table<SetlistItem, string>;
  song_notes!: Table<SongNote, string>;

  constructor() {
    super('RockStageDB');
    this.version(1).stores({
      bands: 'id, name',
      songs: 'id, band_id, title, artist, key, bpm',
      setlists: 'id, band_id, is_active',
      setlist_items: 'id, setlist_id, song_id, position, set_block',
      song_notes: 'id, song_id, instrument'
    });
  }
}

export const db = new StageDatabase();

/**
 * Retorna o setlist ativo no momento ou o primeiro disponível
 */
export async function getActiveSetlist(): Promise<Setlist | undefined> {
  const active = await db.setlists.filter((s) => Boolean(s.is_active)).first();
  if (active) return active;
  return await db.setlists.toCollection().first();
}

/**
 * Carrega a lista completa e ordenada de músicas do setlist ativo com metadados e notas
 */
export async function getSetlistFullData(setlistId: string): Promise<ActiveStageSong[]> {
  const items = await db.setlist_items
    .where('setlist_id')
    .equals(setlistId)
    .sortBy('position');

  const result: ActiveStageSong[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const song = await db.songs.get(item.song_id);
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
