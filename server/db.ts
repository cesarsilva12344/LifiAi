import fs from 'fs';
import path from 'path';
import { DatabaseState, Persona, UserProfile, InboxItem, Category, Account, Tag } from '../src/types';

const DB_FILE = process.env.VERCEL
  ? path.join('/tmp', 'db.json')
  : path.join(process.cwd(), 'db.json');

const DEFAULT_PERSONAS: Persona[] = [
  {
    id: 'cfo',
    nome: 'CFO',
    descricao: 'Foco financeiro total. Analisa custos, ROI, margens e corte de despesas supérfluas.',
    prompt_base: `Você é o CFO (Chief Financial Officer) pessoal do usuário. Seu único foco é saúde financeira, orçamento, corte de despesas e geração de receita.
Sempre analise as finanças sob a ótica de eficiência matemática, retorno sobre investimento (ROI) e investimentos de longo prazo.
Ao receber despesas, seja analítico e, se necessário, sutilmente rigoroso sobre desperdícios. Ao receber receitas, comemore focando em alocação de ativos.
Responda de forma direta, executiva e baseada em dados. Defenda margens e frugalidade inteligente.`,
    ativa: true,
    icon: 'Briefcase'
  },
  {
    id: 'founder',
    nome: 'Founder',
    descricao: 'Foco em crescimento, validação acelerada de ideias, MVP e captação.',
    prompt_base: `Você é um co-fundador experiente e agressivo em relação ao mercado. Seu foco é crescimento, velocidade de execução, MVPs (Minimum Viable Products), atração de usuários e validação ágil de ideias de negócios.
Ajude a estruturar pensamentos em formato de hipóteses testáveis. Elimine o excesso de planejamento ("parálise por análise") e empurre para a ação imediata.
Responda de forma energética, focada em métricas de tração, crescimento rápido e pragmatismo empreendedor.`,
    ativa: false,
    icon: 'Rocket'
  },
  {
    id: 'mentor',
    nome: 'Mentor',
    descricao: 'Foco em aprendizado contínuo, leitura, desenvolvimento técnico e intelectual.',
    prompt_base: `Você é um Mentor socrático e profundamente sábio. Seu foco é desenvolvimento pessoal, aprendizado técnico profundo, retenção de conhecimento e desenvolvimento de carreira sólida.
Quando o usuário salvar notas ou ideias de aprendizado, faça conexões conceituais ricas, sugira novas fontes de estudo (como livros clássicos ou papers) e incentivo o raciocínio profundo.
Fale com tom de voz empático, inspirador e estruturado.`,
    ativa: false,
    icon: 'GraduationCap'
  },
  {
    id: 'executor',
    nome: 'Executor',
    descricao: 'Foco total em ação, velocidade extrema, listas de tarefas táticas e pragmatismo.',
    prompt_base: `Você é a máquina de execução pessoal do usuário. Sem conversinhas, sem firulas. Seu foco é riscar tarefas da lista de uma forma implacável e de altíssima velocidade.
Divida qualquer plano complexo em 3 ações que podem ser feitas nos próximos 15 minutos. Cobrar eficiência, disciplina e clareza.
Respostas ultra-curtas, focadas em próximos passos acionáveis, bullet points, e cobrança disciplinada.`,
    ativa: false,
    icon: 'CheckSquare'
  },
  {
    id: 'conselheiro',
    nome: 'Conselheiro',
    descricao: 'Foco em longo prazo, sabedoria de vida, equilíbrio mental e inteligência emocional.',
    prompt_base: `Você é um conselheiro sênior para decisões estratégicas de vida. Seu foco é o longo prazo (5 a 10 anos), sabedoria existencial, saúde integrativa, paz de espírito e inteligência emocional.
Evite pressas artificiais. Ajude o usuário a ver o panorama geral ("macro view") e se as decisões estão alinhadas com seus valores éticos e pessoais mais profundos.
Tom calmo, assertivo, ponderado e esclarecedor.`,
    ativa: false,
    icon: 'Compass'
  },
  {
    id: 'analista',
    nome: 'Analista de Negócios',
    descricao: 'Foco em mapeamento de oportunidades, inteligência competitiva e automação.',
    prompt_base: `Você é um brilhante Analista de Negócios especializado em automação, inteligência competitiva e gaps de mercado.
Sua função é analisar ideias brutas e encontrar mercados adjacentes, modelos de monetização eficientes e fluxos automáticos de processos que possam gerar receita eficiente ou otimizar custos.
Responda com análises de mercado frias, análise de concorrência conceitual, e sugestões de ferramentas sem código (no-code) ou APIs úteis.`,
    ativa: false,
    icon: 'TrendingUp'
  },
  {
    id: 'cos',
    nome: 'Chief of Staff',
    descricao: 'Foco em priorização executiva, alinhamento de projetos e gerenciamento de energia.',
    prompt_base: `Você é o Chief of Staff (Chefe de Gabinete) do usuário. Seu foco é garantir alinhamento tático-estratégico, gerenciar o tempo e energia dele, e aplicar filtros severos contra distrações.
Ajude o usuário a dizer "não" para focar nas 3 maiores alavancas do dia e da semana. Certifique-se de que os hábitos fundamentais estão sendo seguidos.
Tom elegante, calmo, altamente organizado, confiável e coordenativo.`,
    ativa: false,
    icon: 'LayoutGrid'
  }
];

