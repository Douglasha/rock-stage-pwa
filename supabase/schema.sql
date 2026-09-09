-- ==============================================================================
-- DELTA BROTHERS - MODO PALCO - SUPABASE / POSTGRESQL SCHEMA
-- ==============================================================================

-- 1. BANDS
CREATE TABLE IF NOT EXISTS bands (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insere a banda Delta Brothers padrão
INSERT INTO bands (id, name)
VALUES ('b001-rock-band', 'Delta Brothers')
ON CONFLICT (id) DO UPDATE SET name = 'Delta Brothers';

-- 2. PROFILES (Integrantes da Banda & Permissões)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    band_id TEXT REFERENCES bands(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    instrument VARCHAR(50) DEFAULT 'guitar_1', -- 'guitar_1', 'guitar_2', 'bass', 'drums', 'keys', 'vocals', 'general'
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'blocked')),
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. SONGS (Músicas, Cifras e Letras)
CREATE TABLE IF NOT EXISTS songs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    band_id TEXT NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    key VARCHAR(10) NOT NULL,
    bpm INTEGER CHECK (bpm > 0 AND bpm < 350),
    duration_sec INTEGER DEFAULT 0,
    lyrics TEXT DEFAULT '',
    structure VARCHAR(255) DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. SETLISTS (Repertórios para Apresentações)
CREATE TABLE IF NOT EXISTS setlists (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    band_id TEXT NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    event_date DATE,
    venue VARCHAR(255) DEFAULT '',
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. SETLIST_ITEMS (Ordem das Músicas no Show)
CREATE TABLE IF NOT EXISTS setlist_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    setlist_id TEXT NOT NULL REFERENCES setlists(id) ON DELETE CASCADE,
    song_id TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    set_block VARCHAR(50) DEFAULT 'Set 1',
    override_key VARCHAR(10),
    specific_note TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_setlist_position UNIQUE (setlist_id, position)
);

-- 6. SONG_NOTES (Anotações Pessoais por Instrumento)
CREATE TABLE IF NOT EXISTS song_notes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    song_id TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    instrument VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- TRIGGER AUTOMÁTICO: O Primeiro Usuário Cadastrado Torna-se o ADMIN Oficial
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_first BOOLEAN;
BEGIN
    SELECT count(*) = 0 INTO is_first FROM public.profiles;

    INSERT INTO public.profiles (id, band_id, name, email, instrument, role, status, approved_at)
    VALUES (
        NEW.id,
        'b001-rock-band',
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'instrument', 'guitar_1'),
        CASE WHEN is_first THEN 'admin' ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'member') END,
        CASE WHEN is_first THEN 'approved' ELSE COALESCE(NEW.raw_user_meta_data->>'status', 'pending') END,
        CASE WHEN is_first THEN NOW() ELSE NULL END
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função auxiliar de verificação de Administrador
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- ÍNDICES DE VELOCIDADE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_songs_band_id ON songs(band_id);
CREATE INDEX IF NOT EXISTS idx_setlists_band_id_active ON setlists(band_id, is_active);
CREATE INDEX IF NOT EXISTS idx_setlist_items_setlist_pos ON setlist_items(setlist_id, position ASC);
CREATE INDEX IF NOT EXISTS idx_song_notes_song_instrument ON song_notes(song_id, instrument);
CREATE INDEX IF NOT EXISTS idx_profiles_band_id ON profiles(band_id);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_notes ENABLE ROW LEVEL SECURITY;

-- BANDAS
CREATE POLICY "Allow read bands" ON bands FOR SELECT USING (true);
CREATE POLICY "Allow update bands" ON bands FOR ALL USING (auth.role() = 'authenticated');

-- PERFIS (Membros)
CREATE POLICY "Allow read profiles" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow admin manage profiles" ON profiles FOR ALL USING (is_admin());

-- MÚSICAS (Leitura e Edição para integrantes aprovados)
CREATE POLICY "Allow approved members read songs" ON songs FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'approved')
);
CREATE POLICY "Allow approved members insert songs" ON songs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'approved')
);
CREATE POLICY "Allow approved members update songs" ON songs FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'approved')
);
CREATE POLICY "Allow approved members delete songs" ON songs FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'approved')
);

-- SETLISTS (Leitura e Edição para integrantes aprovados)
CREATE POLICY "Allow approved members read setlists" ON setlists FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'approved')
);
CREATE POLICY "Allow approved members insert setlists" ON setlists FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'approved')
);
CREATE POLICY "Allow approved members update setlists" ON setlists FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'approved')
);
CREATE POLICY "Allow approved members delete setlists" ON setlists FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'approved')
);

-- SETLIST_ITEMS
CREATE POLICY "Allow approved members manage setlist_items" ON setlist_items FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'approved')
);

-- SONG_NOTES
CREATE POLICY "Allow approved members manage song_notes" ON song_notes FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'approved')
);


