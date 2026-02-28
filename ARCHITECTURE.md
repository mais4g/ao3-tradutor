# AO3 Tradutor — Documento de Arquitetura

## Visão Geral

Aplicação web (Next.js + Supabase) para traduzir fanfics do AO3 (EN→PT-BR), gerar EPUBs e gerenciar uma biblioteca pessoal. Hospedada na Vercel com autenticação por usuário.

---

## Stack Tecnológica

| Camada | Tecnologia | Motivo |
|--------|-----------|--------|
| Framework | Next.js 15 (App Router) | SSR, API routes, deploy Vercel nativo |
| Linguagem | TypeScript | Type safety, melhor DX |
| UI | Tailwind CSS + shadcn/ui | Componentes acessíveis, tema escuro |
| Auth | Supabase Auth | Google, GitHub, email — free tier |
| Banco | Supabase PostgreSQL | RLS por usuário, real-time |
| Storage | Supabase Storage | EPUBs, 1GB free |
| Tradução 1 | DeepL API (free) | Melhor qualidade EN→PT |
| Tradução 2 | NLLB-200 (HuggingFace) | Fallback quando DeepL estoura |
| Scraping | cheerio | Parse HTML server-side, leve |
| EPUB | epub-gen-memory | Gera em memória (serverless) |
| Hosting | Vercel | Free tier, deploy automático |

---

## Estrutura do Projeto

```
fanfic-translator/
├── .github/
│   └── workflows/
│       ├── ci.yml                     # Lint, type-check, test em todo PR
│       └── preview.yml                # Deploy preview por branch
├── supabase/
│   └── migrations/
│       └── 001_initial.sql            # Schema do banco (versionado)
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout (providers, fonts)
│   │   ├── page.tsx                   # Landing + auth
│   │   ├── globals.css
│   │   ├── dashboard/
│   │   │   └── page.tsx               # Dashboard (tela única, protegido)
│   │   ├── auth/callback/
│   │   │   └── route.ts              # OAuth callback
│   │   └── api/
│   │       ├── translate/route.ts     # Iniciar tradução
│   │       ├── translate/continue/route.ts  # Continuar tradução em chunks
│   │       ├── fanfics/route.ts       # CRUD de fanfics
│   │       └── fanfics/[id]/route.ts  # Download/delete fanfic
│   ├── lib/
│   │   ├── scraper.ts                 # Scraping do AO3
│   │   ├── translator.ts             # Serviço de tradução (Strategy Pattern)
│   │   ├── epub.ts                    # Geração de EPUB
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser client
│   │   │   ├── server.ts             # Server client (cookies)
│   │   │   └── admin.ts              # Service role client (API routes)
│   │   └── utils.ts                   # Funções puras utilitárias
│   ├── components/
│   │   ├── ui/                        # shadcn/ui components (gerados)
│   │   ├── dashboard.tsx
│   │   ├── link-form.tsx
│   │   ├── fanfic-list.tsx
│   │   ├── fanfic-card.tsx
│   │   ├── progress-indicator.tsx
│   │   ├── auth-form.tsx
│   │   └── header.tsx
│   ├── hooks/
│   │   ├── use-fanfics.ts            # Hook para CRUD de fanfics
│   │   └── use-realtime.ts           # Hook para Supabase real-time
│   └── types/
│       └── index.ts
├── middleware.ts                       # Auth guard (protege /dashboard)
├── .env.local                         # Variáveis de ambiente (não commitado)
├── .env.example                       # Template das variáveis
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── eslint.config.mjs
└── package.json
```

---

## Princípios SOLID Aplicados

### S — Single Responsibility (Responsabilidade Única)

Cada módulo tem uma única razão para mudar:

| Módulo | Responsabilidade |
|--------|-----------------|
| `scraper.ts` | Apenas scraping e extração de dados do AO3 |
| `translator.ts` | Apenas tradução de texto (seleção de provedor, chamadas API) |
| `epub.ts` | Apenas geração de EPUB a partir de HTML traduzido |
| `supabase/server.ts` | Apenas criação do client Supabase server-side |
| Cada API route | Apenas orquestração de um fluxo específico |
| Cada componente | Apenas uma parte da UI |