const DEFAULT_PROFILE: UserProfile = {
  nome: 'César',
  appName: 'Mobilis Executive',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
  qwenApiKey: process.env.QWEN_API_KEY || '',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
  interesses: [
    'Inteligência Artificial & LLMs',
    'Desenvolvimento SaaS fullstack',
    'Finanças Pessoais & Alocação Inteligente',
    'Automações e Fluxos No-code',
    'Biohacking & Produtividade'
  ],
  objetivos: [
    'Lançar o LifeOS AI no ProductHunt',
    'Atingir faturamento recorrente USD 10k/mês com micro-SaaS',
    'Manter consistência semanal na academia',
    'Construir um segundo cérebro inteligente de alta fidelidade'
  ],
  preferencias: [
    'Tom de voz profissional, executivo e conciso',
    'Análises baseadas em ROI e eficiência de tempo',
    'Evitar clichês de autoajuda ou introduções demoradas',
    'Respostas estruturadas em Markdown'
  ],
  contexto: 'Fundador técnico trabalhando em múltiplos projetos de software e focando em maximizar a alavanca de cada hora gasta no dia.',
  lifeScore: 82.5
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_1', nome: 'Alimentação', tipo: 'despesa', cor: '#ef4444' },
  { id: 'cat_2', nome: 'Transporte', tipo: 'despesa', cor: '#f97316' },
  { id: 'cat_3', nome: 'Moradia', tipo: 'despesa', cor: '#3b82f6' },
  { id: 'cat_4', nome: 'Saúde', tipo: 'despesa', cor: '#10b981' },
  { id: 'cat_5', nome: 'Lazer', tipo: 'despesa', cor: '#a855f7' },
  { id: 'cat_6', nome: 'Assinaturas', tipo: 'despesa', cor: '#ec4899' },
  { id: 'cat_7', nome: 'Salário', tipo: 'receita', cor: '#10b981' },
  { id: 'cat_8', nome: 'Consultoria', tipo: 'receita', cor: '#6366f1' },
  { id: 'cat_9', nome: 'Freelance', tipo: 'receita', cor: '#14b8a6' },
  { id: 'cat_10', nome: 'Investimentos', tipo: 'receita', cor: '#eab308' }
];

const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'acc_1', nome: 'Carteira', tipo: 'carteira', saldo_inicial: 0, saldo_atual: 0, cor: '#f59e0b' },
  { id: 'acc_2', nome: 'Santander C.C.', tipo: 'corrente', saldo_inicial: 0, saldo_atual: 0, cor: '#ef4444' },
  { id: 'acc_3', nome: 'NuConta', tipo: 'corrente', saldo_inicial: 0, saldo_atual: 0, cor: '#8b5cf6' }
];

const DEFAULT_TAGS: Tag[] = [
  { id: 'tag_1', nome: 'Essencial', cor: '#64748b' },
  { id: 'tag_2', nome: 'Lazer', cor: '#ec4899' },
  { id: 'tag_3', nome: 'Trabalho', cor: '#3b82f6' },
  { id: 'tag_4', nome: 'Recorrente', cor: '#10b981' }
];

