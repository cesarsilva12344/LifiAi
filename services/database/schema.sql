-- ═══════════════════════════════════════════════════════
-- LifeOS AI — Schema do Supabase (Blueprint Master Consolidado)
-- ═══════════════════════════════════════════════════════

-- Habilitar pgvector para busca semântica real nas memórias
CREATE EXTENSION IF NOT EXISTS vector;

-- ==========================================
-- CORE & AUTH
-- ==========================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE,
  nome TEXT NOT NULL,
  email TEXT UNIQUE,
  telefone TEXT,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  config JSONB DEFAULT '{}',
  life_score NUMERIC(4,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  parent_id UUID REFERENCES categories(id),
  nome TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('DESPESA', 'RECEITA', 'ATIVO', 'PASSIVO')),
  nivel INT DEFAULT 0,
  cor TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  nome TEXT NOT NULL,
  cor TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- FINANCEIRO AVANÇADO
-- ==========================================
CREATE TABLE IF NOT EXISTS credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  nome TEXT NOT NULL,
  limite_total DECIMAL(12,2) CHECK (limite_total >= 0),
  dia_fechamento INT CHECK (dia_fechamento BETWEEN 1 AND 31),
  dia_vencimento INT CHECK (dia_vencimento BETWEEN 1 AND 31),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES credit_cards(id),
  user_id UUID REFERENCES auth.users(id),
  category_id UUID REFERENCES categories(id),
  descricao TEXT,
  valor DECIMAL(12,2) CHECK (valor > 0),
  parcelas INT DEFAULT 1,
  parcela_atual INT DEFAULT 1,
  data_compra DATE,
  quitada BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  category_id UUID REFERENCES categories(id),
  valor_planejado DECIMAL(12,2) CHECK (valor_planejado >= 0),
  valor_realizado DECIMAL(12,2) DEFAULT 0,
  mes INT CHECK (mes BETWEEN 1 AND 12),
  ano INT,
  UNIQUE(user_id, category_id, mes, ano),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  descricao TEXT NOT NULL,
  credor TEXT,
  valor_original DECIMAL(12,2),
  saldo_atual DECIMAL(12,2),
  vencimento DATE,
  status TEXT CHECK (status IN ('ABERTA', 'PARCIAL', 'QUITADA', 'ATRASADA')) DEFAULT 'ABERTA',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS debt_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID REFERENCES debts(id),
  valor_pago DECIMAL(12,2) CHECK (valor_pago > 0),
  data_pagamento DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  account_id UUID,
  category_id UUID REFERENCES categories(id),
  tipo TEXT CHECK (tipo IN ('RECEITA', 'DESPESA', 'TRANSFERENCIA')),
  valor DECIMAL(12,2),
  descricao TEXT,
  data_movimento DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transaction_tags (
  transaction_id UUID REFERENCES financial_transactions(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (transaction_id, tag_id)
);

-- ==========================================
-- UPLOAD & CONCILIAÇÃO
-- ==========================================
CREATE TABLE IF NOT EXISTS financial_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  file_url TEXT NOT NULL,
  file_name TEXT,
  processed_status TEXT CHECK (processed_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'ERROR')) DEFAULT 'PENDING',
  total_rows INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- MEDITAÇÃO & RITUAL MATINAL
-- ==========================================
CREATE TABLE IF NOT EXISTS meditation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  duration_seconds INT CHECK (duration_seconds BETWEEN 60 AND 3600),
  type TEXT CHECK (type IN ('breathing', 'guided', 'gratitude', 'visualization', 'body_scan')),
  mood_before INT CHECK (mood_before BETWEEN 1 AND 10),
  mood_after INT CHECK (mood_after BETWEEN 1 AND 10),
  notes TEXT,
  completed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS morning_routine_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  wake_up_time TIME DEFAULT '07:00:00',
  meditation_enabled BOOLEAN DEFAULT true,
  meditation_duration INT DEFAULT 600,
  briefing_enabled BOOLEAN DEFAULT true,
  gratitude_prompt BOOLEAN DEFAULT true,
  intention_setting BOOLEAN DEFAULT true,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS daily_intentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  date DATE DEFAULT CURRENT_DATE,
  intention_text TEXT,
  focus_area TEXT,
  completed BOOLEAN DEFAULT false,
  reflection TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  mood_score INT CHECK (mood_score BETWEEN 1 AND 10),
  energy_level INT CHECK (energy_level BETWEEN 1 AND 10),
  context TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- COGNITIVO & PRODUTIVIDADE
