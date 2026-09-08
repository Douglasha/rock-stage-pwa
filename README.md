# Rock Stage PWA 🎸⚡

PWA de alta performance e operação **100% offline** desenvolvido especialmente para apresentações de bandas de rock ao vivo. Projetado para **eliminar intervalos mortos (*dead air*)** entre as músicas, garantir leitura rápida de letras e cifras sob iluminação de palco e responder a pedais de efeito/virada de página via Bluetooth.

---

## 🚀 Tecnologias Utilizadas

- **Frontend:** [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) com paleta otimizada para telas **OLED (#000000)** e alto contraste
- **PWA & Offline:** [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) (Service Worker com precache de assets) + [`Dexie.js`](https://dexie.org/) (IndexedDB local com dados estruturados)
- **Backend & Banco de Dados:** [Supabase](https://supabase.com/) (PostgreSQL com Row Level Security)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Hospedagem Recomendada:** Vercel ou Cloudflare Pages

---

## 📋 Modelo de Dados (PostgreSQL / Supabase & Dexie)

O schema relacional está em [`supabase/schema.sql`](supabase/schema.sql):

1. **`bands`**: `id`, `name`, `created_at`
2. **`songs`**: `id`, `band_id`, `title`, `artist`, `key`, `bpm`, `duration_sec`, `lyrics`, `structure`, `created_at`
3. **`setlists`**: `id`, `band_id`, `title`, `event_date`, `venue`, `is_active`, `created_at`
4. **`setlist_items`**: `id`, `setlist_id`, `song_id`, `position`, `set_block`, `override_key`, `specific_note`
5. **`song_notes`**: `id`, `song_id`, `user_id`, `instrument`, `content`

---

## ⚡ Recursos Críticos do "Modo Palco"

| Recurso | Implementação | Benefício no Palco |
| :--- | :--- | :--- |
| **Prevenção de Apagamento de Tela** | `Screen Wake Lock API` (`useWakeLock`) com re-bloqueio automático ao alternar abas | A tela nunca desliga no meio de um solo ou estrofe. |
| **Interface OLED (#000000)** | Tailwind com preto absoluto, tipografia branca e realce amarelo/âmbar | Máxima visibilidade sob luzes fortes e economia de bateria em telas AMOLED. |
| **Destaque Estrutural de Blocos** | Parser dinâmico para `[Intro]`, `[Verso]`, `[Refrão]`, `[Solo]`, `[Outro]` e cues `(...)` | Localização visual instantânea da parte da música. |
| **Zero Dead Air (Próxima Música)** | Banner superior persistente com o nome e tom da próxima faixa | A banda se prepara para a virada antes mesmo da música atual acabar. |
| **Controle por Pedal Bluetooth & Atalhos** | `PageDown`/`PageUp`, `ArrowRight`/`ArrowLeft`, `Space` (Play/Pause), `Home`/`KeyT` (Topo) | Compatível com pedais PageFlip, AirTurn, Coda Stomp, Donner, etc. |
| **Navegação Touch (Swipe)** | Detecção de arrasto lateral (`useSwipe`) com tolerância vertical | Troca rápida de música no tablet/smartphone sem pausar a leitura. |
| **Rolagem Automática Suave** | `requestAnimationFrame` (`useAutoScroll`) com velocidade ajustável (1x a 2.5x) | Rolagem fluida que pausa instantaneamente caso o músico toque na tela. |
| **100% Offline (Dexie.js)** | IndexedDB nativo com pré-carregamento automático de repertório | Funcionamento garantido em porões, galpões e palcos sem sinal de internet. |

---

## 🛠️ Como Executar o Projeto Localmente

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

3. **Abra no navegador:**
   - Acesse `http://localhost:5173`
   - O banco Dexie inicializa com um setlist clássico de rock de demonstração (AC/DC, Guns N' Roses, Nirvana, Metallica).

---

## ☁️ Conexão com o Supabase (Opcional)

Para sincronizar o repertório na nuvem:

1. Crie um projeto no [Supabase](https://supabase.com).
2. Execute o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) no SQL Editor do Supabase.
3. Crie um arquivo `.env` na raiz do projeto:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anonima
   ```

---

## 📦 Build e Deploy (Vercel / Cloudflare Pages)

1. Para gerar o build de produção com manifesto e Service Worker PWA:
   ```bash
   npm run build
   ```

2. Os arquivos gerados estarão no diretório `dist/`.
3. **Vercel:** Conecte o repositório Git ou rode `npx vercel`.
4. **Cloudflare Pages:** Defina o diretório de saída como `dist` e o comando de build como `npm run build`.