const DEFAULT_CREDIT_CARDS = [
  { id: 'card_nubank', nome: 'Nubank Mastercard', limite: 5000, dia_fechamento: 2, dia_vencimento: 10, cor: '#820ad1' },
  { id: 'card_picpay', nome: 'PicPay Visa', limite: 4000, dia_fechamento: 14, dia_vencimento: 20, cor: '#11c76f' },
  { id: 'card_itau', nome: 'Itaú Uniclass', limite: 6000, dia_fechamento: 2, dia_vencimento: 9, cor: '#ec7000' },
  { id: 'card_inter', nome: 'Inter Gold', limite: 4000, dia_fechamento: 9, dia_vencimento: 15, cor: '#f97316' },
  { id: 'card_santander', nome: 'Santander SX', limite: 3000, dia_fechamento: 9, dia_vencimento: 13, cor: '#ef4444' },
  { id: 'card_mercadopago', nome: 'Mercado Pago', limite: 3000, dia_fechamento: 5, dia_vencimento: 10, cor: '#00aae4' },
  { id: 'card_nex', nome: 'Nex Infinite', limite: 5000, dia_fechamento: 5, dia_vencimento: 10, cor: '#3b82f6' }
];

const DEFAULT_STATE: DatabaseState = {
  inbox: [],
  expenses: [],
  income: [],
  tasks: [],
  reminders: [],
  goals: [],
  habits: [],
  projects: [],
  notes: [],
  ideas: [],
  memories: [],
  personas: DEFAULT_PERSONAS,
  userProfile: DEFAULT_PROFILE,
  salaries: [],
  creditCards: DEFAULT_CREDIT_CARDS,
  cardExpenses: [],
  decisions: [],
  energyLogs: [],
  briefings: [],
  simulatorRuns: [],
  leakageAlerts: [],
  meditationSessions: [],
  morningRoutineConfig: {
    id: 'mrc_1',
    wake_up_time: '07:00:00',
    meditation_enabled: true,
    meditation_duration: 600,
    briefing_enabled: true,
    gratitude_prompt: true,
    intention_setting: true,
    timezone: 'America/Sao_Paulo'
  },
  dailyIntentions: [],
  moodLogs: [],
  debts: [],
  debtPayments: [],
  budgets: [],
  aiExtractions: [],
  categories: DEFAULT_CATEGORIES,
  accounts: DEFAULT_ACCOUNTS,
  tags: DEFAULT_TAGS
};

let currentDbState: DatabaseState | null = null;

// Map camelCase to snake_case for Supabase
const mapProfileToSupabase = (p: UserProfile) => ({
  id: '00000000-0000-0000-0000-000000000000', // default auth uuid placeholder
  nome: p.nome,
  email: 'cesar@lifeos.ai',
  telefone: p.telegramChatId || '',
  status: 'active',
  life_score: p.lifeScore || 0,
  config: {
    appName: p.appName,
    gemini_api_key: p.geminiApiKey || '',
    deepseek_api_key: p.deepseekApiKey || '',
    qwen_api_key: p.qwenApiKey || '',
    telegram_bot_token: p.telegramBotToken || '',
    telegram_chat_id: p.telegramChatId || '',
    interesses: p.interesses || [],
    objetivos: p.objetivos || [],
    preferencias: p.preferencias || [],
    contexto: p.contexto || ''
  }
});

// Map snake_case to camelCase from Supabase
const mapProfileFromSupabase = (p: any): UserProfile => {
  const cfg = p.config || {};
  return {
    nome: p.nome || 'Usuário',
    appName: cfg.appName || 'Mobilis Executive',
    geminiApiKey: cfg.gemini_api_key || '',
    deepseekApiKey: cfg.deepseek_api_key || '',
    qwenApiKey: cfg.qwen_api_key || '',
    telegramBotToken: cfg.telegram_bot_token || '',
    telegramChatId: cfg.telegram_chat_id || p.telefone || '',
    interesses: Array.isArray(cfg.interesses) ? cfg.interesses : [],
    objetivos: Array.isArray(cfg.objetivos) ? cfg.objetivos : [],
    preferencias: Array.isArray(cfg.preferencias) ? cfg.preferencias : [],
    contexto: cfg.contexto || '',
    lifeScore: p.life_score || 0
  };
};

