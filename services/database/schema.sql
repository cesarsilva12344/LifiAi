-- ═══════════════════════════════════════════════════════
-- LifeOS AI — Schema do Supabase
-- ═══════════════════════════════════════════════════════
-- Instruções:
-- 1. Acesse: https://supabase.com → seu projeto → SQL Editor
-- 2. Cole todo este conteúdo e clique em "Run"
-- 3. Configure as variáveis de ambiente na Vercel:
--    SUPABASE_URL=https://xxxx.supabase.co
--    SUPABASE_SERVICE_KEY=eyJ... (service_role key)
-- ═══════════════════════════════════════════════════════

-- Perfil do usuário (linha única, id fixo = 1)
CREATE TABLE IF NOT EXISTS user_profile (
  id          INTEGER PRIMARY KEY DEFAULT 1,
  nome        TEXT    NOT NULL DEFAULT 'Usuário',
  app_name    TEXT    NOT NULL DEFAULT 'LifeOS AI',
  gemini_api_key     TEXT DEFAULT '',
  deepseek_api_key   TEXT DEFAULT '',
  qwen_api_key       TEXT DEFAULT '',
  telegram_bot_token TEXT DEFAULT '',
  telegram_chat_id   TEXT DEFAULT '',
  interesses  JSONB   DEFAULT '[]',
  objetivos   JSONB   DEFAULT '[]',
  preferencias JSONB  DEFAULT '[]',
  contexto    TEXT    DEFAULT '',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Linha padrão
INSERT INTO user_profile (id, nome, app_name)
VALUES (1, 'Usuário', 'LifeOS AI')
ON CONFLICT (id) DO NOTHING;

-- ───────────────────────────────────────────────────────
-- Personas (agentes de IA)
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS personas (
  id          TEXT PRIMARY KEY,
  nome        TEXT    NOT NULL,
  descricao   TEXT    DEFAULT '',
  prompt_base TEXT    DEFAULT '',
  ativa       BOOLEAN DEFAULT FALSE,
  icon        TEXT    DEFAULT 'Brain',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Apenas uma persona ativa por vez
CREATE UNIQUE INDEX IF NOT EXISTS idx_personas_ativa
  ON personas (ativa) WHERE ativa = TRUE;

-- ───────────────────────────────────────────────────────
-- Inbox (log cronológico de todas as capturas)
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inbox (
  id           TEXT PRIMARY KEY,
  type         TEXT    NOT NULL DEFAULT 'note',
  raw_content  TEXT    NOT NULL DEFAULT '',
  source       TEXT    DEFAULT 'Telegram',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  processed    BOOLEAN DEFAULT FALSE,
  extracted_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_inbox_created_at ON inbox (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inbox_type ON inbox (type);

-- ───────────────────────────────────────────────────────
-- Despesas
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id        TEXT PRIMARY KEY,
  valor     NUMERIC(12, 2) NOT NULL DEFAULT 0,
  categoria TEXT DEFAULT 'Geral',
  descricao TEXT DEFAULT '',
  data      DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_data ON expenses (data DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_categoria ON expenses (categoria);

-- ───────────────────────────────────────────────────────
-- Receitas
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS income (
  id        TEXT PRIMARY KEY,
  valor     NUMERIC(12, 2) NOT NULL DEFAULT 0,
  categoria TEXT DEFAULT 'Receita',
  descricao TEXT DEFAULT '',
  data      DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_income_data ON income (data DESC);

-- ───────────────────────────────────────────────────────
-- Tarefas
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id         TEXT PRIMARY KEY,
  titulo     TEXT NOT NULL,
  status     TEXT DEFAULT 'pending'
             CHECK (status IN ('pending', 'completed')),
  prioridade TEXT DEFAULT 'medium'
             CHECK (prioridade IN ('high', 'medium', 'low')),
  prazo      DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_prioridade ON tasks (prioridade);

-- ───────────────────────────────────────────────────────
-- Lembretes
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reminders (
  id        TEXT PRIMARY KEY,
  titulo    TEXT NOT NULL,
  data_hora TIMESTAMPTZ,
  status    TEXT DEFAULT 'active'
            CHECK (status IN ('active', 'completed', 'canceled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders (status);
CREATE INDEX IF NOT EXISTS idx_reminders_data_hora ON reminders (data_hora);

-- ───────────────────────────────────────────────────────
-- Metas
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
  id         TEXT PRIMARY KEY,
  titulo     TEXT NOT NULL,
  meta       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  progresso  NUMERIC(12, 2) DEFAULT 0,
  prazo      DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────
-- Hábitos
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS habits (
  id         TEXT PRIMARY KEY,
  nome       TEXT NOT NULL,
  frequencia TEXT DEFAULT 'diaria'
             CHECK (frequencia IN ('diaria', 'semanal')),
  streak     INTEGER DEFAULT 0,
  history    JSONB DEFAULT '[]',   -- array de strings 'YYYY-MM-DD'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────
-- Projetos
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id         TEXT PRIMARY KEY,
  nome       TEXT NOT NULL,
  descricao  TEXT DEFAULT '',
  status     TEXT DEFAULT 'planning'
             CHECK (status IN ('planning', 'active', 'completed', 'on_hold')),
  progresso  INTEGER DEFAULT 0
             CHECK (progresso >= 0 AND progresso <= 100),
  cliente    TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status);

-- ───────────────────────────────────────────────────────
-- Notas
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id         TEXT PRIMARY KEY,
  conteudo   TEXT NOT NULL,
  tags       JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────
-- Ideias
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ideas (
  id         TEXT PRIMARY KEY,
  titulo     TEXT NOT NULL,
  conteudo   TEXT DEFAULT '',
  score      INTEGER DEFAULT 5
             CHECK (score >= 1 AND score <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────
-- Memórias (com suporte a embedding vetorial)
-- ───────────────────────────────────────────────────────

-- OPCIONAL: habilite pgvector para busca semântica real
-- (rodar separado antes das tabelas se quiser usar VECTOR):
-- CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS memories (
  id         TEXT PRIMARY KEY,
  conteudo   TEXT NOT NULL,
  embedding  JSONB DEFAULT 'null',
  -- Se pgvector habilitado, substituir a linha acima por:
  -- embedding VECTOR(1536),
  origem     TEXT DEFAULT 'Telegram',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories (created_at DESC);

-- ───────────────────────────────────────────────────────
-- Histórico do Telegram
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS telegram_history (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender    TEXT NOT NULL DEFAULT 'user'
            CHECK (sender IN ('user', 'bot')),
  text      TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_history_ts ON telegram_history (timestamp DESC);

-- ═══════════════════════════════════════════════════════
-- Row Level Security (RLS)
-- Para app single-user com service_role key: desabilite RLS
-- Para multi-usuário futuro: configure policies
-- ═══════════════════════════════════════════════════════

ALTER TABLE user_profile     DISABLE ROW LEVEL SECURITY;
ALTER TABLE personas         DISABLE ROW LEVEL SECURITY;
ALTER TABLE inbox            DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses         DISABLE ROW LEVEL SECURITY;
ALTER TABLE income           DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks            DISABLE ROW LEVEL SECURITY;
ALTER TABLE reminders        DISABLE ROW LEVEL SECURITY;
ALTER TABLE goals            DISABLE ROW LEVEL SECURITY;
ALTER TABLE habits           DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects         DISABLE ROW LEVEL SECURITY;
ALTER TABLE notes            DISABLE ROW LEVEL SECURITY;
ALTER TABLE ideas            DISABLE ROW LEVEL SECURITY;
ALTER TABLE memories         DISABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_history DISABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════
-- Verificação final
-- ═══════════════════════════════════════════════════════
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
