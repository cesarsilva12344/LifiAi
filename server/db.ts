import fs from 'fs';
import path from 'path';
import { DatabaseState, Persona, UserProfile, InboxItem } from '../src/types';

const DB_FILE = path.join(process.cwd(), 'db.json');

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
Quando o usuário salvar notas ou ideias de aprendizado, faça conexões conceituais ricas, sugira novas fontes de estudo (como livros clássicos ou papers) e incentive o raciocínio profundo.
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
  nome: 'Cesaronesto',
  appName: 'LifeOS AI',
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
  contexto: 'Fundador técnico trabalhando em múltiplos projetos de software e focando em maximizar a alavanca de cada hora gasta no dia.'
};

const DEFAULT_STATE: DatabaseState = {
  inbox: [
    {
      id: 'i1',
      type: 'expense',
      raw_content: 'Gastei R$ 45,50 com almoço de negócios no restaurante Verde',
      source: 'Telegram',
      created_at: '2026-05-26T12:30:00Z',
      processed: true,
      extracted_id: 'exp1'
    },
    {
      id: 'i2',
      type: 'task',
      raw_content: 'importante: revisar contrato do designer para o MVP até amanhã',
      source: 'Telegram',
      created_at: '2026-05-26T14:15:00Z',
      processed: true,
      extracted_id: 't1'
    },
    {
      id: 'i3',
      type: 'note',
      raw_content: 'Ideia de feature: busca semântica em notas usando embeddings locais com Gemini API',
      source: 'Telegram',
      created_at: '2026-05-26T16:00:00Z',
      processed: true,
      extracted_id: 'n1'
    },
    {
        id: 'i4',
        type: 'income',
        raw_content: 'Recebi R$ 3500,00 de consultoria técnica do projeto Alpha',
        source: 'Telegram',
        created_at: '2026-05-25T10:00:00Z',
        processed: true,
        extracted_id: 'inc1'
    }
  ],
  expenses: [
    {
      id: 'exp1',
      valor: 45.50,
      categoria: 'Alimentação',
      descricao: 'Almoço de negócios no restaurante Verde',
      data: '2026-05-26'
    },
    {
      id: 'exp2',
      valor: 120.00,
      categoria: 'Assinaturas',
      descricao: 'Serviço de hospedagem Cloud Run e domínios',
      data: '2026-05-24'
    },
    {
      id: 'exp3',
      valor: 89.90,
      categoria: 'Transporte',
      descricao: 'Uber para reunião presencial com investidor',
      data: '2026-05-23'
    }
  ],
  income: [
    {
      id: 'inc1',
      valor: 3500.00,
      categoria: 'Consultoria',
      descricao: 'Consultoria técnica do projeto Alpha',
      data: '2026-05-25'
    },
    {
      id: 'inc2',
      valor: 1500.00,
      categoria: 'Mentoria',
      descricao: 'Aulas de arquitetura de software para sêniors',
      data: '2026-05-20'
    }
  ],
  tasks: [
    {
      id: 't1',
      titulo: 'Revisar contrato do designer para o MVP',
      status: 'pending',
      prioridade: 'high',
      prazo: '2026-05-27'
    },
    {
      id: 't2',
      titulo: 'Documentar endpoints da API de Webhook',
      status: 'completed',
      prioridade: 'medium',
      prazo: '2026-05-25'
    },
    {
      id: 't3',
      titulo: 'Subir código inicial para repositório e testar build',
      status: 'completed',
      prioridade: 'high',
      prazo: '2026-05-26'
    },
    {
      id: 't4',
      titulo: 'Ajustar cálculo de streak de hábitos no Dashboard',
      status: 'pending',
      prioridade: 'medium',
      prazo: '2026-05-28'
    }
  ],
  reminders: [
    {
      id: 'r1',
      titulo: 'Daily call com time de desenvolvimento do MVP',
      data_hora: '2026-05-27T10:00:00Z',
      status: 'active'
    },
    {
      id: 'r2',
      titulo: 'Reunião de alinhamento com investidor-anjo',
      data_hora: '2026-05-28T15:00:00Z',
      status: 'active'
    }
  ],
  goals: [
    {
      id: 'g1',
      titulo: 'Lançar beta fechado do LifeOS AI',
      meta: 100,
      progresso: 85,
      prazo: '2026-06-15'
    },
    {
      id: 'g2',
      titulo: 'Faturamento de Micro-SaaS',
      meta: 10000,
      progresso: 5000,
      prazo: '2026-08-31'
    }
  ],
  habits: [
    {
      id: 'h1',
      nome: 'Treino de Força (Academia)',
      frequencia: 'diaria',
      streak: 5,
      history: ['2026-05-22', '2026-05-23', '2026-05-24', '2026-05-25', '2026-05-26']
    },
    {
      id: 'h2',
      nome: 'Meditação / Foco profundo',
      frequencia: 'diaria',
      streak: 3,
      history: ['2026-05-24', '2026-05-25', '2026-05-26']
    },
    {
      id: 'h3',
      nome: 'Leitura de Papers Técnicos',
      frequencia: 'semanal',
      streak: 2,
      history: ['2026-05-18', '2026-05-25']
    }
  ],
  projects: [
    {
      id: 'p1',
      nome: 'LifeOS AI core',
      descricao: 'Sistema Operacional Pessoal integrando captura via Telegram e Dashboard Executivo.',
      status: 'active',
      progresso: 80
    },
    {
      id: 'p2',
      nome: 'Automator Pro',
      descricao: 'Micro-SaaS para automação rápida de faturamento e Notas Fiscais em lote.',
      status: 'planning',
      progresso: 10
    }
  ],
  notes: [
    {
      id: 'n1',
      conteudo: 'Feature: busca semântica em notas usando embeddings locais com Gemini API. A ideia é vetorizar notas em lote com o modelo gemini-embedding-2-preview e realizar busca por similaridade de cossenos no próprio servidor Node para performance instantânea e privacidade.',
      tags: ['SaaS', 'IA', 'Arquit_Software'],
      created_at: '2026-05-26T16:00:00Z'
    },
    {
      id: 'n2',
      conteudo: 'Estudo de Conversão: o funil ideal para micro-SaaS de produtividade consiste em: 1) Captura orgânica via Twitter/LinkedIn; 2) Ferramenta gratuita útil; 3) Up-sell para plano premium executivo focando em conveniência radical.',
      tags: ['Marketing', 'SaaS', 'Growth'],
      created_at: '2026-05-25T11:00:00Z'
    }
  ],
  ideas: [
    {
      id: 'id1',
      titulo: 'Bot de Telegram para OCR de recibos financeiros',
      conteudo: 'Extração automática de total, data e estabelecimento direto de tickets/imagens enviadas, integrado ao CFO.',
      score: 9,
      created_at: '2026-05-26T10:00:00Z'
    },
    {
      id: 'id2',
      titulo: 'Extensão de Chrome para Clippar links com IA',
      conteudo: 'Botão no Chrome que resume o link lido e envia diretamente para o inbox do LifeOS como uma Nota inteligivel.',
      score: 7,
      created_at: '2026-05-24T18:00:00Z'
    }
  ],
  memories: [
    {
      id: 'm1',
      conteudo: 'Decidi focar toda a interface de captura do LifeOS AI no Telegram porque a barreira de fricção é zero. Mandar áudio de 20s caminhando ou colar um link é muito mais rápido que abrir um app pesado do Notion.',
      origem: 'Telegram de Cesaronesto',
      created_at: '2026-05-26T09:00:00Z',
      embedding: []
    },
    {
      id: 'm2',
      conteudo: 'Configuração chave do banco postgres no Supabase: usar índices RLS fortes de segurança e habilitar pg_vector para habilitar inteligência de memórias a qualquer momento.',
      origem: 'Telegram de Cesaronesto',
      created_at: '2026-05-24T15:30:00Z',
      embedding: []
    }
  ],
  personas: DEFAULT_PERSONAS,
  userProfile: DEFAULT_PROFILE
};