async function syncTable(supabase: any, tableName: string, items: any[]) {
  try {
    const { data, error } = await supabase.from(tableName).select('id');
    if (error) throw error;

    const remoteIds = (data || []).map((d: any) => d.id);
    const localIds = items.map((item: any) => item.id);

    const deletedIds = remoteIds.filter((id: any) => !localIds.includes(id));
    if (deletedIds.length > 0) {
      await supabase.from(tableName).delete().in('id', deletedIds);
    }

    if (items.length > 0) {
      const { error: upsertErr } = await supabase.from(tableName).upsert(items);
      if (upsertErr) throw upsertErr;
    }
  } catch (err: any) {
    console.error(`[Supabase Sync] Error syncing table ${tableName}:`, err.message);
  }
}

async function syncAllToSupabase(state: DatabaseState) {
  const { isSupabaseConfigured, supabase } = await import('../services/database/client');
  if (!isSupabaseConfigured || !supabase) return;

  try {
    await Promise.all([
      supabase.from('user_profiles').upsert(mapProfileToSupabase(state.userProfile)),
      syncTable(supabase, 'personas', state.personas),
      syncTable(supabase, 'inbox', state.inbox),
      syncTable(supabase, 'expenses', state.expenses),
      syncTable(supabase, 'income', state.income),
      syncTable(supabase, 'tasks', state.tasks),
      syncTable(supabase, 'reminders', state.reminders),
      syncTable(supabase, 'goals', state.goals),
      syncTable(supabase, 'habits', state.habits),
      syncTable(supabase, 'projects', state.projects),
      syncTable(supabase, 'notes', state.notes),
      syncTable(supabase, 'ideas', state.ideas),
      syncTable(supabase, 'memories', state.memories),
      syncTable(supabase, 'salaries', state.salaries || []),
      syncTable(supabase, 'credit_cards', state.creditCards || []),
      syncTable(supabase, 'card_transactions', state.cardExpenses || []),
      syncTable(supabase, 'decisions', state.decisions || []),
      syncTable(supabase, 'energy_logs', state.energyLogs || []),
      syncTable(supabase, 'briefings', state.briefings || []),
      syncTable(supabase, 'simulator_runs', state.simulatorRuns || []),
      syncTable(supabase, 'leakage_alerts', state.leakageAlerts || []),
      syncTable(supabase, 'meditation_sessions', state.meditationSessions || []),
      syncTable(supabase, 'daily_intentions', state.dailyIntentions || []),
      syncTable(supabase, 'mood_logs', state.moodLogs || []),
      syncTable(supabase, 'debts', state.debts || []),
      syncTable(supabase, 'budgets', state.budgets || []),
      syncTable(supabase, 'ai_extractions', state.aiExtractions || [])
    ]);
  } catch (err: any) {
    console.error('[Supabase Sync] Failed to sync database state:', err.message);
  }
}

