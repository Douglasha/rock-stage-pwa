# Delta Brothers - Modo Palco 🎸⚡

Contexto oficial do projeto para o Google Antigravity e agentes de IA.

---

## 📌 Visão Geral do Projeto
PWA de alta performance projetado para a banda **Delta Brothers** utilizar ao vivo no palco.
- **Hospedagem:** Vercel (`delta-brothers.vercel.app`)
- **Repositório GitHub:** `https://github.com/Douglasha/rock-stage-pwa.git`
- **Backend & Autenticação:** Supabase (PostgreSQL na nuvem) + Dexie.js (IndexedDB local offline-first)

---

## 🏗️ Arquitetura Técnica
1. **Frontend:** React 18, Vite, TypeScript, Tailwind CSS (otimizado para telas OLED com preto `#000000`).
2. **Offline-First & Palco:**
   - `useWakeLock.ts`: Previne desligamento/bloqueio automático de tela durante o show.
   - `useAutoScroll.ts`: Rolagem automática contínua e suave de letras/cifras.
   - `usePedalControls.ts`: Compatível com pedais de virada de página Bluetooth (PageDown, PageUp, ArrowRight, ArrowLeft, Space).
   - `useSwipe.ts`: Gestos touch para troca rápida de músicas.
   - `database.ts`: IndexedDB via Dexie.js (`RockStageDB`) com persistência de navegador (`navigator.storage.persist()`).
3. **Sincronização em Nuvem (Supabase):**
   - Script SQL das tabelas em [`supabase/schema.sql`](supabase/schema.sql).
   - Tabelas: `bands`, `profiles`, `songs`, `setlists`, `setlist_items`, `song_notes`.
   - Autenticação com e-mail/senha.
   - Trigger automático no Supabase: o 1º usuário registrado é promovido a Administrador aprovado.
   - `syncFromSupabase()` em `database.ts`: espelha os dados da nuvem no aparelho local para uso offline no palco.
4. **Ferramenta de Backup & Restauração:**
   - `exportDatabaseBackup()` e `importDatabaseBackup()` em `database.ts`.
   - Botões na biblioteca de músicas para baixar ou importar arquivo `.json` completo do repertório.

---

## ⚙️ Variáveis de Ambiente Necessárias (Vercel & .env)
- `VITE_SUPABASE_URL`: URL do projeto Supabase (`https://<project-id>.supabase.co`).
- `VITE_SUPABASE_ANON_KEY`: Chave anônima pública do Supabase.

---

## 🎸 Fluxos Principais
- **Primeiro Acesso / Login:** O primeiro usuário da banda a se cadastrar assume o papel de Administrador. Os demais entram com status pendente para aprovação pelo Admin.
- **Modo Palco:** Acesso imediato às músicas com cifras, notas por instrumento e banner de próxima música para eliminar dead air.
- **Gerenciador:** Criar/editar músicas, organizar setlists de shows e aprovar integrantes.