let currentDbState: DatabaseState | null = null;

// Map camelCase to snake_case for Supabase
const mapProfileToSupabase = (p: UserProfile) => ({
  id: 1,
  nome: p.nome,
  app_name: p.appName,
  gemini_api_key: p.geminiApiKey || '',
  deepseek_api_key: p.deepseekApiKey || '',
  qwen_api_key: p.qwenApiKey || '',
  telegram_bot_token: p.telegramBotToken || '',
  telegram_chat_id: p.telegramChatId || '',
  interesses: p.interesses || [],
  objetivos: p.objetivos || [],
  preferencias: p.preferencias || [],
  contexto: p.contexto || ''
});

// Map snake_case to camelCase from Supabase
const mapProfileFromSupabase = (p: any): UserProfile => ({
  nome: p.nome || 'Usuário',
  appName: p.app_name || 'LifeOS AI',
  geminiApiKey: p.gemini_api_key || '',
  deepseekApiKey: p.deepseek_api_key || '',
  qwenApiKey: p.qwen_api_key || '',
  telegramBotToken: p.telegram_bot_token || '',
  telegramChatId: p.telegram_chat_id || '',
  interesses: Array.isArray(p.interesses) ? p.interesses : [],
  objetivos: Array.isArray(p.objetivos) ? p.objetivos : [],
  preferencias: Array.isArray(p.preferencias) ? p.preferencias : [],
  contexto: p.contexto || ''
});

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
      supabase.from('user_profile').upsert(mapProfileToSupabase(state.userProfile)),
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
      syncTable(supabase, 'memories', state.memories)
    ]);
  } catch (err: any) {
    console.error('[Supabase Sync] Failed to sync database state:', err.message);
  }
}