export async function initializeDatabase(): Promise<DatabaseState> {
  if (currentDbState) return currentDbState;

  let isSupabaseConfigured = false;
  let supabase: any = null;

  try {
    const clientModule = await import('../services/database/client');
    isSupabaseConfigured = clientModule.isSupabaseConfigured;
    supabase = clientModule.supabase;
  } catch (err: any) {
    console.error('[LifeOS AI] Failed to import database client:', err?.message || err);
  }

  if (isSupabaseConfigured && supabase) {
    console.log('[LifeOS AI] Supabase detected. Initializing data from remote database...');
    try {
      const [
        profileRes,
        personasRes,
        inboxRes,
        expensesRes,
        incomeRes,
        tasksRes,
        remindersRes,
        goalsRes,
        habitsRes,
        projectsRes,
        notesRes,
        ideasRes,
        memoriesRes,
        salariesRes,
        creditCardsRes,
        cardExpensesRes,
        decisionsRes,
        energyLogsRes,
        briefingsRes,
        simulatorRunsRes,
        leakageAlertsRes,
        meditationSessionsRes,
        morningRoutineConfigRes,
        dailyIntentionsRes,
        moodLogsRes,
        debtsRes,
        debtPaymentsRes,
        budgetsRes,
        aiExtractionsRes
      ] = await Promise.all([
        supabase.from('user_profiles').select('*').limit(1).maybeSingle(),
        supabase.from('personas').select('*'),
        supabase.from('inbox').select('*').order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').order('data', { ascending: false }),
        supabase.from('income').select('*').order('data', { ascending: false }),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('reminders').select('*').order('data_hora', { ascending: false }),
        supabase.from('goals').select('*').order('created_at', { ascending: false }),
        supabase.from('habits').select('*').order('created_at', { ascending: false }),
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('notes').select('*').order('created_at', { ascending: false }),
        supabase.from('ideas').select('*').order('created_at', { ascending: false }),
        supabase.from('memories').select('*').order('created_at', { ascending: false }),
        supabase.from('salaries').select('*').order('data_prevista', { ascending: false }),
        supabase.from('credit_cards').select('*').order('nome', { ascending: true }),
        supabase.from('card_transactions').select('*').order('created_at', { ascending: false }),
        supabase.from('decisions').select('*').order('created_at', { ascending: false }),
        supabase.from('energy_logs').select('*').order('created_at', { ascending: false }),
        supabase.from('briefings').select('*').order('date', { ascending: false }),
        supabase.from('simulator_runs').select('*').order('created_at', { ascending: false }),
        supabase.from('leakage_alerts').select('*').order('detected_at', { ascending: false }),
        supabase.from('meditation_sessions').select('*').order('completed_at', { ascending: false }),
        supabase.from('morning_routine_config').select('*').limit(1).maybeSingle(),
        supabase.from('daily_intentions').select('*').order('date', { ascending: false }),
        supabase.from('mood_logs').select('*').order('recorded_at', { ascending: false }),
        supabase.from('debts').select('*').order('created_at', { ascending: false }),
        supabase.from('debt_payments').select('*').order('created_at', { ascending: false }),
        supabase.from('budgets').select('*').order('created_at', { ascending: false }),
        supabase.from('ai_extractions').select('*').order('created_at', { ascending: false })
      ]);

      let userProfile = DEFAULT_PROFILE;
      if (profileRes.data) {
        userProfile = mapProfileFromSupabase(profileRes.data);
      } else {
        console.log('[LifeOS AI] Profile table empty on Supabase. Seeding defaults...');
        const seeded = mapProfileToSupabase(DEFAULT_PROFILE);
        await supabase.from('user_profiles').upsert(seeded);
      }

      let personas = personasRes.data || [];
      if (personas.length === 0) {
        console.log('[LifeOS AI] Personas table empty on Supabase. Seeding defaults...');
        await supabase.from('personas').upsert(DEFAULT_PERSONAS);
        personas = DEFAULT_PERSONAS;
      }

      currentDbState = {
        userProfile,
        personas,
        inbox: inboxRes.data || [],
        expenses: expensesRes.data || [],
        income: incomeRes.data || [],
        tasks: tasksRes.data || [],
        reminders: remindersRes.data || [],
        goals: goalsRes.data || [],
        habits: habitsRes.data || [],
        projects: projectsRes.data || [],
        notes: notesRes.data || [],
        ideas: ideasRes.data || [],
        memories: memoriesRes.data || [],
        salaries: salariesRes.data || [],
        creditCards: creditCardsRes.data || [],
        cardExpenses: cardExpensesRes.data || [],
        decisions: decisionsRes.data || [],
        energyLogs: energyLogsRes.data || [],
        briefings: briefingsRes.data || [],
        simulatorRuns: simulatorRunsRes.data || [],
        leakageAlerts: leakageAlertsRes.data || [],
        meditationSessions: meditationSessionsRes.data || [],
        morningRoutineConfig: morningRoutineConfigRes.data || DEFAULT_STATE.morningRoutineConfig,
        dailyIntentions: dailyIntentionsRes.data || [],
        moodLogs: moodLogsRes.data || [],
        debts: debtsRes.data || [],
        debtPayments: debtPaymentsRes.data || [],
        budgets: budgetsRes.data || [],
        aiExtractions: aiExtractionsRes.data || [],
        categories: DEFAULT_CATEGORIES,
        accounts: DEFAULT_ACCOUNTS,
        tags: DEFAULT_TAGS
      };

      ensureStateIntegrity(currentDbState);
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(currentDbState, null, 2), 'utf-8');
      } catch (_) {}
      console.log('[LifeOS AI] Database initialized from Supabase successfully.');
      return currentDbState;
    } catch (error: any) {
      console.error('[LifeOS AI] Error loading from Supabase, falling back to local JSON:', error?.message || error);
    }
  }

  console.log('[LifeOS AI] Loading database from local JSON file...');
  try {
    if (!fs.existsSync(DB_FILE)) {
      currentDbState = ensureStateIntegrity({ ...DEFAULT_STATE });
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_STATE, null, 2), 'utf-8');
    } else {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      currentDbState = ensureStateIntegrity(JSON.parse(data) as DatabaseState);
    }
  } catch (error: any) {
    console.error('Falha ao ler banco de dados JSON:', error?.message || error);
    currentDbState = ensureStateIntegrity({ ...DEFAULT_STATE });
  }
  return currentDbState;
}