**Anti-pattern evitado**: O `tradutor_libre.py` atual faz scraping + tradução + EPUB + upload + Notion tudo em uma função. Na nova versão, cada responsabilidade é isolada.

### O — Open/Closed (Aberto/Fechado)

Extender sem modificar código existente:

```typescript
// translator.ts — Adicionar novo provedor sem mudar os existentes
interface TranslationProvider {
  name: string;
  translate(text: string, from: string, to: string): Promise<string>;
  isAvailable(): Promise<boolean>;
}

class DeepLProvider implements TranslationProvider { ... }
class NLLBProvider implements TranslationProvider { ... }
// Futuro: class GoogleProvider implements TranslationProvider { ... }

// TranslatorService recebe providers na construção
// Para adicionar Google Translate: só criar GoogleProvider, sem mudar TranslatorService
```

### L — Liskov Substitution (Substituição de Liskov)

Qualquer `TranslationProvider` pode substituir outro sem quebrar o sistema:

```typescript
// Ambos implementam a mesma interface — o TranslatorService não sabe nem precisa saber qual está usando
const result = await provider.translate(text, 'en', 'pt');
// Funciona identicamente seja DeepL ou NLLB
```

### I — Interface Segregation (Segregação de Interface)

Interfaces pequenas e focadas ao invés de uma interface gigante:

```typescript
// BOM: interfaces segregadas
interface Scraper {
  scrapeWork(url: string): Promise<ScrapedFanfic>;
}

interface Translator {
  translate(text: string, from: string, to: string): Promise<string>;
}

interface EpubGenerator {
  generate(content: TranslatedContent): Promise<Buffer>;
}

// RUIM: uma interface monolítica
interface FanficProcessor {
  scrape(url: string): Promise<...>;
  translate(text: string): Promise<...>;
  generateEpub(content: ...): Promise<...>;
  upload(file: Buffer): Promise<...>;
  register(metadata: ...): Promise<...>;
}
```

### D — Dependency Inversion (Inversão de Dependência)

Módulos de alto nível não dependem de detalhes de implementação:

```typescript
// API route (alto nível) depende de abstrações, não de implementações concretas
// translate/route.ts
import { scrapeWork } from '@/lib/scraper';       // abstração: "scrape um work"
import { translateText } from '@/lib/translator';  // abstração: "traduz texto"
import { generateEpub } from '@/lib/epub';         // abstração: "gera epub"

// Se amanhã trocar cheerio por puppeteer, ou DeepL por Google Translate,
// a API route não muda — só a implementação interna dos módulos
```

---

## Design Patterns Utilizados

### 1. Strategy Pattern — Sistema de Tradução

O provedor de tradução é selecionado em runtime baseado em disponibilidade:

```typescript
// translator.ts
class TranslatorService {
  private providers: TranslationProvider[];

  constructor(providers: TranslationProvider[]) {
    // Ordenados por prioridade (DeepL primeiro, NLLB fallback)
    this.providers = providers;
  }

  async translate(text: string, from: string, to: string): Promise<string> {
    for (const provider of this.providers) {
      if (await provider.isAvailable()) {
        try {
          return await provider.translate(text, from, to);
        } catch (error) {
          if (this.isQuotaError(error)) continue; // Tenta próximo
          throw error;
        }
      }
    }
    throw new Error('Nenhum provedor de tradução disponível');
  }
}

// Uso:
const translator = new TranslatorService([
  new DeepLProvider(process.env.DEEPL_API_KEY),
  new NLLBProvider(process.env.HUGGINGFACE_API_KEY),
]);
```

### 2. Chain of Responsibility — Tradução em Chunks

Cada invocação processa um batch e delega o resto para a próxima:

```
POST /api/translate → processa parágrafos 0-49 → chama /api/translate/continue
POST /api/translate/continue → processa 50-99 → chama /api/translate/continue
POST /api/translate/continue → processa 100-120 → gera EPUB → done
```

### 3. Observer Pattern — Progresso Real-time

