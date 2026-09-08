-- ==============================================================================
-- ROCK STAGE PWA - SUPABASE / POSTGRESQL SCHEMA
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BANDS
CREATE TABLE IF NOT EXISTS bands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. SONGS
CREATE TABLE IF NOT EXISTS songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    key VARCHAR(10) NOT NULL,
    bpm INTEGER CHECK (bpm > 0 AND bpm < 350),
    duration_sec INTEGER DEFAULT 0,
    lyrics TEXT DEFAULT '',
    structure VARCHAR(255) DEFAULT '', -- e.g. "Intro - V1 - C - V2 - C - Solo - C - Outro"
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. SETLISTS
CREATE TABLE IF NOT EXISTS setlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    event_date DATE,
    venue VARCHAR(255) DEFAULT '',
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. SETLIST_ITEMS
CREATE TABLE IF NOT EXISTS setlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setlist_id UUID NOT NULL REFERENCES setlists(id) ON DELETE CASCADE,
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    set_block VARCHAR(50) DEFAULT 'Set 1', -- e.g. "Abertura", "Set 1", "Set 2", "Bis"
    override_key VARCHAR(10),             -- Allows shifting key specifically for a setlist
    specific_note TEXT DEFAULT '',        -- Stage cue or note specific to this performance
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_setlist_position UNIQUE (setlist_id, position)
);

-- 5. SONG_NOTES (Personal notes per musician / instrument)
CREATE TABLE IF NOT EXISTS song_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    user_id UUID,                         -- Reference to auth.users (if using Supabase Auth)
    instrument VARCHAR(50) NOT NULL,      -- e.g. 'guitar_1', 'guitar_2', 'bass', 'drums', 'keys', 'vocals'
    content TEXT NOT NULL,                -- e.g. "Drop D, Whammy no solo, atrasar entrada 2 compassos"
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- INDEXES FOR STAGE QUERY SPEED
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_songs_band_id ON songs(band_id);
CREATE INDEX IF NOT EXISTS idx_setlists_band_id_active ON setlists(band_id, is_active);
CREATE INDEX IF NOT EXISTS idx_setlist_items_setlist_pos ON setlist_items(setlist_id, position ASC);
CREATE INDEX IF NOT EXISTS idx_song_notes_song_instrument ON song_notes(song_id, instrument);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_notes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated read/write (customizable for production band membership)
CREATE POLICY "Allow authenticated read on bands" ON bands FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read on songs" ON songs FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read on setlists" ON setlists FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read on setlist_items" ON setlist_items FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read on song_notes" ON song_notes FOR SELECT USING (true);
