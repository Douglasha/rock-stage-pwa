import { db } from './database';
import type { Band, Song, Setlist, SetlistItem, SongNote } from '../types';

export async function seedDatabaseIfNeeded(force = false) {
  // Limpa quaisquer perfis mock/dummy fictícios criados em versões anteriores
  try {
    const dummyProfiles = await db.profiles
      .filter((p) => p.id.startsWith('member-') || p.email.includes('@banda.com'))
      .toArray();
    for (const d of dummyProfiles) {
      await db.profiles.delete(d.id);
    }
  } catch (err) {
    console.warn('Erro ao limpar perfis mock:', err);
  }

  const songCount = await db.songs.count();
  if (songCount > 0 && !force) {
    return;
  }

  // Clear existing
  await db.transaction('rw', [db.bands, db.songs, db.setlists, db.setlist_items, db.song_notes, db.profiles], async () => {
    await db.bands.clear();
    await db.songs.clear();
    await db.setlists.clear();
    await db.setlist_items.clear();
    await db.song_notes.clear();
    await db.profiles.clear();

    const bandId = 'b001-rock-band';
    const band: Band = {
      id: bandId,
      name: 'Electric Overdrive',
      created_at: new Date().toISOString()
    };
    await db.bands.add(band);

    // Banco de perfis inicia 100% LIMPO para que o usuário ao se cadastrar seja o Primeiro Administrador real!
    // Não inserimos nenhum membro fictício aqui.

    const setlistId = 's001-tour-setlist';
    const setlist: Setlist = {
      id: setlistId,
      band_id: bandId,
      title: 'Rock Stage Live Tour 2026',
      event_date: '2026-09-12',
      venue: 'Arena Rock Club',
      is_active: true,
      created_at: new Date().toISOString()
    };
    await db.setlists.add(setlist);

    const songsData: (Song & { notes: Omit<SongNote, 'id' | 'song_id' | 'created_at'>[]; item: Omit<SetlistItem, 'id' | 'setlist_id' | 'song_id' | 'created_at'> })[] = [
      {
        id: 'song-01',
        band_id: bandId,
        title: 'Back in Black',
        artist: 'AC/DC',
        key: 'E',
        bpm: 90,
        duration_sec: 255,
        structure: '[Intro] [Verso 1] [Refrão] [Verso 2] [Refrão] [Solo] [Refrão] [Outro]',
        created_at: new Date().toISOString(),
        item: {
          position: 1,
          set_block: 'Abertura',
          override_key: null,
          specific_note: 'Abertura do show com sirene e luz estroboscópica'
        },
        notes: [
          { instrument: 'guitar_1', content: 'Riff seco em E, D, A. Tomar cuidado com o silêncio entre as batidas.' },
          { instrument: 'drums', content: 'Contagem com as baquetas 1-2-3-4 bem audível no fone.' },
          { instrument: 'bass', content: 'Entra cravado na tônica com palheta pesada.' }
        ],
        lyrics: `[Intro]
(Riff clássico - 4 compassos)
(Bateria entra com groove reto)

[Verso 1]
Back in black, I hit the sack
I've been too long, I'm glad to be back
Yes, I'm let loose from the noose
That's kept me hanging about
I've been looking at the sky 'cause it's gettin' me high
Forget the hearse 'cause I'll never die
I got nine lives, cat's eyes
Abusin' every one of them and runnin' wild

[Refrão]
'Cause I'm back, yes I'm back
Well, I'm back, yes I'm back
Well, I'm back, back
Well, I'm back in black
Yes, I'm back in black!

[Verso 2]
Back in the back of a Cadillac
Number one with a bullet, I'm a power pack
Yes, I'm in a bang with a gang
They've got to catch me if they want me to hang
'Cause I'm back on the track and I'm leadin' the pack
Nobody's gonna get me on another rap
So look at me now, I'm just makin' my play
Don't push your luck, just get out of my way

[Refrão]
'Cause I'm back, yes I'm back
Well, I'm back, yes I'm back
Well, I'm back, back
Well, I'm back in black
Yes, I'm back in black!

[Solo]
(Guitarra solo pentatônica E menor - 16 compassos)
(Final do solo: bends dobrados com vibrato rápido)

[Refrão]
'Cause I'm back, yes I'm back
Well, I'm back, yes I'm back
Well, I'm back, back
Well, I'm back in black
Yes, I'm back in black!

[Outro]
Back in black!
Oh yeah, let's go!
(Riff final até a batida seca em Mi)`
      },
      {
        id: 'song-02',
        band_id: bandId,
        title: "Sweet Child O' Mine",
        artist: "Guns N' Roses",
        key: 'D',
        bpm: 125,
        duration_sec: 356,
        structure: '[Intro] [Verso 1] [Refrão] [Verso 2] [Refrão] [Solo] [Ponte] [Outro]',
        created_at: new Date().toISOString(),
        item: {
          position: 2,
          set_block: 'Set 1',
          override_key: 'Eb',
          specific_note: 'Sem intervalo após Back in Black! Guitarra já inicia o riff dedilhado.'
        },
        notes: [
          { instrument: 'guitar_1', content: 'Afinação meio tom abaixo (Eb). Pickup do braço para timbre encorpado.' },
          { instrument: 'bass', content: 'Linha melódica marcante no pré-refrão com pedal de chorus.' }
        ],
        lyrics: `[Intro]
(Arpejo icônico de Slash em Ré maior)
(Baixo e bateria entram no segundo ciclo)

[Verso 1]
She's got a smile that it seems to me
Reminds me of childhood memories
Where everything was as fresh as the bright blue sky
Now and then when I see her face
She takes me away to that special place
And if I stare too long, I'd probably break down and cry

[Refrão]
Whoa, whoa, whoa, sweet child o' mine
Whoa, oh-oh-oh, sweet love of mine

[Verso 2]
She's got eyes of the bluest skies
As if they thought of rain
I'd hate to look into those eyes and see an ounce of pain
Her hair reminds me of a warm safe place
Where as a child I'd hide
And pray for the thunder and the rain to quietly pass me by

[Refrão]
Whoa, whoa, whoa, sweet child o' mine
Whoa, oh-oh-oh, sweet love of mine
Whoa, whoa, whoa, sweet child o' mine
Ooh, yeah, sweet love of mine

[Solo]
(Solo épico com Wah-pedal na segunda metade)
(Clímax na mudança de andamento)

[Ponte]
Where do we go? Where do we go now?
Where do we go?
Where do we go? Where do we go now?
Where do we go now?
No, no, no, no, no, no, no, sweet child
Sweet child o' mine!

[Outro]
(Final explosivo com bend sustentado)`
      },
      {
        id: 'song-03',
        band_id: bandId,
        title: 'Smells Like Teen Spirit',
        artist: 'Nirvana',
        key: 'F',
        bpm: 117,
        duration_sec: 301,
        structure: '[Intro] [Verso 1] [Pré-Refrão] [Refrão] [Verso 2] [Refrão] [Solo] [Outro]',
        created_at: new Date().toISOString(),
        item: {
          position: 3,
          set_block: 'Set 1',
          override_key: null,
          specific_note: 'Manter a dinâmica limpo/pesado bem acentuada.'
        },
        notes: [
          { instrument: 'guitar_1', content: 'Chorus suave no verso (Small Clone). Boss DS-1 ligado com tudo no refrão.' },
          { instrument: 'drums', content: 'Ataque pesado no prato de condução durante o refrão.' }
        ],
        lyrics: `[Intro]
(Riff 4 acordes: F - Bb - Ab - Db)
(Bateria entra com explosão na caixa)

[Verso 1]
Load up on guns, bring your friends
It's fun to lose and to pretend
She's over-bored and self-assured
Oh no, I know a dirty word

[Pré-Refrão]
Hello, hello, hello, how low
Hello, hello, hello, how low
Hello, hello, hello, how low
Hello, hello, hello

[Refrão]
With the lights out, it's less dangerous
Here we are now, entertain us
I feel stupid and contagious
Here we are now, entertain us
A mulatto, an albino
A mosquito, my libido
Yeah, hey!

[Verso 2]
I'm worse at what I do best
And for this gift I feel blessed
Our little group has always been
And always will until the end

[Pré-Refrão]
Hello, hello, hello, how low
Hello, hello, hello, how low
Hello, hello, hello, how low
Hello, hello, hello

[Refrão]
With the lights out, it's less dangerous
Here we are now, entertain us
I feel stupid and contagious
Here we are now, entertain us
A mulatto, an albino
A mosquito, my libido
Yeah, hey!

[Solo]
(Solo repete a melodia vocal com distorção pesada e bend)

[Outro]
A denial, a denial
A denial, a denial, a denial!
(Feedback de guitarra sustentado)`
      },
      {
        id: 'song-04',
        band_id: bandId,
        title: 'Enter Sandman',
        artist: 'Metallica',
        key: 'Em',
        bpm: 123,
        duration_sec: 332,
        structure: '[Intro] [Verso 1] [Pré-Refrão] [Refrão] [Verso 2] [Refrão] [Solo] [Oração] [Refrão] [Outro]',
        created_at: new Date().toISOString(),
        item: {
          position: 4,
          set_block: 'Set 2',
          override_key: null,
          specific_note: 'Transição após pausa de 2 minutos para hidratação da banda.'
        },
        notes: [
          { instrument: 'guitar_1', content: 'Wah-pedal aberto durante o solo inteiro.' },
          { instrument: 'bass', content: 'Acompanhar bumbo no palm mute do verso.' }
        ],
        lyrics: `[Intro]
(Arpejo limpo em Em com delay)
(Bumbo entra marcando os tempos)
(Riff pesado com distorção total)

[Verso 1]
Say your prayers, little one, don't forget, my son
To include everyone
Tuck you in, warm within, keep you free from sin
'Til the Sandman, he comes

[Pré-Refrão]
Sleep with one eye open
Gripping your pillow tight

[Refrão]
Exit light, enter night
Take my hand, we're off to never-never land!

[Verso 2]
Something's wrong, shut the light, heavy thoughts tonight
And they aren't of Snow White
Dreams of war, dreams of liars, dreams of dragon's fire
And of things that will bite, yeah!

[Pré-Refrão]
Sleep with one eye open
Gripping your pillow tight

[Refrão]
Exit light, enter night
Take my hand, we're off to never-never land!

[Solo]
(Kirk Hammett solo - Wah Wah forte em Mi pentatônica)

[Oração]
(Sussurrado com a criança)
Now I lay me down to sleep
Pray the Lord my soul to keep
If I die before I wake
Pray the Lord my soul to take

[Refrão]
Hush little baby, don't say a word
And never mind that noise you heard
It's just the beasts under your bed
In your closet, in your head!

Exit light, enter night
Grain of sand, we're off to never-never land!

[Outro]
Yeah! We're off to never-never land!
Take my hand!
(Fade out com o riff principal diminuindo)`
      },
      {
        id: 'song-05',
        band_id: bandId,
        title: 'Highway to Hell',
        artist: 'AC/DC',
        key: 'A',
        bpm: 116,
        duration_sec: 208,
        structure: '[Intro] [Verso 1] [Refrão] [Verso 2] [Refrão] [Solo] [Refrão] [Outro]',
        created_at: new Date().toISOString(),
        item: {
          position: 5,
          set_block: 'Bis',
          override_key: null,
          specific_note: 'Música final do show! Deixar a plateia cantar o refrão.'
        },
        notes: [
          { instrument: 'guitar_1', content: 'Abertura com acordes sincopados A - D/F# - G. Deixar soar.' },
          { instrument: 'vocals', content: 'Gritar agudo no final "Highway to hell!" e agradecer a cidade.' }
        ],
        lyrics: `[Intro]
(Acordes secos: Lá, Ré, Sol)
(Bateria entra após 4 compassos)

[Verso 1]
Living easy, living free
Season ticket on a one-way ride
Asking nothing, leave me be
Taking everything in my stride
Don't need reason, don't need rhyme
Ain't nothing I would rather do
Going down, party time
My friends are gonna be there too, yeah!

[Refrão]
I'm on the highway to hell
On the highway to hell
Highway to hell
I'm on the highway to hell!

[Verso 2]
No stop signs, speed limit
Nobody's gonna slow me down
Like a wheel, gonna spin it
Nobody's gonna mess me around
Hey Satan, paid my dues
Playing in a rocking band
Hey mama, look at me
I'm on my way to the promised land, whoo!

[Refrão]
I'm on the highway to hell
Highway to hell
I'm on the highway to hell
Highway to hell!

[Solo]
(Angus Young solo blues/rock acelerado)

[Refrão]
I'm on the highway to hell!
On the highway to hell!
Highway to hell!
I'm on the highway to hell!

[Outro]
And I'm going down, all the way!
Highway to hell!
(Batida final com acordes sustentados e pratos)`
      }
    ];

    for (const songData of songsData) {
      const { notes, item, ...song } = songData;
      await db.songs.add(song);

      await db.setlist_items.add({
        id: `item-${song.id}`,
        setlist_id: setlistId,
        song_id: song.id,
        position: item.position,
        set_block: item.set_block,
        override_key: item.override_key,
        specific_note: item.specific_note,
        created_at: new Date().toISOString()
      });

      for (let j = 0; j < notes.length; j++) {
        const note = notes[j];
        await db.song_notes.add({
          id: `note-${song.id}-${j}`,
          song_id: song.id,
          instrument: note.instrument,
          content: note.content,
          created_at: new Date().toISOString()
        });
      }
    }
  });
}