Supabase real-time (PostgreSQL LISTEN/NOTIFY) notifica o frontend de mudanças:

```typescript
// Frontend: hook que observa mudanças na tabela fanfics
function useRealtimeFanfics(userId: string) {
  const [fanfics, setFanfics] = useState<Fanfic[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel('fanfics')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'fanfics',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        // Atualiza estado local automaticamente
        handleChange(payload);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return fanfics;
}
```

### 4. Repository Pattern — Acesso a Dados

Centraliza operações de banco em funções dedicadas:

```typescript
// lib/repositories/fanfic-repository.ts
export async function getUserFanfics(userId: string): Promise<Fanfic[]> { ... }
export async function createFanfic(data: CreateFanficInput): Promise<Fanfic> { ... }
export async function updateProgress(id: string, progress: number): Promise<void> { ... }
export async function deleteFanfic(id: string): Promise<void> { ... }
```

### 5. Factory Pattern — Clientes Supabase

Diferentes clientes para diferentes contextos:

```typescript
// Browser: usa cookies do navegador
export function createClient() { return createBrowserClient(url, key); }

// Server Component: usa cookies do Next.js
export function createServerClient() { ... }

// API Route: usa service role (bypass RLS quando necessário)
export function createAdminClient() { ... }
```

---

## Schema do Banco de Dados

```sql
-- Tabela principal
create table fanfics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  work_id text not null,
  url text not null,
  title_original text,
  title_translated text,
  author text default 'Anonymous',
  language_from text default 'en',
  language_to text default 'pt',
  status text default 'pending'
    check (status in ('pending', 'translating', 'completed', 'error')),
  progress integer default 0
    check (progress >= 0 and progress <= 100),
  error_message text,
  epub_path text,                         -- path no Supabase Storage
  total_paragraphs integer default 0,
  translated_paragraphs integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, work_id)
);

-- Row Level Security
alter table fanfics enable row level security;

create policy "select_own" on fanfics
  for select using (auth.uid() = user_id);
create policy "insert_own" on fanfics
  for insert with check (auth.uid() = user_id);
create policy "update_own" on fanfics
  for update using (auth.uid() = user_id);
create policy "delete_own" on fanfics
  for delete using (auth.uid() = user_id);

-- Trigger para atualizar updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger fanfics_updated_at
  before update on fanfics
  for each row execute function update_updated_at();

-- Índices
create index idx_fanfics_user_id on fanfics(user_id);
create index idx_fanfics_status on fanfics(user_id, status);
```

**Storage Bucket**: `epubs` (privado, RLS habilitado)
- Path: `{user_id}/{fanfic_id}.epub`
- Policy: usuário só acessa seus próprios arquivos

---

## CI/CD Pipeline

### GitHub Actions

#### `.github/workflows/ci.yml` — Roda em todo PR e push para main

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint          # ESLint
      - run: npm run type-check    # tsc --noEmit
      - run: npm run build         # Verifica se builda sem erros

  # Futuro: adicionar testes quando tiver cobertura suficiente
  # test:
  #   runs-on: ubuntu-latest
  #   steps:
  #     - run: npm test
```

#### Deploy (Vercel)

Vercel faz deploy automático:
- **Push para main** → Deploy em produção
- **Push para branch / PR** → Deploy preview (URL temporária)
- **Variáveis de ambiente** → Configuradas no dashboard Vercel

Não precisa de workflow separado para deploy — Vercel cuida disso nativamente.

### Branch Strategy

```
main (produção)
  └── feat/nome-da-feature (desenvolvimento)
       └── PR → CI roda → Review → Merge → Deploy automático