export async function initializeDatabase(): Promise<DatabaseState> {
  if (currentDbState) return currentDbState;

  const { isSupabaseConfigured, supabase } = await import('../services/database/client');

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
        memoriesRes
      ] = await Promise.all([
        supabase.from('user_profile').select('*').single(),
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
      ]);

      if (profileRes.error && profileRes.error.code !== 'PGRST116') {
        throw new Error(`Profile load error: ${profileRes.error.message}`);
      }

      let userProfile = DEFAULT_PROFILE;
      if (profileRes.data) {
        userProfile = mapProfileFromSupabase(profileRes.data);
      } else {
        console.log('[LifeOS AI] Profile table empty on Supabase. Seeding defaults...');
        const seeded = mapProfileToSupabase(DEFAULT_PROFILE);
        await supabase.from('user_profile').upsert(seeded);
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
        memories: memoriesRes.data || []
      };

      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(currentDbState, null, 2), 'utf-8');
      } catch (_) {}
      console.log('[LifeOS AI] Database initialized from Supabase successfully.');
      return currentDbState;
    } catch (error: any) {
      console.error('[LifeOS AI] Error loading from Supabase, falling back to local JSON:', error.message);
    }
  }

  console.log('[LifeOS AI] Loading database from local JSON file...');
  try {
    if (!fs.existsSync(DB_FILE)) {
      currentDbState = DEFAULT_STATE;
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_STATE, null, 2), 'utf-8');
    } else {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      currentDbState = JSON.parse(data) as DatabaseState;
    }
  } catch (error) {
    console.error('Falha ao ler banco de dados JSON:', error);
    currentDbState = DEFAULT_STATE;
  }
  return currentDbState;
}

export function readDatabase(): DatabaseState {
  if (currentDbState) return currentDbState;
  try {
    if (!fs.existsSync(DB_FILE)) {
      return DEFAULT_STATE;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data) as DatabaseState;
  } catch (error) {
    return DEFAULT_STATE;
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