-- ==========================================
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  context TEXT,
  expected_outcome TEXT,
  actual_outcome TEXT,
  review_at DATE,
  reviewed BOOLEAN DEFAULT false,
  status TEXT CHECK (status IN ('ACTIVE', 'REVIEW_PENDING', 'REVIEWED', 'ARCHIVED')) DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS energy_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  task_id UUID,
  energy_level INT CHECK (energy_level BETWEEN 1 AND 10),
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  generated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- ==========================================
-- IA & CAPTURA
-- ==========================================
CREATE TABLE IF NOT EXISTS ai_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID,
  user_id UUID REFERENCES auth.users(id),
  source TEXT CHECK (source IN ('text', 'voice', 'image', 'telegram')),
  confidence DECIMAL(3,2) CHECK (confidence BETWEEN 0 AND 1),
  extracted_json JSONB,
  status TEXT CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'REVIEW')) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  embedding vector(1536),
  origem TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- AUDITORIA & SISTEMA
-- ==========================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela TEXT,
  registro_id UUID,
  operacao TEXT,
  antes JSONB,
  depois JSONB,
  usuario_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS simulator_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  params JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leakage_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  category TEXT NOT NULL,
  detected_change NUMERIC NOT NULL,
  description TEXT,
  dismissed BOOLEAN DEFAULT false,
  detected_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- ÍNDICES OTIMIZADOS
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_date ON financial_transactions(user_id, data_movimento);
CREATE INDEX IF NOT EXISTS idx_meditation_user_date ON meditation_sessions(user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_mood_user_context ON mood_logs(user_id, context, recorded_at);
CREATE INDEX IF NOT EXISTS idx_budgets_user_period ON budgets(user_id, ano, mes);
CREATE INDEX IF NOT EXISTS idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_leakage_user_dismissed ON leakage_alerts(user_id, dismissed);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meditation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE morning_routine_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_intentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE leakage_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulator_runs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (exemplos genéricos de segurança do usuário)
DROP POLICY IF EXISTS "user_own_profile" ON user_profiles;
CREATE POLICY "user_own_profile" ON user_profiles FOR ALL USING (id = auth.uid());

DROP POLICY IF EXISTS "user_own_data" ON financial_transactions;
CREATE POLICY "user_own_data" ON financial_transactions FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_own_meditation" ON meditation_sessions;
CREATE POLICY "user_own_meditation" ON meditation_sessions FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_own_budgets" ON budgets;
CREATE POLICY "user_own_budgets" ON budgets FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_own_cards" ON credit_cards;
CREATE POLICY "user_own_cards" ON credit_cards FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_own_card_trans" ON card_transactions;
CREATE POLICY "user_own_card_trans" ON card_transactions FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_own_debts" ON debts;
CREATE POLICY "user_own_debts" ON debts FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_own_debt_pmts" ON debt_payments;
CREATE POLICY "user_own_debt_pmts" ON debt_payments FOR ALL USING (exists (select 1 from debts d where d.id = debt_id and d.user_id = auth.uid()));

DROP POLICY IF EXISTS "user_own_morning" ON morning_routine_config;
CREATE POLICY "user_own_morning" ON morning_routine_config FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_own_intentions" ON daily_intentions;
CREATE POLICY "user_own_intentions" ON daily_intentions FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_own_mood" ON mood_logs;
CREATE POLICY "user_own_mood" ON mood_logs FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_own_decisions" ON decisions;
CREATE POLICY "user_own_decisions" ON decisions FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_own_energy" ON energy_logs;
CREATE POLICY "user_own_energy" ON energy_logs FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_own_briefings" ON briefings;
CREATE POLICY "user_own_briefings" ON briefings FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_own_extractions" ON ai_extractions;
CREATE POLICY "user_own_extractions" ON ai_extractions FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_own_memories" ON memories;
CREATE POLICY "user_own_memories" ON memories FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_own_uploads" ON financial_uploads;
CREATE POLICY "user_own_uploads" ON financial_uploads FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_own_tags" ON tags;
CREATE POLICY "user_own_tags" ON tags FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_own_simulations" ON simulator_runs;
CREATE POLICY "user_own_simulations" ON simulator_runs FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_own_leakage" ON leakage_alerts;
CREATE POLICY "user_own_leakage" ON leakage_alerts FOR ALL USING (user_id = auth.uid());

-- ==========================================
-- VIEWS & FUNÇÕES AUXILIARES
-- ==========================================

-- View: Resumo do Cartão de Crédito
CREATE OR REPLACE VIEW v_card_summary AS
SELECT 
  c.id AS card_id,
  c.nome,
  c.limite_total,
  COALESCE(SUM(ct.valor) FILTER (WHERE ct.quitada = false), 0) AS limite_consumido,
  c.limite_total - COALESCE(SUM(ct.valor) FILTER (WHERE ct.quitada = false), 0) AS limite_disponivel,
  COUNT(*) FILTER (WHERE ct.quitada = false) AS transacoes_abertas
FROM credit_cards c
LEFT JOIN card_transactions ct ON ct.card_id = c.id
WHERE c.ativo = true
GROUP BY c.id, c.nome, c.limite_total;

-- View: Estatísticas de Meditação
CREATE OR REPLACE VIEW v_meditation_stats AS
SELECT 
  user_id,
  COUNT(*) as total_sessions,
  SUM(duration_seconds) as total_minutes,
  AVG(mood_after - mood_before) as avg_mood_lift,
  MAX(completed_at) as last_session
FROM meditation_sessions
GROUP BY user_id;

-- View: Conciliação Financeira (Planejado vs Real)
CREATE OR REPLACE VIEW v_financial_reconciliation AS
SELECT 
  b.id,
  b.category_id,
  b.mes,
  b.ano,
  b.valor_planejado,
  COALESCE(SUM(ft.valor), 0) as valor_realizado,
  b.valor_planejado - COALESCE(SUM(ft.valor), 0) as diferenca,
  CASE 
    WHEN ABS(b.valor_planejado - COALESCE(SUM(ft.valor), 0)) < 1 THEN 'OK'
    ELSE 'DIFERENCA'
  END as status_conciliacao
FROM budgets b
LEFT JOIN financial_transactions ft ON b.category_id = ft.category_id 
  AND EXTRACT(MONTH FROM ft.data_movimento) = b.mes
  AND EXTRACT(YEAR FROM ft.data_movimento) = b.ano
GROUP BY b.id, b.category_id, b.mes, b.ano, b.valor_planejado;

-- Função: Calcular Life Score
CREATE OR REPLACE FUNCTION calculate_life_score(p_user_id UUID)
RETURNS NUMERIC(4,2) AS $$
DECLARE
  finance_score NUMERIC := 0;
  productivity_score NUMERIC := 0;
  health_score NUMERIC := 0;
  mindfulness_score NUMERIC := 0;
  meditation_bonus NUMERIC := 0;
BEGIN
  -- Health Score (baseado em mood/energia)
  SELECT COALESCE(AVG(mood_score), 5) INTO health_score 
  FROM mood_logs WHERE user_id = p_user_id;
  
  -- Mindfulness Score
  SELECT CASE WHEN COUNT(*) > 0 THEN 40 ELSE 0 END INTO meditation_bonus
  FROM meditation_sessions 
  WHERE user_id = p_user_id 
    AND completed_at >= NOW() - INTERVAL '24 hours';
  
  mindfulness_score := meditation_bonus;
  
  -- Finance Score (simplificado)
  finance_score := 70; -- Placeholder
  
  -- Productivity Score
  productivity_score := 75; -- Placeholder
  
  RETURN LEAST(100, 
    (finance_score * 0.35) + 
    (productivity_score * 0.30) + 
    (health_score * 0.20) + 
    (mindfulness_score * 0.15)
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger: Atualizar Life Score automaticamente
CREATE OR REPLACE FUNCTION trg_update_life_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles 
  SET life_score = calculate_life_score(NEW.user_id),
      updated_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers no banco de dados para sincronizar Life Score
CREATE OR REPLACE TRIGGER after_meditation_complete
AFTER INSERT ON meditation_sessions
FOR EACH ROW EXECUTE FUNCTION trg_update_life_score();

CREATE OR REPLACE TRIGGER after_mood_logged
AFTER INSERT ON mood_logs
FOR EACH ROW EXECUTE FUNCTION trg_update_life_score();

-- Função utilitária para energia média horária
CREATE OR REPLACE FUNCTION get_avg_energy_by_hour(p_user_id UUID)
RETURNS TABLE(hour INT, avg_energy NUMERIC) AS $$
  SELECT EXTRACT(HOUR FROM created_at)::INT as hour, AVG(energy_level)::NUMERIC(3,2)
  FROM energy_logs
  WHERE user_id = p_user_id
  GROUP BY 1 ORDER BY 1;
$$ LANGUAGE sql STABLE;