export function ensureStateIntegrity(state: DatabaseState): DatabaseState {
  if (!state.categories || state.categories.length === 0) state.categories = DEFAULT_CATEGORIES;
  if (!state.accounts || state.accounts.length === 0) state.accounts = DEFAULT_ACCOUNTS;
  if (!state.tags || state.tags.length === 0) state.tags = DEFAULT_TAGS;
  if (!state.creditCards || state.creditCards.length === 0) state.creditCards = DEFAULT_CREDIT_CARDS;
  
  if (state.userProfile) {
    state.userProfile = {
      ...state.userProfile,
      geminiApiKey: process.env.GEMINI_API_KEY || state.userProfile.geminiApiKey || '',
      deepseekApiKey: process.env.DEEPSEEK_API_KEY || state.userProfile.deepseekApiKey || '',
      qwenApiKey: process.env.QWEN_API_KEY || state.userProfile.qwenApiKey || '',
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || state.userProfile.telegramBotToken || '',
      telegramChatId: process.env.TELEGRAM_CHAT_ID || state.userProfile.telegramChatId || ''
    };
  }
  return state;
}

export function readDatabase(): DatabaseState {
  if (currentDbState) return ensureStateIntegrity(currentDbState);
  try {
    if (!fs.existsSync(DB_FILE)) {
      return ensureStateIntegrity({ ...DEFAULT_STATE });
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return ensureStateIntegrity(JSON.parse(data) as DatabaseState);
  } catch (error) {
    return ensureStateIntegrity({ ...DEFAULT_STATE });
  }
}

export function writeDatabase(state: DatabaseState): void {
  currentDbState = state;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (error) {
    console.error('Falha ao escrever banco de dados JSON:', error);
  }

  syncAllToSupabase(state).catch(err => {
    console.error('[LifeOS AI] Background sync to Supabase failed:', err);
  });
}

// Helpers
export function addInboxItem(rawContentOrItem: string | InboxItem, type: string = 'unknown'): InboxItem {
  const db = readDatabase();
  let newItem: InboxItem;
  if (typeof rawContentOrItem === 'object') {
    newItem = rawContentOrItem;
  } else {
    newItem = {
      id: 'i_' + Date.now(),
      type,
      raw_content: rawContentOrItem,
      source: 'Telegram',
      created_at: new Date().toISOString(),
      processed: false
    };
  }
  db.inbox.unshift(newItem);
  writeDatabase(db);
  return newItem;
}

export function getActivePersona(): Persona {
  const db = readDatabase();
  const active = db.personas.find(p => p.ativa);
  return active || DEFAULT_PERSONAS[0];
}

export function updateActivePersona(id: string): Persona | null {
  const db = readDatabase();
  let selected: Persona | null = null;
  db.personas = db.personas.map(p => {
    if (p.id === id) {
      selected = { ...p, ativa: true };
      return selected;
    }
    return { ...p, ativa: false };
  });
  if (selected) {
    writeDatabase(db);
  }
  return selected;
}

export function getProfile(): UserProfile {
  const db = readDatabase();
  return db.userProfile;
}

export function updateProfile(profile: Partial<UserProfile>): UserProfile {
  const db = readDatabase();
  db.userProfile = { ...db.userProfile, ...profile };
  writeDatabase(db);
  return db.userProfile;
}