```

- `main` = sempre deployável
- Features em branches separadas
- PR obrigatório para main (configurar no GitHub)
- CI deve passar antes de merge

---

## Fluxo de Tradução (Detalhado)

```
Usuário cola link → POST /api/translate
│
├─ 1. Validar URL (é AO3? é work ou series?)
├─ 2. Scrape com cheerio
│     ├─ Extrair: título, autor, idioma, conteúdo HTML
│     └─ Se restrito: retornar erro amigável
├─ 3. Inserir registro no banco (status: 'translating')
├─ 4. Salvar parágrafos no Storage como JSON temporário
├─ 5. Traduzir primeiro batch de parágrafos
│     ├─ Tentar DeepL (tag_handling=html)
│     ├─ Se HTTP 456 (quota): switch para NLLB-200
│     └─ Atualizar progresso no banco (trigger real-time)
├─ 6. Se timeout próximo e ainda tem parágrafos:
│     └─ Chamar POST /api/translate/continue {fanficId}
│
│  [/api/translate/continue repete passos 5-6 até acabar]
│
├─ 7. Todos traduzidos → Gerar EPUB em memória
│     ├─ Aplicar CSS (fontes, estilos)
│     ├─ Incluir metadados (título original, autor, link)
│     └─ Gerar TOC
├─ 8. Upload EPUB pro Supabase Storage
├─ 9. Atualizar banco: status='completed', epub_path='...'
└─ 10. Frontend recebe update via real-time → mostra "Completo"
```

---

## Variáveis de Ambiente

```bash
# .env.example (commitado — sem valores reais)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Tradução
DEEPL_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxx
```

**Importante**: `.env.local` nunca é commitado. Usar `.env.example` como template.

---

## Boas Práticas

### Código
- **TypeScript strict mode** — sem `any`, tipos explícitos em APIs
- **Funções puras** nos utilitários — input → output, sem side effects
- **Early returns** — evitar nesting profundo
- **Error boundaries** — erros em componentes não quebram toda a página
- **Validação na fronteira** — validar input nas API routes (zod)
- **Nunca confiar no client** — toda lógica crítica no server

### Segurança
- **RLS no Supabase** — usuário nunca acessa dados de outro
- **Service role só no server** — nunca expor no client
- **Validar URLs** — só aceitar links do AO3
- **Rate limiting** — limitar requests por usuário/IP
- **Sanitizar HTML** — nunca renderizar HTML não-sanitizado
- **NEXT_PUBLIC_ prefix** — só variáveis que podem ser públicas

### Performance
- **Server Components** por padrão — client components só quando precisa interatividade
- **Streaming** — usar Suspense para loading progressivo
- **Tradução em chunks** — não bloquear a função serverless
- **Índices no banco** — queries rápidas por user_id e status

### UX
- **Loading states** em toda ação assíncrona
- **Toast notifications** para feedback (sucesso/erro)
- **Optimistic updates** na lista de fanfics
- **Responsive design** — funciona no celular
- **Tema escuro** padrão (leitura de fanfics = tema escuro)

---

## Dependências Principais

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "@supabase/ssr": "^0.5.0",
    "cheerio": "^1.0.0",
    "epub-gen-memory": "^1.0.0",
    "zod": "^3.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0"
  }
}
```

---

## Ordem de Implementação

| # | Passo | Descrição | Depende de |
|---|-------|-----------|------------|
| 1 | Setup projeto | Next.js + Tailwind + shadcn + Supabase | — |
| 2 | Auth | Login, middleware, callback | 1 |
| 3 | Tipos + utils | Interfaces, helpers | 1 |
| 4 | Schema banco | Migration SQL + RLS | 1 |
| 5 | Scraper | Cheerio + seletores AO3 | 3 |
| 6 | Tradutor | DeepL + NLLB fallback | 3 |
| 7 | Gerador EPUB | epub-gen-memory | 3 |
| 8 | API routes | Endpoints REST | 2, 4, 5, 6, 7 |
| 9 | Dashboard UI | Componentes + real-time | 2, 8 |
| 10 | CI/CD | GitHub Actions | 1 |
| 11 | Deploy | Vercel + env vars | tudo |

---

## Referências

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Supabase Auth + Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [DeepL API Docs](https://developers.deepl.com/docs)
- [HuggingFace Inference API](https://huggingface.co/docs/api-inference)
- [NLLB-200 Model](https://huggingface.co/facebook/nllb-200-distilled-1.3B)
- [epub-gen-memory](https://www.npmjs.com/package/epub-gen-memory)
- [shadcn/ui](https://ui.shadcn.com)
