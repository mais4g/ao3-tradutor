# AO3 Tradutor

Aplicacao web para traduzir fanfics do [Archive of Our Own (AO3)](https://archiveofourown.org) automaticamente, gerar EPUBs e gerenciar uma biblioteca pessoal.

## Funcionalidades

- **Traducao automatica** de fanfics EN -> PT-BR (e outros idiomas)
- **DeepL + NLLB-200** como sistema de traducao (fallback automatico)
- **Geracao de EPUB** com formatacao e metadados
- **Biblioteca pessoal** com busca, filtros e status em tempo real
- **Autenticacao** via Google, GitHub ou email/senha
- **Progresso ao vivo** via Supabase Realtime
- **API documentada** com Swagger/OpenAPI em `/docs`

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 15 (App Router, TypeScript) |
| UI | Tailwind CSS + shadcn/ui |
| Auth + DB + Storage | Supabase |
| Traducao primaria | DeepL API |
| Traducao fallback | NLLB-200 (HuggingFace Inference API) |
| Scraping | cheerio |
| EPUB | epub-gen-memory |
| CI/CD | GitHub Actions + Vercel |

## Pre-requisitos

- Node.js >= 20
- Conta no [Supabase](https://supabase.com) (free tier)
- API key do [DeepL](https://www.deepl.com/pro-api) (free tier)
- API key do [HuggingFace](https://huggingface.co/settings/tokens) (opcional, fallback)

## Setup

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd ao3-tradutor
npm install
```

### 2. Configurar Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Va em **SQL Editor** e execute o conteudo de `supabase/migrations/001_initial.sql`
3. Va em **Authentication > Providers** e habilite:
   - Google (precisa de OAuth credentials do Google Cloud)
   - GitHub (precisa de OAuth app no GitHub)
   - Email (ja vem habilitado)
4. Va em **Storage** e crie um bucket chamado `epubs` (privado)
5. No bucket `epubs`, adicione as policies de RLS (estao comentadas no final do arquivo SQL)

### 3. Variaveis de ambiente

Copie o template e preencha:

```bash
cp .env.example .env.local
```

```env
# Supabase (Settings > API no dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# DeepL (https://www.deepl.com/your-account/keys)
DEEPL_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx

# HuggingFace (https://huggingface.co/settings/tokens)
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxx
```

### 4. Rodar localmente

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Deploy na Vercel

1. Faca push do repositorio para o GitHub
2. Acesse [vercel.com](https://vercel.com) e importe o repositorio
3. Adicione as variaveis de ambiente (mesmas do `.env.local`)
4. Deploy automatico a cada push para `main`

## Estrutura do Projeto

```
src/
├── app/
│   ├── page.tsx                    # Landing page (login)
│   ├── dashboard/page.tsx          # Dashboard principal
│   ├── docs/page.tsx               # Swagger UI
│   ├── auth/callback/route.ts      # OAuth callback
│   └── api/
│       ├── translate/route.ts      # Iniciar traducao
│       ├── fanfics/route.ts        # Listar fanfics
│       ├── fanfics/[id]/route.ts   # Download/deletar fanfic
│       └── docs/route.ts           # OpenAPI spec
├── lib/
│   ├── scraper.ts                  # Scraping do AO3
│   ├── translator.ts              # DeepL + NLLB-200 (Strategy Pattern)
│   ├── epub.ts                     # Geracao de EPUB
│   ├── utils.ts                    # Funcoes utilitarias
│   └── supabase/                   # Clients (browser, server, admin)
├── components/                     # Componentes React
├── hooks/                          # Custom hooks (real-time)
└── types/                          # TypeScript types
```

## API

Documentacao interativa disponivel em `/docs` (Swagger UI).

### Endpoints

| Metodo | Rota | Descricao |
|--------|------|-----------|
| `POST` | `/api/translate` | Iniciar traducao de uma ou mais URLs |
| `GET` | `/api/fanfics` | Listar fanfics do usuario |
| `GET` | `/api/fanfics/:id` | Download do EPUB |
| `DELETE` | `/api/fanfics/:id` | Deletar fanfic e EPUB |
| `GET` | `/api/docs` | OpenAPI spec (JSON) |

## Scripts

```bash
npm run dev       # Servidor de desenvolvimento
npm run build     # Build de producao
npm run start     # Iniciar build de producao
npm run lint      # ESLint
```

## Arquitetura

Documentacao detalhada de arquitetura, principios SOLID, design patterns e CI/CD em [ARCHITECTURE.md](ARCHITECTURE.md).
