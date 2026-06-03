var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// services/database/client.ts
var client_exports = {};
__export(client_exports, {
  isSupabaseConfigured: () => isSupabaseConfigured,
  supabase: () => supabase
});
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
var supabaseUrl, supabaseServiceKey, isSupabaseConfigured, supabase;
var init_client = __esm({
  "services/database/client.ts"() {
    dotenv.config();
    supabaseUrl = process.env.SUPABASE_URL || "";
    supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || "";
    isSupabaseConfigured = !!(supabaseUrl && supabaseServiceKey);
    supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false
      }
    }) : null;
  }
});

// server/db.ts
import fs from "fs";
import path from "path";
async function syncTable(supabase2, tableName, items) {
  try {
    const { data, error } = await supabase2.from(tableName).select("id");
    if (error) throw error;
    const remoteIds = (data || []).map((d) => d.id);
    const localIds = items.map((item) => item.id);
    const deletedIds = remoteIds.filter((id) => !localIds.includes(id));
    if (deletedIds.length > 0) {
      await supabase2.from(tableName).delete().in("id", deletedIds);
    }
    if (items.length > 0) {
      const { error: upsertErr } = await supabase2.from(tableName).upsert(items);
      if (upsertErr) throw upsertErr;
    }
  } catch (err) {
    console.error(`[Supabase Sync] Error syncing table ${tableName}:`, err.message);
  }
}
async function syncAllToSupabase(state) {
  const { isSupabaseConfigured: isSupabaseConfigured2, supabase: supabase2 } = await Promise.resolve().then(() => (init_client(), client_exports));
  if (!isSupabaseConfigured2 || !supabase2) return;
  try {
    await Promise.all([
      supabase2.from("user_profiles").upsert(mapProfileToSupabase(state.userProfile)),
      syncTable(supabase2, "personas", state.personas),
      syncTable(supabase2, "inbox", state.inbox),
      syncTable(supabase2, "expenses", state.expenses),
      syncTable(supabase2, "income", state.income),
      syncTable(supabase2, "tasks", state.tasks),
      syncTable(supabase2, "reminders", state.reminders),
      syncTable(supabase2, "goals", state.goals),
      syncTable(supabase2, "habits", state.habits),
      syncTable(supabase2, "projects", state.projects),
      syncTable(supabase2, "notes", state.notes),
      syncTable(supabase2, "ideas", state.ideas),
      syncTable(supabase2, "memories", state.memories),
      syncTable(supabase2, "salaries", state.salaries || []),
      syncTable(supabase2, "credit_cards", state.creditCards || []),
      syncTable(supabase2, "card_transactions", state.cardExpenses || []),
      syncTable(supabase2, "decisions", state.decisions || []),
      syncTable(supabase2, "energy_logs", state.energyLogs || []),
      syncTable(supabase2, "briefings", state.briefings || []),
      syncTable(supabase2, "simulator_runs", state.simulatorRuns || []),
      syncTable(supabase2, "leakage_alerts", state.leakageAlerts || []),
      syncTable(supabase2, "meditation_sessions", state.meditationSessions || []),
      syncTable(supabase2, "daily_intentions", state.dailyIntentions || []),
      syncTable(supabase2, "mood_logs", state.moodLogs || []),
      syncTable(supabase2, "debts", state.debts || []),
      syncTable(supabase2, "budgets", state.budgets || []),
      syncTable(supabase2, "ai_extractions", state.aiExtractions || [])
    ]);
  } catch (err) {
    console.error("[Supabase Sync] Failed to sync database state:", err.message);
  }
}
async function initializeDatabase() {
  if (currentDbState) return currentDbState;
  let isSupabaseConfigured2 = false;
  let supabase2 = null;
  try {
    const clientModule = await Promise.resolve().then(() => (init_client(), client_exports));
    isSupabaseConfigured2 = clientModule.isSupabaseConfigured;
    supabase2 = clientModule.supabase;
  } catch (err) {
    console.error("[LifeOS AI] Failed to import database client:", err?.message || err);
  }
  if (isSupabaseConfigured2 && supabase2) {
    console.log("[LifeOS AI] Supabase detected. Initializing data from remote database...");
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
        supabase2.from("user_profiles").select("*").limit(1).maybeSingle(),
        supabase2.from("personas").select("*"),
        supabase2.from("inbox").select("*").order("created_at", { ascending: false }),
        supabase2.from("expenses").select("*").order("data", { ascending: false }),
        supabase2.from("income").select("*").order("data", { ascending: false }),
        supabase2.from("tasks").select("*").order("created_at", { ascending: false }),
        supabase2.from("reminders").select("*").order("data_hora", { ascending: false }),
        supabase2.from("goals").select("*").order("created_at", { ascending: false }),
        supabase2.from("habits").select("*").order("created_at", { ascending: false }),
        supabase2.from("projects").select("*").order("created_at", { ascending: false }),
        supabase2.from("notes").select("*").order("created_at", { ascending: false }),
        supabase2.from("ideas").select("*").order("created_at", { ascending: false }),
        supabase2.from("memories").select("*").order("created_at", { ascending: false }),
        supabase2.from("salaries").select("*").order("data_prevista", { ascending: false }),
        supabase2.from("credit_cards").select("*").order("nome", { ascending: true }),
        supabase2.from("card_transactions").select("*").order("created_at", { ascending: false }),
        supabase2.from("decisions").select("*").order("created_at", { ascending: false }),
        supabase2.from("energy_logs").select("*").order("created_at", { ascending: false }),
        supabase2.from("briefings").select("*").order("date", { ascending: false }),
        supabase2.from("simulator_runs").select("*").order("created_at", { ascending: false }),
        supabase2.from("leakage_alerts").select("*").order("detected_at", { ascending: false }),
        supabase2.from("meditation_sessions").select("*").order("completed_at", { ascending: false }),
        supabase2.from("morning_routine_config").select("*").limit(1).maybeSingle(),
        supabase2.from("daily_intentions").select("*").order("date", { ascending: false }),
        supabase2.from("mood_logs").select("*").order("recorded_at", { ascending: false }),
        supabase2.from("debts").select("*").order("created_at", { ascending: false }),
        supabase2.from("debt_payments").select("*").order("created_at", { ascending: false }),
        supabase2.from("budgets").select("*").order("created_at", { ascending: false }),
        supabase2.from("ai_extractions").select("*").order("created_at", { ascending: false })
      ]);
      let userProfile = DEFAULT_PROFILE;
      if (profileRes.data) {
        userProfile = mapProfileFromSupabase(profileRes.data);
      } else {
        console.log("[LifeOS AI] Profile table empty on Supabase. Seeding defaults...");
        const seeded = mapProfileToSupabase(DEFAULT_PROFILE);
        await supabase2.from("user_profiles").upsert(seeded);
      }
      let personas = personasRes.data || [];
      if (personas.length === 0) {
        console.log("[LifeOS AI] Personas table empty on Supabase. Seeding defaults...");
        await supabase2.from("personas").upsert(DEFAULT_PERSONAS);
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
        fs.writeFileSync(DB_FILE, JSON.stringify(currentDbState, null, 2), "utf-8");
      } catch (_) {
      }
      console.log("[LifeOS AI] Database initialized from Supabase successfully.");
      return currentDbState;
    } catch (error) {
      console.error("[LifeOS AI] Error loading from Supabase, falling back to local JSON:", error?.message || error);
    }
  }
  console.log("[LifeOS AI] Loading database from local JSON file...");
  try {
    if (!fs.existsSync(DB_FILE)) {
      currentDbState = ensureStateIntegrity({ ...DEFAULT_STATE });
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_STATE, null, 2), "utf-8");
    } else {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      currentDbState = ensureStateIntegrity(JSON.parse(data));
    }
  } catch (error) {
    console.error("Falha ao ler banco de dados JSON:", error?.message || error);
    currentDbState = ensureStateIntegrity({ ...DEFAULT_STATE });
  }
  return currentDbState;
}
function ensureStateIntegrity(state) {
  if (!state.categories || state.categories.length === 0) state.categories = DEFAULT_CATEGORIES;
  if (!state.accounts || state.accounts.length === 0) state.accounts = DEFAULT_ACCOUNTS;
  if (!state.tags || state.tags.length === 0) state.tags = DEFAULT_TAGS;
  if (!state.creditCards || state.creditCards.length === 0) state.creditCards = DEFAULT_CREDIT_CARDS;
  if (state.userProfile) {
    const isValidChatId = (id) => id && /^-?\d+$/.test(id.trim());
    const envChatId = process.env.TELEGRAM_CHAT_ID;
    const dbChatId = state.userProfile.telegramChatId;
    state.userProfile = {
      ...state.userProfile,
      geminiApiKey: process.env.GEMINI_API_KEY || state.userProfile.geminiApiKey || "",
      deepseekApiKey: process.env.DEEPSEEK_API_KEY || state.userProfile.deepseekApiKey || "",
      qwenApiKey: process.env.QWEN_API_KEY || state.userProfile.qwenApiKey || "",
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || state.userProfile.telegramBotToken || "",
      telegramChatId: (isValidChatId(envChatId) ? envChatId : "") || (isValidChatId(dbChatId) ? dbChatId : "") || ""
    };
  }
  return state;
}
function readDatabase() {
  if (currentDbState) return ensureStateIntegrity(currentDbState);
  try {
    if (!fs.existsSync(DB_FILE)) {
      return ensureStateIntegrity({ ...DEFAULT_STATE });
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return ensureStateIntegrity(JSON.parse(data));
  } catch (error) {
    return ensureStateIntegrity({ ...DEFAULT_STATE });
  }
}
function writeDatabase(state) {
  currentDbState = state;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (error) {
    console.error("Falha ao escrever banco de dados JSON:", error);
  }
  const syncPromise = syncAllToSupabase(state).catch((err) => {
    console.error("[LifeOS AI] Background sync to Supabase failed:", err);
  });
  if (typeof global !== "undefined") {
    const g = global;
    g.pendingDbSyncs = g.pendingDbSyncs || [];
    g.pendingDbSyncs.push(syncPromise);
  }
}
function addInboxItem(rawContentOrItem, type = "unknown") {
  const db = readDatabase();
  let newItem;
  if (typeof rawContentOrItem === "object") {
    newItem = rawContentOrItem;
  } else {
    newItem = {
      id: "i_" + Date.now(),
      type,
      raw_content: rawContentOrItem,
      source: "Telegram",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      processed: false
    };
  }
  db.inbox.unshift(newItem);
  writeDatabase(db);
  return newItem;
}
function getActivePersona() {
  const db = readDatabase();
  const active = db.personas.find((p) => p.ativa);
  return active || DEFAULT_PERSONAS[0];
}
function updateActivePersona(id) {
  const db = readDatabase();
  let selected = null;
  db.personas = db.personas.map((p) => {
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
function getProfile() {
  const db = readDatabase();
  return db.userProfile;
}
function updateProfile(profile) {
  const db = readDatabase();
  db.userProfile = { ...db.userProfile, ...profile };
  writeDatabase(db);
  return db.userProfile;
}
var DB_FILE, DEFAULT_PERSONAS, DEFAULT_PROFILE, DEFAULT_CATEGORIES, DEFAULT_ACCOUNTS, DEFAULT_TAGS, DEFAULT_CREDIT_CARDS, DEFAULT_STATE, currentDbState, mapProfileToSupabase, mapProfileFromSupabase;
var init_db = __esm({
  "server/db.ts"() {
    DB_FILE = process.env.VERCEL ? path.join("/tmp", "db.json") : path.join(process.cwd(), "db.json");
    DEFAULT_PERSONAS = [
      {
        id: "cfo",
        nome: "CFO",
        descricao: "Foco financeiro total. Analisa custos, ROI, margens e corte de despesas sup\xE9rfluas.",
        prompt_base: `Voc\xEA \xE9 o CFO (Chief Financial Officer) pessoal do usu\xE1rio. Seu \xFAnico foco \xE9 sa\xFAde financeira, or\xE7amento, corte de despesas e gera\xE7\xE3o de receita.
Sempre analise as finan\xE7as sob a \xF3tica de efici\xEAncia matem\xE1tica, retorno sobre investimento (ROI) e investimentos de longo prazo.
Ao receber despesas, seja anal\xEDtico e, se necess\xE1rio, sutilmente rigoroso sobre desperd\xEDcios. Ao receber receitas, comemore focando em aloca\xE7\xE3o de ativos.
Responda de forma direta, executiva e baseada em dados. Defenda margens e frugalidade inteligente.`,
        ativa: true,
        icon: "Briefcase"
      },
      {
        id: "founder",
        nome: "Founder",
        descricao: "Foco em crescimento, valida\xE7\xE3o acelerada de ideias, MVP e capta\xE7\xE3o.",
        prompt_base: `Voc\xEA \xE9 um co-fundador experiente e agressivo em rela\xE7\xE3o ao mercado. Seu foco \xE9 crescimento, velocidade de execu\xE7\xE3o, MVPs (Minimum Viable Products), atra\xE7\xE3o de usu\xE1rios e valida\xE7\xE3o \xE1gil de ideias de neg\xF3cios.
Ajude a estruturar pensamentos em formato de hip\xF3teses test\xE1veis. Elimine o excesso de planejamento ("par\xE1lise por an\xE1lise") e empurre para a a\xE7\xE3o imediata.
Responda de forma energ\xE9tica, focada em m\xE9tricas de tra\xE7\xE3o, crescimento r\xE1pido e pragmatismo empreendedor.`,
        ativa: false,
        icon: "Rocket"
      },
      {
        id: "mentor",
        nome: "Mentor",
        descricao: "Foco em aprendizado cont\xEDnuo, leitura, desenvolvimento t\xE9cnico e intelectual.",
        prompt_base: `Voc\xEA \xE9 um Mentor socr\xE1tico e profundamente s\xE1bio. Seu foco \xE9 desenvolvimento pessoal, aprendizado t\xE9cnico profundo, reten\xE7\xE3o de conhecimento e desenvolvimento de carreira s\xF3lida.
Quando o usu\xE1rio salvar notas ou ideias de aprendizado, fa\xE7a conex\xF5es conceituais ricas, sugira novas fontes de estudo (como livros cl\xE1ssicos ou papers) e incentivo o racioc\xEDnio profundo.
Fale com tom de voz emp\xE1tico, inspirador e estruturado.`,
        ativa: false,
        icon: "GraduationCap"
      },
      {
        id: "executor",
        nome: "Executor",
        descricao: "Foco total em a\xE7\xE3o, velocidade extrema, listas de tarefas t\xE1ticas e pragmatismo.",
        prompt_base: `Voc\xEA \xE9 a m\xE1quina de execu\xE7\xE3o pessoal do usu\xE1rio. Sem conversinhas, sem firulas. Seu foco \xE9 riscar tarefas da lista de uma forma implac\xE1vel e de alt\xEDssima velocidade.
Divida qualquer plano complexo em 3 a\xE7\xF5es que podem ser feitas nos pr\xF3ximos 15 minutos. Cobrar efici\xEAncia, disciplina e clareza.
Respostas ultra-curtas, focadas em pr\xF3ximos passos acion\xE1veis, bullet points, e cobran\xE7a disciplinada.`,
        ativa: false,
        icon: "CheckSquare"
      },
      {
        id: "conselheiro",
        nome: "Conselheiro",
        descricao: "Foco em longo prazo, sabedoria de vida, equil\xEDbrio mental e intelig\xEAncia emocional.",
        prompt_base: `Voc\xEA \xE9 um conselheiro s\xEAnior para decis\xF5es estrat\xE9gicas de vida. Seu foco \xE9 o longo prazo (5 a 10 anos), sabedoria existencial, sa\xFAde integrativa, paz de esp\xEDrito e intelig\xEAncia emocional.
Evite pressas artificiais. Ajude o usu\xE1rio a ver o panorama geral ("macro view") e se as decis\xF5es est\xE3o alinhadas com seus valores \xE9ticos e pessoais mais profundos.
Tom calmo, assertivo, ponderado e esclarecedor.`,
        ativa: false,
        icon: "Compass"
      },
      {
        id: "analista",
        nome: "Analista de Neg\xF3cios",
        descricao: "Foco em mapeamento de oportunidades, intelig\xEAncia competitiva e automa\xE7\xE3o.",
        prompt_base: `Voc\xEA \xE9 um brilhante Analista de Neg\xF3cios especializado em automa\xE7\xE3o, intelig\xEAncia competitiva e gaps de mercado.
Sua fun\xE7\xE3o \xE9 analisar ideias brutas e encontrar mercados adjacentes, modelos de monetiza\xE7\xE3o eficientes e fluxos autom\xE1ticos de processos que possam gerar receita eficiente ou otimizar custos.
Responda com an\xE1lises de mercado frias, an\xE1lise de concorr\xEAncia conceitual, e sugest\xF5es de ferramentas sem c\xF3digo (no-code) ou APIs \xFAteis.`,
        ativa: false,
        icon: "TrendingUp"
      },
      {
        id: "cos",
        nome: "Chief of Staff",
        descricao: "Foco em prioriza\xE7\xE3o executiva, alinhamento de projetos e gerenciamento de energia.",
        prompt_base: `Voc\xEA \xE9 o Chief of Staff (Chefe de Gabinete) do usu\xE1rio. Seu foco \xE9 garantir alinhamento t\xE1tico-estrat\xE9gico, gerenciar o tempo e energia dele, e aplicar filtros severos contra distra\xE7\xF5es.
Ajude o usu\xE1rio a dizer "n\xE3o" para focar nas 3 maiores alavancas do dia e da semana. Certifique-se de que os h\xE1bitos fundamentais est\xE3o sendo seguidos.
Tom elegante, calmo, altamente organizado, confi\xE1vel e coordenativo.`,
        ativa: false,
        icon: "LayoutGrid"
      }
    ];
    DEFAULT_PROFILE = {
      nome: "C\xE9sar",
      appName: "Mobilis Executive",
      geminiApiKey: process.env.GEMINI_API_KEY || "",
      deepseekApiKey: process.env.DEEPSEEK_API_KEY || "",
      qwenApiKey: process.env.QWEN_API_KEY || "",
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
      telegramChatId: process.env.TELEGRAM_CHAT_ID || "",
      interesses: [
        "Intelig\xEAncia Artificial & LLMs",
        "Desenvolvimento SaaS fullstack",
        "Finan\xE7as Pessoais & Aloca\xE7\xE3o Inteligente",
        "Automa\xE7\xF5es e Fluxos No-code",
        "Biohacking & Produtividade"
      ],
      objetivos: [
        "Lan\xE7ar o LifeOS AI no ProductHunt",
        "Atingir faturamento recorrente USD 10k/m\xEAs com micro-SaaS",
        "Manter consist\xEAncia semanal na academia",
        "Construir um segundo c\xE9rebro inteligente de alta fidelidade"
      ],
      preferencias: [
        "Tom de voz profissional, executivo e conciso",
        "An\xE1lises baseadas em ROI e efici\xEAncia de tempo",
        "Evitar clich\xEAs de autoajuda ou introdu\xE7\xF5es demoradas",
        "Respostas estruturadas em Markdown"
      ],
      contexto: "Fundador t\xE9cnico trabalhando em m\xFAltiplos projetos de software e focando em maximizar a alavanca de cada hora gasta no dia.",
      lifeScore: 82.5
    };
    DEFAULT_CATEGORIES = [
      { id: "cat_1", nome: "Alimenta\xE7\xE3o", tipo: "despesa", cor: "#ef4444" },
      { id: "cat_2", nome: "Transporte", tipo: "despesa", cor: "#f97316" },
      { id: "cat_3", nome: "Moradia", tipo: "despesa", cor: "#3b82f6" },
      { id: "cat_4", nome: "Sa\xFAde", tipo: "despesa", cor: "#10b981" },
      { id: "cat_5", nome: "Lazer", tipo: "despesa", cor: "#a855f7" },
      { id: "cat_6", nome: "Assinaturas", tipo: "despesa", cor: "#ec4899" },
      { id: "cat_7", nome: "Sal\xE1rio", tipo: "receita", cor: "#10b981" },
      { id: "cat_8", nome: "Consultoria", tipo: "receita", cor: "#6366f1" },
      { id: "cat_9", nome: "Freelance", tipo: "receita", cor: "#14b8a6" },
      { id: "cat_10", nome: "Investimentos", tipo: "receita", cor: "#eab308" }
    ];
    DEFAULT_ACCOUNTS = [
      { id: "acc_1", nome: "Carteira", tipo: "carteira", saldo_inicial: 0, saldo_atual: 0, cor: "#f59e0b" },
      { id: "acc_2", nome: "Santander C.C.", tipo: "corrente", saldo_inicial: 0, saldo_atual: 0, cor: "#ef4444" },
      { id: "acc_3", nome: "NuConta", tipo: "corrente", saldo_inicial: 0, saldo_atual: 0, cor: "#8b5cf6" }
    ];
    DEFAULT_TAGS = [
      { id: "tag_1", nome: "Essencial", cor: "#64748b" },
      { id: "tag_2", nome: "Lazer", cor: "#ec4899" },
      { id: "tag_3", nome: "Trabalho", cor: "#3b82f6" },
      { id: "tag_4", nome: "Recorrente", cor: "#10b981" }
    ];
    DEFAULT_CREDIT_CARDS = [
      { id: "card_nubank", nome: "Nubank Mastercard", limite: 5e3, dia_fechamento: 2, dia_vencimento: 10, cor: "#820ad1" },
      { id: "card_picpay", nome: "PicPay Visa", limite: 4e3, dia_fechamento: 14, dia_vencimento: 20, cor: "#11c76f" },
      { id: "card_itau", nome: "Ita\xFA Uniclass", limite: 6e3, dia_fechamento: 2, dia_vencimento: 9, cor: "#ec7000" },
      { id: "card_inter", nome: "Inter Gold", limite: 4e3, dia_fechamento: 9, dia_vencimento: 15, cor: "#f97316" },
      { id: "card_santander", nome: "Santander SX", limite: 3e3, dia_fechamento: 9, dia_vencimento: 13, cor: "#ef4444" },
      { id: "card_mercadopago", nome: "Mercado Pago", limite: 3e3, dia_fechamento: 5, dia_vencimento: 10, cor: "#00aae4" },
      { id: "card_nex", nome: "Nex Infinite", limite: 5e3, dia_fechamento: 5, dia_vencimento: 10, cor: "#3b82f6" }
    ];
    DEFAULT_STATE = {
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
        id: "mrc_1",
        wake_up_time: "07:00:00",
        meditation_enabled: true,
        meditation_duration: 600,
        briefing_enabled: true,
        gratitude_prompt: true,
        intention_setting: true,
        timezone: "America/Sao_Paulo"
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
    currentDbState = null;
    mapProfileToSupabase = (p) => ({
      id: "00000000-0000-0000-0000-000000000000",
      // default auth uuid placeholder
      nome: p.nome,
      email: "cesar@lifeos.ai",
      telefone: p.telegramChatId || "",
      status: "active",
      life_score: p.lifeScore || 0,
      config: {
        appName: p.appName,
        gemini_api_key: p.geminiApiKey || "",
        deepseek_api_key: p.deepseekApiKey || "",
        qwen_api_key: p.qwenApiKey || "",
        telegram_bot_token: p.telegramBotToken || "",
        telegram_chat_id: p.telegramChatId || "",
        interesses: p.interesses || [],
        objetivos: p.objetivos || [],
        preferencias: p.preferencias || [],
        contexto: p.contexto || ""
      }
    });
    mapProfileFromSupabase = (p) => {
      const cfg = p.config || {};
      return {
        nome: p.nome || "Usu\xE1rio",
        appName: cfg.appName || "Mobilis Executive",
        geminiApiKey: cfg.gemini_api_key || "",
        deepseekApiKey: cfg.deepseek_api_key || "",
        qwenApiKey: cfg.qwen_api_key || "",
        telegramBotToken: cfg.telegram_bot_token || "",
        telegramChatId: cfg.telegram_chat_id || p.telefone || "",
        interesses: Array.isArray(cfg.interesses) ? cfg.interesses : [],
        objetivos: Array.isArray(cfg.objetivos) ? cfg.objetivos : [],
        preferencias: Array.isArray(cfg.preferencias) ? cfg.preferencias : [],
        contexto: cfg.contexto || "",
        lifeScore: p.life_score || 0
      };
    };
  }
});

// services/ai/provider.ts
function getDeepSeekKey() {
  try {
    const profile = getProfile();
    const profileKey = profile?.deepseekApiKey;
    if (profileKey && profileKey.trim().length > 10) return profileKey.trim();
  } catch (_) {
  }
  const envKey = process.env.DEEPSEEK_API_KEY;
  if (envKey && envKey.trim().length > 10) return envKey.trim();
  return null;
}
function getQwenKey() {
  try {
    const profile = getProfile();
    const profileKey = profile?.qwenApiKey;
    if (profileKey && profileKey.trim().length > 10) return profileKey.trim();
  } catch (_) {
  }
  const envKey = process.env.QWEN_API_KEY;
  if (envKey && envKey.trim().length > 10) return envKey.trim();
  return null;
}
function getQwenBaseUrl() {
  const envUrl = process.env.QWEN_BASE_URL;
  if (envUrl && envUrl.trim().length > 5) return envUrl.trim();
  return "https://dashscope.aliyuncs.com/compatible-mode/v1";
}
function getQwenModel() {
  const envModel = process.env.QWEN_MODEL;
  if (envModel && envModel.trim().length > 1) return envModel.trim();
  return "qwen-plus";
}
async function openAIChat(apiKey, baseUrl, model, systemPrompt, userMessage, opts = {}) {
  const body = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ],
    temperature: opts.temperature ?? 0.4,
    max_tokens: opts.maxTokens ?? 2048
  };
  if (opts.jsonMode) {
    body.response_format = { type: "json_object" };
  }
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI API error ${response.status}: ${errText}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}
async function deepseekChat(apiKey, systemPrompt, userMessage, opts = {}) {
  return openAIChat(apiKey, DEEPSEEK_BASE_URL, DEEPSEEK_CHAT_MODEL, systemPrompt, userMessage, opts);
}
async function deepseekEmbed(apiKey, text) {
  try {
    const response = await fetch(`${DEEPSEEK_BASE_URL}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        input: text.slice(0, 8e3)
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.data?.[0]?.embedding ?? null;
  } catch (_) {
    return null;
  }
}
async function qwenChat(apiKey, baseUrl, model, systemPrompt, userMessage, opts = {}) {
  return openAIChat(apiKey, baseUrl, model, systemPrompt, userMessage, opts);
}
async function qwenEmbed(apiKey, baseUrl, text) {
  try {
    const isDashScope = baseUrl.includes("dashscope.aliyuncs.com");
    const model = isDashScope ? "text-embedding-v2" : "qwen-plus";
    const response = await fetch(`${baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        input: text.slice(0, 8e3)
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.data?.[0]?.embedding ?? null;
  } catch (_) {
    return null;
  }
}
function getProvider() {
  const provider = {
    isAvailable() {
      return !!(getQwenKey() || getDeepSeekKey());
    },
    async chat(systemPrompt, userMessage, opts) {
      const qwenKey = getQwenKey();
      if (qwenKey) {
        try {
          return await qwenChat(qwenKey, getQwenBaseUrl(), getQwenModel(), systemPrompt, userMessage, opts);
        } catch (e) {
          console.warn("[AI Provider] Qwen chat failed, falling back to DeepSeek:", e);
        }
      }
      const deepseekKey = getDeepSeekKey();
      if (deepseekKey) {
        return deepseekChat(deepseekKey, systemPrompt, userMessage, opts);
      }
      throw new Error("AI_KEYS_MISSING");
    },
    async chatJSON(systemPrompt, userMessage) {
      const qwenKey = getQwenKey();
      if (qwenKey) {
        try {
          const raw = await qwenChat(qwenKey, getQwenBaseUrl(), getQwenModel(), systemPrompt, userMessage, { jsonMode: true });
          const clean = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
          return JSON.parse(clean);
        } catch (e) {
          console.warn("[AI Provider] Qwen JSON chat failed, falling back to DeepSeek:", e);
        }
      }
      const deepseekKey = getDeepSeekKey();
      if (deepseekKey) {
        const raw = await deepseekChat(deepseekKey, systemPrompt, userMessage, { jsonMode: true });
        const clean = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
        return JSON.parse(clean);
      }
      throw new Error("AI_KEYS_MISSING");
    },
    async embed(text) {
      const qwenKey = getQwenKey();
      if (qwenKey) {
        const emb = await qwenEmbed(qwenKey, getQwenBaseUrl(), text);
        if (emb) return emb;
      }
      const deepseekKey = getDeepSeekKey();
      if (deepseekKey) {
        return deepseekEmbed(deepseekKey, text);
      }
      return null;
    }
  };
  return provider;
}
var DEEPSEEK_BASE_URL, DEEPSEEK_CHAT_MODEL;
var init_provider = __esm({
  "services/ai/provider.ts"() {
    init_db();
    DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";
    DEEPSEEK_CHAT_MODEL = "deepseek-chat";
  }
});

// services/ai/memory.ts
async function embed(text) {
  try {
    const provider = getProvider();
    return await provider.embed(text.slice(0, 8e3));
  } catch (_) {
    return null;
  }
}
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
function keywordScore(text, query) {
  const textWords = text.toLowerCase().split(/\s+/);
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  if (queryWords.length === 0) return 0;
  let matches = 0;
  for (const qw of queryWords) {
    if (textWords.some((tw) => tw.includes(qw) || qw.includes(tw))) matches++;
  }
  return matches / queryWords.length;
}
async function semanticSearch(query) {
  const db = readDatabase();
  const results = [];
  const queryEmbed = await embed(query);
  const targets = [
    ...db.notes.map((n) => ({ item: n, text: `${n.conteudo} ${n.tags?.join(" ") ?? ""}`, type: "note" })),
    ...db.ideas.map((i) => ({ item: i, text: `${i.titulo} ${i.conteudo}`, type: "idea" })),
    ...db.memories.map((m) => ({ item: m, text: m.conteudo, type: "memory", embed: m.embedding }))
  ];
  for (const target of targets) {
    let score = 0;
    if (queryEmbed && target.embed && target.embed.length > 0) {
      score = cosineSimilarity(queryEmbed, target.embed);
    } else if (queryEmbed && !target.embed) {
      const itemEmbed = await embed(target.text);
      if (itemEmbed) {
        if (target.type === "memory") {
          const idx = db.memories.findIndex((m) => m.id === target.item.id);
          if (idx !== -1) {
            db.memories[idx].embedding = itemEmbed;
            writeDatabase(db);
          }
        }
        score = cosineSimilarity(queryEmbed, itemEmbed);
      } else {
        score = keywordScore(target.text, query);
      }
    } else {
      score = keywordScore(target.text, query);
    }
    if (score > 0.05) {
      results.push({ item: target.item, type: target.type, score });
    }
  }
  return results.sort((a, b) => b.score - a.score);
}
var init_memory = __esm({
  "services/ai/memory.ts"() {
    init_db();
    init_provider();
  }
});

// services/engine/action.ts
var action_exports = {};
__export(action_exports, {
  checkHabit: () => checkHabit,
  completeTask: () => completeTask,
  createAiExtraction: () => createAiExtraction,
  createBriefing: () => createBriefing,
  createBudget: () => createBudget,
  createDailyIntention: () => createDailyIntention,
  createDebt: () => createDebt,
  createDebtPayment: () => createDebtPayment,
  createDecision: () => createDecision,
  createEnergyLog: () => createEnergyLog,
  createExpense: () => createExpense,
  createGoal: () => createGoal,
  createHabit: () => createHabit,
  createIdea: () => createIdea,
  createIncome: () => createIncome,
  createLeakageAlert: () => createLeakageAlert,
  createMeditationSession: () => createMeditationSession,
  createMemory: () => createMemory,
  createMoodLog: () => createMoodLog,
  createNote: () => createNote,
  createProject: () => createProject,
  createReminder: () => createReminder,
  createSimulatorRun: () => createSimulatorRun,
  createTask: () => createTask,
  deleteEntity: () => deleteEntity,
  executeFromIntent: () => executeFromIntent,
  updateAiExtractionStatus: () => updateAiExtractionStatus,
  updateDecision: () => updateDecision,
  updateGoalProgress: () => updateGoalProgress,
  updateProject: () => updateProject,
  updateTask: () => updateTask
});
function addToInbox(type, raw_content, source, extracted_id) {
  const item = {
    id: uid("inbox"),
    type,
    raw_content,
    source,
    created_at: now(),
    processed: true,
    extracted_id
  };
  addInboxItem(item);
  return item.id;
}
async function createExpense(data, source = "dashboard") {
  try {
    const db = readDatabase();
    const entity = {
      id: uid("exp"),
      valor: Number(data.valor),
      categoria: data.categoria || "Geral",
      categoria_id: data.categoria_id,
      conta_id: data.conta_id,
      cartao_id: data.cartao_id,
      descricao: data.descricao || "",
      data: data.data || today(),
      tag_ids: data.tag_ids || [],
      quitada: data.quitada !== void 0 ? data.quitada : true
    };
    db.expenses.unshift(entity);
    if (entity.conta_id) {
      db.accounts = db.accounts || [];
      const acc = db.accounts.find((a) => a.id === entity.conta_id);
      if (acc) {
        acc.saldo_atual = Number(acc.saldo_atual) - entity.valor;
      }
    }
    writeDatabase(db);
    const inboxId = addToInbox(
      "expense",
      `Despesa: ${entity.descricao || entity.categoria} R$ ${entity.valor.toFixed(2)}`,
      source,
      entity.id
    );
    return { success: true, data: entity, inboxId };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function createIncome(data, source = "dashboard") {
  try {
    const db = readDatabase();
    const entity = {
      id: uid("inc"),
      valor: Number(data.valor),
      categoria: data.categoria || "Receita",
      categoria_id: data.categoria_id,
      conta_id: data.conta_id,
      descricao: data.descricao || "",
      data: data.data || today(),
      tag_ids: data.tag_ids || [],
      quitada: data.quitada !== void 0 ? data.quitada : true
    };
    db.income.unshift(entity);
    if (entity.conta_id) {
      db.accounts = db.accounts || [];
      const acc = db.accounts.find((a) => a.id === entity.conta_id);
      if (acc) {
        acc.saldo_atual = Number(acc.saldo_atual) + entity.valor;
      }
    }
    writeDatabase(db);
    const inboxId = addToInbox(
      "income",
      `Receita: ${entity.descricao || entity.categoria} R$ ${entity.valor.toFixed(2)}`,
      source,
      entity.id
    );
    return { success: true, data: entity, inboxId };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function createTask(data, source = "dashboard") {
  try {
    const db = readDatabase();
    const entity = {
      id: uid("task"),
      titulo: data.titulo,
      status: "pending",
      prioridade: data.prioridade || "medium",
      prazo: data.prazo || new Date(Date.now() + 864e5).toISOString().split("T")[0]
    };
    db.tasks.unshift(entity);
    writeDatabase(db);
    const inboxId = addToInbox("task", `Tarefa: ${entity.titulo}`, source, entity.id);
    return { success: true, data: entity, inboxId };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function createReminder(data, source = "dashboard") {
  try {
    const db = readDatabase();
    const entity = {
      id: uid("rem"),
      titulo: data.titulo,
      data_hora: data.data_hora || new Date(Date.now() + 36e5).toISOString(),
      status: "active"
    };
    db.reminders.unshift(entity);
    writeDatabase(db);
    const inboxId = addToInbox(
      "reminder",
      `Lembrete: ${entity.titulo} em ${entity.data_hora}`,
      source,
      entity.id
    );
    return { success: true, data: entity, inboxId };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function createGoal(data, source = "dashboard") {
  try {
    const db = readDatabase();
    const entity = {
      id: uid("goal"),
      titulo: data.titulo,
      meta: Number(data.meta),
      progresso: 0,
      prazo: data.prazo || "2026-12-31"
    };
    db.goals.push(entity);
    writeDatabase(db);
    addToInbox("goal", `Meta: ${entity.titulo} (alvo: ${entity.meta})`, source, entity.id);
    return { success: true, data: entity };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function createHabit(data, source = "dashboard") {
  try {
    const db = readDatabase();
    const entity = {
      id: uid("hab"),
      nome: data.nome,
      frequencia: data.frequencia || "diaria",
      streak: 0,
      history: []
    };
    db.habits.push(entity);
    writeDatabase(db);
    addToInbox("habit", `H\xE1bito criado: ${entity.nome}`, source, entity.id);
    return { success: true, data: entity };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function createProject(data, source = "dashboard") {
  try {
    const db = readDatabase();
    const entity = {
      id: uid("proj"),
      nome: data.nome,
      descricao: data.descricao || "",
      status: data.status || "planning",
      progresso: 0,
      cliente: data.cliente || ""
    };
    db.projects.push(entity);
    writeDatabase(db);
    addToInbox("project", `Projeto: ${entity.nome}`, source, entity.id);
    return { success: true, data: entity };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function createNote(data, source = "dashboard") {
  try {
    const db = readDatabase();
    const entity = {
      id: uid("note"),
      conteudo: data.conteudo,
      tags: data.tags || [],
      created_at: now()
    };
    db.notes.unshift(entity);
    writeDatabase(db);
    addToInbox("note", entity.conteudo.slice(0, 120), source, entity.id);
    return { success: true, data: entity };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function createIdea(data, source = "dashboard") {
  try {
    const db = readDatabase();
    const entity = {
      id: uid("idea"),
      titulo: data.titulo,
      conteudo: data.conteudo || "",
      score: data.score || 5,
      created_at: now()
    };
    db.ideas.unshift(entity);
    writeDatabase(db);
    addToInbox("idea", `Ideia: ${entity.titulo}`, source, entity.id);
    return { success: true, data: entity };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function createMemory(data, source = "dashboard") {
  try {
    const db = readDatabase();
    const entity = {
      id: uid("mem"),
      conteudo: data.conteudo,
      embedding: [],
      origem: data.origem || source,
      created_at: now()
    };
    db.memories.unshift(entity);
    writeDatabase(db);
    addToInbox("memory", entity.conteudo.slice(0, 120), source, entity.id);
    embed(entity.conteudo).then((vec) => {
      if (vec) {
        const fresh = readDatabase();
        const idx = fresh.memories.findIndex((m) => m.id === entity.id);
        if (idx !== -1) {
          fresh.memories[idx].embedding = vec;
          writeDatabase(fresh);
        }
      }
    }).catch(() => {
    });
    return { success: true, data: entity };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function createDecision(data, source = "dashboard") {
  try {
    const db = readDatabase();
    const entity = {
      id: uid("dec"),
      title: data.title,
      context: data.context || "",
      expected_outcome: data.expected_outcome,
      actual_outcome: "",
      review_at: data.review_at || new Date(Date.now() + 30 * 864e5).toISOString().split("T")[0],
      reviewed: false,
      status: "ACTIVE",
      created_at: now()
    };
    db.decisions = db.decisions || [];
    db.decisions.unshift(entity);
    writeDatabase(db);
    addToInbox("decision", `Decis\xE3o Estrat\xE9gica: ${entity.title}`, source, entity.id);
    return { success: true, data: entity };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function updateDecision(id, data) {
  try {
    const db = readDatabase();
    const idx = db.decisions.findIndex((d) => d.id === id);
    if (idx === -1) return { success: false, error: "Decis\xE3o n\xE3o encontrada" };
    db.decisions[idx] = { ...db.decisions[idx], ...data };
    writeDatabase(db);
    return { success: true, data: db.decisions[idx] };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function createEnergyLog(data) {
  try {
    const db = readDatabase();
    const entity = {
      id: uid("nrg"),
      energy_level: Number(data.energy_level),
      task_id: data.task_id || void 0,
      context: data.context || {},
      created_at: now()
    };
    db.energyLogs = db.energyLogs || [];
    db.energyLogs.unshift(entity);
    if (db.userProfile) {
      db.userProfile.lifeScore = Math.min(100, Math.max(0, (db.userProfile.lifeScore || 80) + (data.energy_level - 5) * 0.4));
    }
    writeDatabase(db);
    return { success: true, data: entity };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function createBriefing(data) {
  try {
    const db = readDatabase();
    const entity = {
      id: uid("brf"),
      content: data.content,
      date: data.date || today(),
      generated_at: now()
    };
    db.briefings = db.briefings || [];
    db.briefings = db.briefings.filter((b) => b.date !== entity.date);
    db.briefings.unshift(entity);
    writeDatabase(db);
    return { success: true, data: entity };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function createSimulatorRun(data) {
  try {
    const db = readDatabase();
    const entity = {
      id: uid("sim"),
      params: data.params,
      result: data.result,
      created_at: now()
    };
    db.simulatorRuns = db.simulatorRuns || [];
    db.simulatorRuns.unshift(entity);
    writeDatabase(db);
    return { success: true, data: entity };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function createLeakageAlert(data) {
  try {
    const db = readDatabase();
    const entity = {
      id: uid("lka"),
      category: data.category,
      detected_change: Number(data.detected_change),
      description: data.description,
      dismissed: false,
      detected_at: now()
    };
    db.leakageAlerts = db.leakageAlerts || [];
    db.leakageAlerts.unshift(entity);
    writeDatabase(db);
    return { success: true, data: entity };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function createMeditationSession(data) {
  try {
    const db = readDatabase();
    const entity = {
      id: uid("med"),
      duration_seconds: Number(data.duration_seconds),
      type: data.type,
      mood_before: Number(data.mood_before),
      mood_after: Number(data.mood_after),
      notes: data.notes || "",
      completed_at: now()
    };
    db.meditationSessions = db.meditationSessions || [];
    db.meditationSessions.unshift(entity);
    if (db.userProfile) {
      db.userProfile.lifeScore = Math.min(100, (db.userProfile.lifeScore || 80) + 1.8);
    }
    writeDatabase(db);
    addToInbox("meditation", `Medita\xE7\xE3o conclu\xEDda: ${entity.type} de ${Math.floor(entity.duration_seconds / 60)}min`, "dashboard", entity.id);
    return { success: true, data: entity };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function createDailyIntention(data) {
  try {
    const db = readDatabase();
    const entity = {
      id: uid("int"),
      date: today(),
      intention_text: data.intention_text,
      focus_area: data.focus_area,
      completed: false
    };
    db.dailyIntentions = db.dailyIntentions || [];
    db.dailyIntentions = db.dailyIntentions.filter((i) => i.date !== entity.date);
    db.dailyIntentions.unshift(entity);
    writeDatabase(db);
    return { success: true, data: entity };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function createMoodLog(data) {
  try {
    const db = readDatabase();
    const entity = {
      id: uid("mld"),
      mood_score: Number(data.mood_score),
      energy_level: Number(data.energy_level),
      context: data.context,
      recorded_at: now()
    };
    db.moodLogs = db.moodLogs || [];
    db.moodLogs.unshift(entity);
    if (db.userProfile) {
      db.userProfile.lifeScore = Math.min(100, Math.max(0, (db.userProfile.lifeScore || 80) + (data.mood_score - 5) * 0.2));
    }
    writeDatabase(db);
    return { success: true, data: entity };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function createDebt(data) {
  try {
    const db = readDatabase();
    const entity = {
      id: uid("dbt"),
      descricao: data.descricao,
      credor: data.credor,
      valor_original: Number(data.valor_original),
      saldo_atual: Number(data.valor_original),
      vencimento: data.vencimento,
      status: "ABERTA"
    };
    db.debts = db.debts || [];
    db.debts.unshift(entity);
    writeDatabase(db);
    return { success: true, data: entity };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function createDebtPayment(data) {
  try {
    const db = readDatabase();
    const entity = {
      id: uid("dpt"),
      debt_id: data.debt_id,
      valor_pago: Number(data.valor_pago),
      data_pagamento: data.data_pagamento || today()
    };
    db.debtPayments = db.debtPayments || [];
    db.debtPayments.unshift(entity);
    db.debts = db.debts || [];
    const debtIdx = db.debts.findIndex((d) => d.id === data.debt_id);
    if (debtIdx !== -1) {
      const debt = db.debts[debtIdx];
      const totalPaid = db.debtPayments.filter((p) => p.debt_id === data.debt_id).reduce((sum, p) => sum + p.valor_pago, 0);
      debt.saldo_atual = Math.max(0, debt.valor_original - totalPaid);
      if (debt.saldo_atual <= 0) {
        debt.status = "QUITADA";
      } else if (debt.saldo_atual < debt.valor_original) {
        debt.status = "PARCIAL";
      } else {
        debt.status = "ABERTA";
      }
    }
    writeDatabase(db);
    return { success: true, data: entity };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function createBudget(data) {
  try {
    const db = readDatabase();
    const entity = {
      id: uid("bdg"),
      category_id: data.category_id,
      valor_planejado: Number(data.valor_planejado),
      valor_realizado: 0,
      mes: Number(data.mes),
      ano: Number(data.ano)
    };
    db.budgets = db.budgets || [];
    db.budgets = db.budgets.filter((b) => !(b.category_id === entity.category_id && b.mes === entity.mes && b.ano === entity.ano));
    db.budgets.unshift(entity);
    writeDatabase(db);
    return { success: true, data: entity };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function createAiExtraction(data) {
  try {
    const db = readDatabase();
    const entity = {
      id: uid("ext"),
      source: data.source,
      confidence: Number(data.confidence),
      extracted_json: data.extracted_json,
      status: "PENDING",
      created_at: now()
    };
    db.aiExtractions = db.aiExtractions || [];
    db.aiExtractions.unshift(entity);
    writeDatabase(db);
    return { success: true, data: entity };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function updateAiExtractionStatus(id, status, extractedJson) {
  try {
    const db = readDatabase();
    const idx = db.aiExtractions.findIndex((e) => e.id === id);
    if (idx === -1) return { success: false, error: "Extra\xE7\xE3o n\xE3o encontrada" };
    const extraction = db.aiExtractions[idx];
    extraction.status = status;
    extraction.processed_at = now();
    if (extractedJson) {
      extraction.extracted_json = extractedJson;
    }
    if (status === "APPROVED") {
      const { intent, data } = extraction.extracted_json;
      if (intent && data) {
        await executeFromIntent(intent, data, extraction.source);
      }
    }
    writeDatabase(db);
    return { success: true, data: extraction };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function updateTask(id, data) {
  try {
    const db = readDatabase();
    const idx = db.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return { success: false, error: "Tarefa n\xE3o encontrada" };
    db.tasks[idx] = { ...db.tasks[idx], ...data };
    writeDatabase(db);
    return { success: true, data: db.tasks[idx] };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function completeTask(id) {
  return updateTask(id, { status: "completed" });
}
async function updateGoalProgress(id, progresso) {
  try {
    const db = readDatabase();
    const idx = db.goals.findIndex((g) => g.id === id);
    if (idx === -1) return { success: false, error: "Meta n\xE3o encontrada" };
    db.goals[idx].progresso = Math.min(db.goals[idx].meta, Math.max(0, progresso));
    writeDatabase(db);
    return { success: true, data: db.goals[idx] };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function checkHabit(id) {
  try {
    const db = readDatabase();
    const idx = db.habits.findIndex((h) => h.id === id);
    if (idx === -1) return { success: false, error: "H\xE1bito n\xE3o encontrado" };
    const todayStr = today();
    if (!db.habits[idx].history.includes(todayStr)) {
      db.habits[idx].history.push(todayStr);
      db.habits[idx].streak += 1;
      writeDatabase(db);
    }
    return { success: true, data: db.habits[idx] };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function updateProject(id, data) {
  try {
    const db = readDatabase();
    const idx = db.projects.findIndex((p) => p.id === id);
    if (idx === -1) return { success: false, error: "Projeto n\xE3o encontrado" };
    db.projects[idx] = { ...db.projects[idx], ...data };
    writeDatabase(db);
    return { success: true, data: db.projects[idx] };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function deleteEntity(collection, id) {
  try {
    const db = readDatabase();
    if (!Array.isArray(db[collection])) return { success: false, error: "Cole\xE7\xE3o inv\xE1lida" };
    if (collection === "expenses") {
      const expense = db.expenses.find((e) => e.id === id);
      if (expense && expense.conta_id) {
        db.accounts = db.accounts || [];
        const acc = db.accounts.find((a) => a.id === expense.conta_id);
        if (acc) {
          acc.saldo_atual = Number(acc.saldo_atual) + Number(expense.valor);
        }
      }
    } else if (collection === "income") {
      const income = db.income.find((i) => i.id === id);
      if (income && income.conta_id) {
        db.accounts = db.accounts || [];
        const acc = db.accounts.find((a) => a.id === income.conta_id);
        if (acc) {
          acc.saldo_atual = Number(acc.saldo_atual) - Number(income.valor);
        }
      }
    }
    const before = db[collection].length;
    db[collection] = db[collection].filter((item) => item.id !== id);
    if (db[collection].length === before) return { success: false, error: "Item n\xE3o encontrado" };
    writeDatabase(db);
    return { success: true, data: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function executeFromIntent(intent, extractedData, source = "telegram") {
  switch (intent) {
    case "expense":
      return createExpense(extractedData, source);
    case "income":
      return createIncome(extractedData, source);
    case "task":
      return createTask(extractedData, source);
    case "reminder":
      return createReminder(extractedData, source);
    case "goal":
      return createGoal(extractedData, source);
    case "habit":
      return createHabit(extractedData, source);
    case "project":
      return createProject(extractedData, source);
    case "note":
      return createNote(extractedData, source);
    case "idea":
      return createIdea(extractedData, source);
    case "memory":
      return createMemory(extractedData, source);
    case "decision":
      return createDecision(extractedData, source);
    case "meditation":
      return createMeditationSession(extractedData);
    case "mood":
      return createMoodLog(extractedData);
    case "debt":
      return createDebt(extractedData);
    case "debt_payment":
      return createDebtPayment(extractedData);
    case "budget":
      return createBudget(extractedData);
    default:
      return { success: true, data: null };
  }
}
var uid, today, now;
var init_action = __esm({
  "services/engine/action.ts"() {
    init_db();
    init_memory();
    uid = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    today = () => (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    now = () => (/* @__PURE__ */ new Date()).toISOString();
  }
});

// server/server.ts
init_db();
import express from "express";
import path2 from "path";
import dotenv2 from "dotenv";
import fs2 from "fs";

// services/ai/index.ts
init_provider();

// services/ai/router.ts
init_provider();
var ROUTER_SYSTEM_PROMPT = `Voc\xEA \xE9 o AI Router do LifeOS \u2014 um motor de classifica\xE7\xE3o de inten\xE7\xE3o de alt\xEDssima precis\xE3o em portugu\xEAs brasileiro.

Sua \xDANICA fun\xE7\xE3o \xE9 analisar o texto do usu\xE1rio e retornar um JSON com:
- "intent": categoria da mensagem
- "extracted_data": dados estruturados extra\xEDdos
- "explanation": 1 frase curta explicando a classifica\xE7\xE3o
- "confidence": n\xFAmero entre 0 e 1

CATEGORIAS DE INTENT:
- "expense" \u2192 despesas, gastos tradicionais, compras no d\xE9bito/dinheiro
- "income"  \u2192 receitas, ganhos, sal\xE1rio, pix recebido
- "task"    \u2192 tarefas, afazeres, to-dos, a\xE7\xF5es futuras
- "reminder" \u2192 lembretes com data/hora espec\xEDfica
- "goal"    \u2192 metas com progresso num\xE9rico
- "habit"   \u2192 check-in em h\xE1bito ou rotina di\xE1ria
- "project" \u2192 cria\xE7\xE3o de novo projeto
- "note"    \u2192 anota\xE7\xF5es, aprendizados, di\xE1rios
- "idea"    \u2192 ideias criativas para avaliar depois
- "memory"  \u2192 fatos importantes de vida pessoal/profissional
- "decision" \u2192 decis\xF5es importantes e o que espera dela
- "meditation" \u2192 registrar uma sess\xE3o de medita\xE7\xE3o, respira\xE7\xE3o ou mindfulness
- "mood" \u2192 registrar humor (1 a 10) e energia f\xEDsica/mental (1 a 10)
- "debt" \u2192 registrar uma d\xEDvida com credor e valor original
- "debt_payment" \u2192 pagar/quitar uma d\xEDvida
- "budget" \u2192 definir teto or\xE7ament\xE1rio mensal por categoria
- "chat"    \u2192 conversa, pergunta direta ao assistente

REGRAS DE EXTRA\xC7\xC3O:
1. expense/income \u2192 "valor" (n\xFAmero), "categoria" (1 palavra), "descricao", "data" (YYYY-MM-DD, hoje se omitida)
2. task \u2192 "titulo", "prioridade" (high/medium/low), "prazo" (YYYY-MM-DD, amanh\xE3 se omitido), "status": "pending"
3. reminder \u2192 "titulo", "data_hora" (ISO string), "status": "active"
4. goal \u2192 "titulo", "meta" (n\xFAmero alvo), "progresso" (0), "prazo" (YYYY-MM-DD)
5. habit \u2192 "nome", "frequencia" (diaria/semanal)
6. note/memory \u2192 "conteudo" (texto completo), "tags" (array de palavras-chave)
7. idea \u2192 "titulo" (nome curto), "conteudo" (detalhes), "score" (1-10 potencial)
8. decision \u2192 "title", "context", "expected_outcome", "review_at" (YYYY-MM-DD)
9. meditation \u2192 "duration_seconds" (n\xFAmero), "type" (breathing/guided/gratitude/visualization/body_scan), "mood_before" (n\xFAmero), "mood_after" (n\xFAmero)
10. mood \u2192 "mood_score" (n\xFAmero), "energy_level" (n\xFAmero), "context" (texto)
11. debt \u2192 "descricao", "credor", "valor_original" (n\xFAmero), "vencimento" (YYYY-MM-DD)
12. debt_payment \u2192 "debt_id", "valor_pago" (n\xFAmero)
13. budget \u2192 "category_id", "valor_planejado" (n\xFAmero), "mes" (n\xFAmero), "ano" (n\xFAmero)

Retorne APENAS o JSON, sem markdown, sem explica\xE7\xE3o fora do JSON.`;
async function routeMessage(text) {
  const today2 = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 864e5).toISOString().split("T")[0];
  const userMessage = `Data de hoje: ${today2}. Texto para classificar: "${text}"`;
  try {
    const provider = getProvider();
    if (!provider.isAvailable()) {
      console.warn("[Router] Provedor IA indispon\xEDvel \u2014 usando fallback heur\xEDstico.");
      return heuristicFallback(text, today2);
    }
    const result = await provider.chatJSON(ROUTER_SYSTEM_PROMPT, userMessage);
    return {
      intent: result.intent || "note",
      extracted_data: result.extracted_data || {},
      explanation: result.explanation || "Processado pelo AI Router.",
      confidence: Math.min(1, Math.max(0, result.confidence ?? 0.8))
    };
  } catch (error) {
    console.error("[Router] Falha na classifica\xE7\xE3o IA:", error.message);
    return heuristicFallback(text, today2);
  }
}
function heuristicFallback(text, today2) {
  const lower = text.toLowerCase();
  const tomorrow = new Date(Date.now() + 864e5).toISOString().split("T")[0];
  if (lower.match(/gastei|paguei|comprei|compra|custou|r\$|\bpix\b saiu|débito|debitou/)) {
    const numMatch = text.match(/(\d[\d.,]*)/);
    const valor = numMatch ? parseFloat(numMatch[0].replace(",", ".")) : 0;
    return {
      intent: "expense",
      extracted_data: {
        valor,
        categoria: lower.includes("uber") || lower.includes("taxi") ? "Transporte" : lower.includes("comida") || lower.includes("restaurante") || lower.includes("lanche") ? "Alimenta\xE7\xE3o" : lower.includes("mercado") || lower.includes("supermercado") ? "Mercado" : "Geral",
        descricao: text.replace(/r\$\s*[\d,.]+/gi, "").trim(),
        data: today2
      },
      explanation: "Padr\xE3o de despesa detectado (fallback).",
      confidence: 0.7
    };
  }
  if (lower.match(/recebi|ganhei|faturei|salário|pix recebido|depositou|faturamento/)) {
    const numMatch = text.match(/(\d[\d.,]*)/);
    return {
      intent: "income",
      extracted_data: {
        valor: numMatch ? parseFloat(numMatch[0].replace(",", ".")) : 0,
        categoria: lower.includes("sal\xE1rio") ? "Sal\xE1rio" : lower.includes("consultor") ? "Consultoria" : "Receita",
        descricao: text.trim(),
        data: today2
      },
      explanation: "Padr\xE3o de receita detectado (fallback).",
      confidence: 0.7
    };
  }
  if (lower.match(/preciso|tenho que|devo|fazer|criar|desenvolver|terminar|entregar|prazo/)) {
    return {
      intent: "task",
      extracted_data: {
        titulo: text.replace(/preciso|tenho que|devo|fazer|criar/gi, "").trim() || "Nova Tarefa",
        prioridade: lower.includes("urgente") || lower.includes("importante") ? "high" : "medium",
        prazo: tomorrow,
        status: "pending"
      },
      explanation: "Padr\xE3o de tarefa detectado (fallback).",
      confidence: 0.65
    };
  }
  if (lower.match(/lembrar|lembrete|me lembra|agendar|reunião às|call às|às \d+h/)) {
    return {
      intent: "reminder",
      extracted_data: {
        titulo: text.replace(/lembrar|me lembra de|lembrete/gi, "").trim(),
        data_hora: new Date(Date.now() + 36e5).toISOString(),
        status: "active"
      },
      explanation: "Padr\xE3o de lembrete detectado (fallback).",
      confidence: 0.65
    };
  }
  if (lower.match(/ideia|e se|e se eu|insight|seria incrível|pensei em|lampejo/)) {
    return {
      intent: "idea",
      extracted_data: { titulo: text.slice(0, 60).trim(), conteudo: text, score: 7 },
      explanation: "Padr\xE3o de ideia detectado (fallback).",
      confidence: 0.6
    };
  }
  if (lower.match(/meditei|treinei|academia|corri|li|estudei|fiz|completei|check/)) {
    return {
      intent: "habit",
      extracted_data: {
        nome: text.replace(/meditei|treinei|fiz|completei/gi, "").trim() || "H\xE1bito di\xE1rio",
        frequencia: "diaria"
      },
      explanation: "Padr\xE3o de h\xE1bito detectado (fallback).",
      confidence: 0.6
    };
  }
  if (lower.match(/^\/|quem|como|onde|o que|por que|qual|ajuda|oi|olá|bom dia|boa tarde/)) {
    return {
      intent: "chat",
      extracted_data: { conteudo: text },
      explanation: "Mensagem conversacional (fallback).",
      confidence: 0.6
    };
  }
  return {
    intent: "note",
    extracted_data: { conteudo: text, tags: [] },
    explanation: "Classificado como anota\xE7\xE3o por falta de padr\xE3o espec\xEDfico (fallback).",
    confidence: 0.4
  };
}

// services/ai/index.ts
init_memory();

// services/ai/personas.ts
init_db();
init_provider();

// services/ai/insights.ts
init_provider();

// services/ai/index.ts
init_memory();
init_provider();
var getAI = getProvider;

// services/engine/index.ts
init_action();

// services/engine/context.ts
init_db();

// services/ai/prompt-registry.ts
var PERSONA_RESPOND = (persona, contextBlock, history) => `Voc\xEA \xE9: ${persona.nome}
Descri\xE7\xE3o: ${persona.descricao}

PERSONALIDADE \u2014 siga \xE0 risca:
${persona.prompt_base}

${contextBlock}

${history ? `HIST\xD3RICO RECENTE:
${history}
` : ""}REGRAS:
- Responda em portugu\xEAs brasileiro, tom natural
- Use os dados do contexto \u2014 nunca invente n\xFAmeros
- M\xE1ximo 3 par\xE1grafos, direto ao ponto
- Emojis com modera\xE7\xE3o`;
var CONTEXT_BLOCK = (data) => `\u2550\u2550\u2550 CONTEXTO DO SISTEMA \u2550\u2550\u2550

\u{1F464} PERFIL: ${data.nome}
   Interesses: ${data.interesses.slice(0, 3).join(", ")}
   Objetivos: ${data.objetivos.slice(0, 2).join("; ")}

\u{1F4B0} FINANCEIRO:
   Receitas: R$ ${data.totalIncome.toFixed(2)} | Despesas: R$ ${data.totalExpenses.toFixed(2)} | Saldo: R$ ${data.balance.toFixed(2)}
   Maior gasto: ${data.topCategory}

\u{1F4CB} TAREFAS PENDENTES (${data.pendingTasks.length}):
${data.pendingTasks.slice(0, 5).map((t) => `   \u2022 [${t.prioridade.toUpperCase()}] ${t.titulo} (${t.prazo})`).join("\n") || "   Nenhuma"}

\u{1F3AF} METAS (${data.goals.length}):
${data.goals.slice(0, 3).map((g) => `   \u2022 ${g.titulo}: ${g.progresso}/${g.meta} \u2014 prazo ${g.prazo}`).join("\n") || "   Nenhuma"}

\u{1F525} H\xC1BITOS:
${data.habits.slice(0, 4).map((h) => `   \u2022 ${h.nome} (${h.streak}d streak)`).join("\n") || "   Nenhum"}

\u{1F5C2}\uFE0F PROJETOS ATIVOS:
${data.projects.filter((p) => p.status !== "completed").slice(0, 3).map((p) => `   \u2022 ${p.nome} ${p.progresso}%`).join("\n") || "   Nenhum"}
${data.memories.length > 0 ? `
\u{1F9E0} MEM\xD3RIAS RELEVANTES:
${data.memories.slice(0, 3).map((m) => `   \u2022 ${m}`).join("\n")}` : ""}${data.notes.length > 0 ? `
\u{1F4DD} ANOTA\xC7\xD5ES RECENTES:
${data.notes.slice(0, 3).map((n) => `   \u2022 ${n}`).join("\n")}` : ""}\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550`;
var INSIGHT_DAILY = () => `Voc\xEA \xE9 um consultor executivo pessoal analisando dados reais do usu\xE1rio.
Gere exatamente 3 insights curtos e acion\xE1veis em portugu\xEAs.
Retorne APENAS um JSON array: ["insight 1", "insight 2", "insight 3"]
Cada insight: m\xE1ximo 2 frases. Espec\xEDfico, com n\xFAmeros quando poss\xEDvel.`;
var INSIGHT_FINANCIAL = (nome) => `Voc\xEA \xE9 o CFO pessoal de ${nome}.
Gere um relat\xF3rio financeiro executivo em portugu\xEAs (m\xE1ximo 4 par\xE1grafos).
Seja espec\xEDfico com n\xFAmeros reais. Identifique padr\xF5es. D\xEA 2 recomenda\xE7\xF5es acion\xE1veis.`;
var MEMORY_EXTRACT = () => `Transcreva ou analise este conte\xFAdo em portugu\xEAs brasileiro.
Retorne APENAS o texto extra\xEDdo ou transcrito, sem explica\xE7\xF5es.`;
var MEMORY_OCR = () => `Analise esta imagem.
Se for nota fiscal, recibo ou comprovante: retorne JSON:
{ "isReceipt": true, "valor": <number>, "descricao": "<string>", "data": "<YYYY-MM-DD>", "text": "<texto completo>" }
Se n\xE3o for recibo: retorne JSON:
{ "isReceipt": false, "text": "<texto ou descri\xE7\xE3o da imagem>" }
Retorne APENAS o JSON, sem markdown.`;

// services/engine/context.ts
init_memory();
async function getContext(query) {
  const db = readDatabase();
  const profile = getProfile();
  const totalIncome = db.income.reduce((s, i) => s + i.valor, 0);
  const totalExpenses = db.expenses.reduce((s, e) => s + e.valor, 0);
  const categoryTotals = {};
  db.expenses.forEach((e) => {
    categoryTotals[e.categoria] = (categoryTotals[e.categoria] || 0) + e.valor;
  });
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Nenhuma";
  const financial = {
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    topCategory,
    recentExpenses: db.expenses.slice(0, 10),
    recentIncome: db.income.slice(0, 5)
  };
  let relevantMemories = db.memories.slice(0, 5);
  let relevantNotes = db.notes.slice(0, 5);
  let relevantIdeas = db.ideas.slice(0, 3);
  if (query && query.trim().length > 2) {
    const queryVec = await embed(query).catch(() => null);
    const scoredMemories = await Promise.all(
      db.memories.map(async (m) => {
        let score = 0;
        if (queryVec && m.embedding && m.embedding.length > 0) {
          score = cosineSimilarity(queryVec, m.embedding);
        } else if (queryVec) {
          const v = await embed(m.conteudo).catch(() => null);
          score = v ? cosineSimilarity(queryVec, v) : keywordScore(m.conteudo, query);
        } else {
          score = keywordScore(m.conteudo, query);
        }
        return { item: m, score };
      })
    );
    const topMemories = scoredMemories.filter((r) => r.score > 0.05).sort((a, b) => b.score - a.score).slice(0, 5).map((r) => r.item);
    if (topMemories.length > 0) relevantMemories = topMemories;
    const scoredNotes = db.notes.map((n) => ({ item: n, score: keywordScore(n.conteudo, query) })).filter((r) => r.score > 0.05).sort((a, b) => b.score - a.score).slice(0, 5);
    if (scoredNotes.length > 0) relevantNotes = scoredNotes.map((r) => r.item);
    const scoredIdeas = db.ideas.map((i) => ({ item: i, score: keywordScore(`${i.titulo} ${i.conteudo}`, query) })).filter((r) => r.score > 0.05).sort((a, b) => b.score - a.score).slice(0, 3);
    if (scoredIdeas.length > 0) relevantIdeas = scoredIdeas.map((r) => r.item);
  }
  return {
    userProfile: profile,
    financial,
    pendingTasks: db.tasks.filter((t) => t.status === "pending"),
    activeReminders: db.reminders.filter((r) => r.status === "active"),
    goals: db.goals,
    habits: db.habits,
    activeProjects: db.projects.filter((p) => p.status !== "completed"),
    relevantMemories,
    relevantNotes,
    relevantIdeas,
    query
  };
}
function formatContext(ctx) {
  return CONTEXT_BLOCK({
    nome: ctx.userProfile.nome,
    interesses: ctx.userProfile.interesses ?? [],
    objetivos: ctx.userProfile.objetivos ?? [],
    totalIncome: ctx.financial.totalIncome,
    totalExpenses: ctx.financial.totalExpenses,
    balance: ctx.financial.balance,
    topCategory: ctx.financial.topCategory,
    pendingTasks: ctx.pendingTasks.map((t) => ({
      titulo: t.titulo,
      prioridade: t.prioridade,
      prazo: t.prazo
    })),
    goals: ctx.goals.map((g) => ({
      titulo: g.titulo,
      progresso: g.progresso,
      meta: g.meta,
      prazo: g.prazo
    })),
    habits: ctx.habits.map((h) => ({ nome: h.nome, streak: h.streak })),
    projects: ctx.activeProjects.map((p) => ({
      nome: p.nome,
      progresso: p.progresso,
      status: p.status
    })),
    memories: ctx.relevantMemories.map((m) => m.conteudo.slice(0, 120)),
    notes: ctx.relevantNotes.map((n) => n.conteudo.slice(0, 120))
  });
}

// services/ai/core.ts
init_provider();
init_memory();
init_db();
async function runPersona(message, history = []) {
  const persona = getActivePersona();
  const ctx = await getContext(message);
  const contextBlock = formatContext(ctx);
  const historyStr = history.slice(-6).map((h) => `${h.sender === "user" ? "Usu\xE1rio" : persona.nome}: ${h.text}`).join("\n");
  const systemPrompt = PERSONA_RESPOND(persona, contextBlock, historyStr);
  try {
    const provider = getProvider();
    if (!provider.isAvailable()) return localPersonaFallback(persona, message, ctx);
    const response = await provider.chat(systemPrompt, `"${message}"`, {
      temperature: 0.65,
      maxTokens: 1024
    });
    return response || localPersonaFallback(persona, message, ctx);
  } catch (err) {
    console.error("[AICore] runPersona falhou:", err.message);
    return localPersonaFallback(persona, message, ctx);
  }
}
async function runInsight(type = "daily") {
  const ctx = await getContext();
  const { financial: fs3, pendingTasks, goals, habits, activeProjects, userProfile } = ctx;
  if (type === "financial") {
    const systemPrompt2 = INSIGHT_FINANCIAL(userProfile.nome);
    const topExpenses = fs3.recentExpenses.sort((a, b) => b.valor - a.valor).slice(0, 5).map((e) => `${e.categoria}: R$ ${e.valor.toFixed(2)} (${e.descricao})`).join("\n");
    const userMessage2 = `Receitas: R$ ${fs3.totalIncome.toFixed(2)}
Despesas: R$ ${fs3.totalExpenses.toFixed(2)}
Saldo: R$ ${fs3.balance.toFixed(2)}
Cat. maior gasto: ${fs3.topCategory}

Top despesas:
${topExpenses || "Nenhuma"}`;
    try {
      const provider = getProvider();
      if (!provider.isAvailable()) return [localFinancialReport(ctx)];
      const text = await provider.chat(systemPrompt2, userMessage2, { temperature: 0.4 });
      return [text];
    } catch {
      return [localFinancialReport(ctx)];
    }
  }
  const systemPrompt = INSIGHT_DAILY();
  const userMessage = [
    `Saldo: R$ ${fs3.balance.toFixed(2)} (receitas ${fs3.totalIncome.toFixed(2)}, despesas ${fs3.totalExpenses.toFixed(2)})`,
    `Maior gasto: ${fs3.topCategory}`,
    `Tarefas pendentes: ${pendingTasks.length} (${pendingTasks.filter((t) => t.prioridade === "high").length} urgentes)`,
    `Metas: ${goals.map((g) => `${g.titulo} ${Math.round(g.progresso / g.meta * 100)}%`).join(", ") || "nenhuma"}`,
    `H\xE1bitos: ${habits.map((h) => `${h.nome} (${h.streak}d)`).join(", ") || "nenhum"}`,
    `Projetos ativos: ${activeProjects.length}`
  ].join("\n");
  try {
    const provider = getProvider();
    if (!provider.isAvailable()) return localDailyInsights(ctx);
    const raw = await provider.chatJSON(systemPrompt, userMessage);
    if (Array.isArray(raw) && raw.length > 0) return raw.slice(0, 3);
    return localDailyInsights(ctx);
  } catch {
    return localDailyInsights(ctx);
  }
}
async function runRouter(text) {
  return routeMessage(text);
}
async function runTranscribe(audioBase64, mimeType = "audio/webm") {
  try {
    const provider = getProvider();
    if (!provider.isAvailable()) return "";
    const result = await provider.chatMultimodal?.(
      MEMORY_EXTRACT(),
      audioBase64,
      mimeType
    );
    return result || "";
  } catch (err) {
    console.error("[AICore] runTranscribe falhou:", err.message);
    return "";
  }
}
async function runOCR(imageBase64, mimeType = "image/jpeg") {
  try {
    const provider = getProvider();
    if (!provider.isAvailable()) return { isReceipt: false, text: "IA n\xE3o dispon\xEDvel" };
    const result = await provider.chatMultimodal?.(
      MEMORY_OCR(),
      imageBase64,
      mimeType
    );
    if (!result) return { isReceipt: false, text: "" };
    try {
      const clean = result.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
      return JSON.parse(clean);
    } catch {
      return { isReceipt: false, text: result };
    }
  } catch (err) {
    console.error("[AICore] runOCR falhou:", err.message);
    return { isReceipt: false, text: "" };
  }
}
function localPersonaFallback(persona, message, ctx) {
  const { financial: fs3, pendingTasks, goals, userProfile } = ctx;
  const name = userProfile.nome || "voc\xEA";
  const lower = message.toLowerCase();
  if (persona.id === "cfo" || persona.nome?.toLowerCase().includes("cfo")) {
    if (lower.match(/gasto|despesa|gastei|paguei/)) {
      return `\u{1F4CA} **[CFO]** Computado. Saldo atual: **R$ ${fs3.balance.toFixed(2)}**. Receitas: R$ ${fs3.totalIncome.toFixed(2)} | Despesas: R$ ${fs3.totalExpenses.toFixed(2)}. Maior categoria: **${fs3.topCategory}**. Esse gasto est\xE1 dentro do or\xE7amento?`;
    }
    return `\u{1F4CA} **[CFO]** Entendido. Situa\xE7\xE3o: saldo **R$ ${fs3.balance.toFixed(2)}**, ${pendingTasks.length} tarefas, ${goals.length} metas. O que analisar?`;
  }
  if (persona.id === "founder") {
    return `\u{1F680} **[Founder]** Fala, ${name}! Registrado. ${pendingTasks.length} pend\xEAncias no radar. Qual move a agulha hoje? Foco em execu\xE7\xE3o.`;
  }
  if (persona.id === "executor") {
    const urgent = pendingTasks.filter((t) => t.prioridade === "high");
    return `\u26A1 **[Executor]** Registrado. ${urgent.length > 0 ? `Urgente: **${urgent[0].titulo}**. ` : ""}${pendingTasks.length} tarefas. Pr\xF3xima a\xE7\xE3o agora?`;
  }
  return `\u{1F9D9} **[${persona.nome}]** Registrado. Saldo: **R$ ${fs3.balance.toFixed(2)}** | Tarefas: ${pendingTasks.length}. Como avan\xE7ar?`;
}
function localDailyInsights(ctx) {
  const { financial: fs3, pendingTasks, goals, habits } = ctx;
  const urgent = pendingTasks.filter((t) => t.prioridade === "high");
  const bestHabit = habits.reduce((b, h) => h.streak > b.streak ? h : b, habits[0]);
  return [
    fs3.balance >= 0 ? `\u{1F4B0} Saldo positivo de R$ ${fs3.balance.toFixed(2)}. Maior gasto: ${fs3.topCategory}. Considere alocar parte para suas metas.` : `\u26A0\uFE0F Saldo negativo de R$ ${Math.abs(fs3.balance).toFixed(2)}. Revise ${fs3.topCategory} para equilibrar o caixa.`,
    urgent.length > 0 ? `\u{1F534} ${urgent.length} urgente(s): "${urgent[0].titulo}". Priorize antes do fim do dia.` : `\u{1F4CB} ${pendingTasks.length} tarefa(s) pendente(s). Escolha 3 para hoje e ignore o resto.`,
    bestHabit ? `\u{1F525} Melhor streak: ${bestHabit.nome} com ${bestHabit.streak} dias. N\xE3o quebre hoje!` : goals[0] ? `\u{1F3AF} Meta "${goals[0].titulo}": ${Math.round(goals[0].progresso / goals[0].meta * 100)}% conclu\xEDda.` : `\u{1F680} Defina pelo menos 1 h\xE1bito ou meta para acompanhar o progresso.`
  ];
}
function localFinancialReport(ctx) {
  const { financial: fs3, goals, pendingTasks } = ctx;
  return `\u{1F4CA} **Relat\xF3rio Financeiro**

Receitas: R$ ${fs3.totalIncome.toFixed(2)} | Despesas: R$ ${fs3.totalExpenses.toFixed(2)} | **Saldo: R$ ${fs3.balance.toFixed(2)}**

Maior categoria de gasto: **${fs3.topCategory}**. ${pendingTasks.length} tarefas pendentes. ${goals.length} metas ativas.

Configure a API DeepSeek para an\xE1lises detalhadas com IA.`;
}

// services/engine/command.ts
init_action();
init_db();
async function handleCommand(rawText, history = []) {
  const trimmed = rawText.trim();
  if (!trimmed.startsWith("/")) return { response: "", handled: false };
  const [cmd, ...argParts] = trimmed.split(" ");
  const command = cmd.toLowerCase();
  const args = argParts.join(" ").trim();
  switch (command) {
    case "/ask":
      return handleAsk(args || "D\xEA um resumo do meu dia", history);
    case "/hoje":
    case "/today":
      return handleHoje();
    case "/resumo":
    case "/summary":
      return handleResumo();
    case "/financeiro":
    case "/finance":
    case "/cfo":
      return handleFinanceiro();
    case "/tasks":
    case "/tarefas":
      return handleTasks();
    case "/metas":
    case "/goals":
      return handleMetas();
    case "/habitos":
    case "/habits":
      return handleHabitos();
    case "/projetos":
    case "/projects":
      return handleProjetos();
    case "/insights":
      return handleInsights();
    case "/status":
      return handleStatus();
    case "/help":
    case "/ajuda":
      return handleHelp();
    case "/agora":
      return handleAgora();
    case "/gasto":
      return handleGasto(args);
    case "/receita":
      return handleReceita(args);
    case "/tarefa":
      return handleTarefa(args);
    case "/concluir":
      return handleConcluir(args);
    case "/lembrete":
      return handleLembrete(args);
    case "/projeto":
      return handleProjeto(args);
    case "/meta":
      return handleMeta(args);
    case "/habito":
      return handleHabitoCreate(args);
    case "/check":
      return handleCheck(args);
    case "/nota":
      return handleNota(args);
    case "/ideia":
      return handleIdeia(args);
    case "/persona":
      return handlePersona(args);
    case "/personas":
      return handlePersonas();
    case "/perfil":
      return handlePerfil();
    default:
      return {
        response: `\u2753 Comando n\xE3o reconhecido: \`${command}\`

Use /help para ver os comandos dispon\xEDveis.`,
        handled: true
      };
  }
}
function isCommand(text) {
  return text.trim().startsWith("/");
}
async function handleAsk(question, history) {
  const response = await runPersona(question, history);
  return { response, handled: true };
}
async function handleHoje() {
  const ctx = await getContext();
  const { financial: fs3, pendingTasks, habits, goals, userProfile } = ctx;
  const hoje = (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const urgent = pendingTasks.filter((t) => t.prioridade === "high");
  const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const habitsHoje = habits.filter((h) => h.history?.includes(todayStr));
  const lines = [
    `\u{1F4C5} *${hoje.toUpperCase()}*`,
    ``,
    `\u{1F4B0} *Financeiro:* R$ ${fs3.balance.toFixed(2)} de saldo (\u2191 R$ ${fs3.totalIncome.toFixed(2)} | \u2193 R$ ${fs3.totalExpenses.toFixed(2)})`,
    ``,
    `\u{1F4CB} *Tarefas:* ${pendingTasks.length} pendentes${urgent.length > 0 ? ` \u2014 \u{1F534} ${urgent.length} urgente(s)` : ""}`,
    urgent.slice(0, 3).map((t) => `   \u2022 ${t.titulo}`).join("\n"),
    ``,
    `\u{1F525} *H\xE1bitos hoje:* ${habitsHoje.length}/${habits.length} feitos`,
    habits.filter((h) => !h.history?.includes(todayStr)).slice(0, 3).map((h) => `   \u2022 \u2B1C ${h.nome} (${h.streak}d streak)`).join("\n"),
    ``,
    goals.length > 0 ? `\u{1F3AF} *Meta em foco:* ${goals[0].titulo} \u2014 ${Math.round(goals[0].progresso / goals[0].meta * 100)}%` : "",
    ``,
    `_${userProfile.appName} \u2014 Resumo Di\xE1rio_`
  ];
  return { response: lines.filter((l) => l !== "").join("\n"), handled: true };
}
async function handleResumo() {
  const response = await runPersona(
    "Fa\xE7a um resumo executivo completo da minha semana: financeiro, tarefas, metas e h\xE1bitos. Seja espec\xEDfico com n\xFAmeros.",
    []
  );
  return { response, handled: true };
}
async function handleFinanceiro() {
  const insights = await runInsight("financial");
  return { response: insights[0] || "Sem dados financeiros suficientes.", handled: true };
}
async function handleTasks() {
  const ctx = await getContext();
  const { pendingTasks } = ctx;
  if (pendingTasks.length === 0) {
    return { response: "\u2705 Nenhuma tarefa pendente! Aproveite para planejar a pr\xF3xima semana.", handled: true };
  }
  const byPriority = { high: [], medium: [], low: [] };
  pendingTasks.forEach((t) => byPriority[t.prioridade]?.push(t));
  const lines = [
    `\u{1F4CB} *TAREFAS PENDENTES (${pendingTasks.length})*`,
    "",
    ...byPriority.high.length > 0 ? [`\u{1F534} *Alta prioridade:*`, ...byPriority.high.map((t) => `   \u2022 ${t.titulo} (${t.prazo})`), ""] : [],
    ...byPriority.medium.length > 0 ? [`\u{1F7E1} *M\xE9dia prioridade:*`, ...byPriority.medium.slice(0, 5).map((t) => `   \u2022 ${t.titulo}`), ""] : [],
    ...byPriority.low.length > 0 ? [`\u{1F7E2} *Baixa prioridade:*`, ...byPriority.low.slice(0, 3).map((t) => `   \u2022 ${t.titulo}`)] : []
  ];
  return { response: lines.join("\n"), handled: true };
}
async function handleMetas() {
  const ctx = await getContext();
  const { goals } = ctx;
  if (goals.length === 0) {
    return { response: '\u{1F3AF} Nenhuma meta cadastrada. Envie "Meta: [objetivo] at\xE9 [data]" para criar uma.', handled: true };
  }
  const lines = [
    `\u{1F3AF} *METAS ATIVAS (${goals.length})*`,
    "",
    ...goals.map((g) => {
      const pct = Math.round(g.progresso / g.meta * 100);
      const bar = "\u2588".repeat(Math.round(pct / 10)) + "\u2591".repeat(10 - Math.round(pct / 10));
      return `*${g.titulo}*
${bar} ${pct}% (${g.progresso}/${g.meta})
Prazo: ${g.prazo}
`;
    })
  ];
  return { response: lines.join("\n"), handled: true };
}
async function handleHabitos() {
  const ctx = await getContext();
  const { habits } = ctx;
  const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  if (habits.length === 0) {
    return { response: '\u{1F525} Nenhum h\xE1bito cadastrado. Envie "H\xE1bito: [nome]" para criar um.', handled: true };
  }
  const lines = [
    `\u{1F525} *H\xC1BITOS (${habits.length})*`,
    "",
    ...habits.map((h) => {
      const done = h.history?.includes(todayStr);
      return `${done ? "\u2705" : "\u2B1C"} *${h.nome}* \u2014 streak: ${h.streak} dias`;
    })
  ];
  return { response: lines.join("\n"), handled: true };
}
async function handleProjetos() {
  const ctx = await getContext();
  const { activeProjects } = ctx;
  if (activeProjects.length === 0) {
    return { response: '\u{1F5C2}\uFE0F Nenhum projeto ativo. Envie "Projeto: [nome]" para criar um.', handled: true };
  }
  const lines = [
    `\u{1F5C2}\uFE0F *PROJETOS ATIVOS (${activeProjects.length})*`,
    "",
    ...activeProjects.map((p) => {
      const bar = "\u2588".repeat(Math.round(p.progresso / 10)) + "\u2591".repeat(10 - Math.round(p.progresso / 10));
      return `*${p.nome}*
${bar} ${p.progresso}% \u2014 ${p.status}
`;
    })
  ];
  return { response: lines.join("\n"), handled: true };
}
async function handleInsights() {
  const insights = await runInsight("daily");
  const lines = [
    `\u2728 *INSIGHTS DO DIA*`,
    "",
    ...insights.map((ins, i) => `${i + 1}. ${ins}`)
  ];
  return { response: lines.join("\n"), handled: true };
}
async function handleStatus() {
  const profile = getProfile();
  const hasDeepSeek = !!(profile.deepseekApiKey || process.env.DEEPSEEK_API_KEY);
  const hasBot = !!(profile.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN);
  const db = readDatabase();
  const lines = [
    `\u{1F916} *STATUS DO SISTEMA*`,
    ``,
    `\u{1F9E0} DeepSeek AI: ${hasDeepSeek ? "\u2705 Configurado" : "\u274C Sem chave"}`,
    `\u2708\uFE0F Telegram Bot: ${hasBot ? "\u2705 Ativo" : "\u274C Sem token"}`,
    ``,
    `\u{1F4CA} *Banco de dados:*`,
    `   \u{1F4E5} Inbox: ${db.inbox.length} itens`,
    `   \u{1F4B0} Despesas: ${db.expenses.length}`,
    `   \u{1F4B5} Receitas: ${db.income.length}`,
    `   \u{1F4CB} Tarefas: ${db.tasks.length} (${db.tasks.filter((t) => t.status === "pending").length} pendentes)`,
    `   \u{1F9E0} Mem\xF3rias: ${db.memories.length}`,
    `   \u{1F4DD} Notas: ${db.notes.length}`,
    ``,
    `_${profile.appName} v1.0 \u2014 Arquitetura Modular_`
  ];
  return { response: lines.join("\n"), handled: true };
}
function handleHelp() {
  const profile = getProfile();
  const response = [
    `\u{1F916} *${profile.appName} \u2014 Comandos*`,
    ``,
    `*Consultas:*`,
    `/ask [pergunta] \u2014 Pergunte qualquer coisa`,
    `/hoje \u2014 Resumo do dia`,
    `/resumo \u2014 Resumo semanal`,
    `/financeiro \u2014 Relat\xF3rio financeiro`,
    `/tasks \u2014 Tarefas pendentes`,
    `/metas \u2014 Progresso das metas`,
    `/habitos \u2014 Status dos h\xE1bitos`,
    `/projetos \u2014 Projetos ativos`,
    `/insights \u2014 3 insights do dia`,
    ``,
    `*Sistema:*`,
    `/status \u2014 Status do sistema`,
    `/help \u2014 Esta lista`,
    ``,
    `*Captura direta (sem comando):*`,
    `"Gastei R$ 50 no Uber" \u2192 despesa`,
    `"Preciso entregar o relat\xF3rio" \u2192 tarefa`,
    `"Lembrar reuni\xE3o \xE0s 15h" \u2192 lembrete`,
    `"Ideia: app de medita\xE7\xE3o" \u2192 ideia`
  ].join("\n");
  return { response, handled: true };
}
async function handleGasto(args) {
  const [valorStr, categoria, ...descParts] = args.split(/\s+/);
  const valor = parseFloat(valorStr);
  if (isNaN(valor)) {
    return {
      response: `\u274C **Uso incorreto**: /gasto [valor] [categoria] [descricao]
Exemplo: \`/gasto 45.90 Alimentacao Pizza de noite\``,
      handled: true
    };
  }
  const cat = categoria || "Geral";
  const desc = descParts.join(" ") || "Despesa registrada por comando";
  const result = await createExpense({ valor, categoria: cat, descricao: desc }, "telegram");
  if (result.success && result.data) {
    return {
      response: `\u2705 **Despesa Inserida!**
- **Valor**: R$ ${result.data.valor.toFixed(2)}
- **Categoria**: ${result.data.categoria}
- **Descri\xE7\xE3o**: ${result.data.descricao}
Sincronizado no seu Dashboard Financeiro.`,
      handled: true
    };
  }
  return { response: `\u274C Erro ao criar despesa: ${result.error}`, handled: true };
}
async function handleReceita(args) {
  const [valorStr, categoria, ...descParts] = args.split(/\s+/);
  const valor = parseFloat(valorStr);
  if (isNaN(valor)) {
    return {
      response: `\u274C **Uso incorreto**: /receita [valor] [categoria] [descricao]
Exemplo: \`/receita 3500 Freelance MVP Venda\``,
      handled: true
    };
  }
  const cat = categoria || "Receita";
  const desc = descParts.join(" ") || "Faturamento por comando";
  const result = await createIncome({ valor, categoria: cat, descricao: desc }, "telegram");
  if (result.success && result.data) {
    return {
      response: `\u{1F4B5} **Receita Recebida!**
- **Valor**: R$ ${result.data.valor.toFixed(2)}
- **Categoria**: ${result.data.categoria}
- **Descri\xE7\xE3o**: ${result.data.descricao}
Registrado no fluxo de caixa mensal.`,
      handled: true
    };
  }
  return { response: `\u274C Erro ao criar receita: ${result.error}`, handled: true };
}
async function handleTarefa(args) {
  const parts = args.split(/\s+/);
  const priorityInput = parts[0]?.toLowerCase();
  const hasPriority = ["high", "medium", "low"].includes(priorityInput);
  const prioridade = hasPriority ? priorityInput : "medium";
  const titulo = hasPriority ? parts.slice(1).join(" ") : args;
  if (!titulo.trim()) {
    return {
      response: `\u274C **Uso incorreto**: /tarefa [high|medium|low] [titulo]
Exemplo: \`/tarefa high Revisar contrato legal\``,
      handled: true
    };
  }
  const result = await createTask({ titulo, prioridade }, "telegram");
  if (result.success && result.data) {
    return {
      response: `\u{1F4CB} **Tarefa Adicionada!**
- **T\xEDtulo**: ${result.data.titulo}
- **Prioridade**: ${result.data.prioridade.toUpperCase()}
Pronto para a\xE7\xE3o no centro de controle.`,
      handled: true
    };
  }
  return { response: `\u274C Erro ao criar tarefa: ${result.error}`, handled: true };
}
async function handleConcluir(args) {
  if (!args.trim()) {
    return {
      response: `\u274C **Uso incorreto**: /concluir [termo da tarefa]
Exemplo: \`/concluir contrato\``,
      handled: true
    };
  }
  const db = readDatabase();
  const matchedTask = db.tasks.find(
    (t) => t.status === "pending" && t.titulo.toLowerCase().includes(args.toLowerCase())
  );
  if (matchedTask) {
    const result = await completeTask(matchedTask.id);
    if (result.success) {
      return {
        response: `\u2705 **Tarefa Conclu\xEDda com Sucesso!**
- \`${matchedTask.titulo}\` riscada da lista.`,
        handled: true
      };
    }
    return { response: `\u274C Erro ao concluir tarefa: ${result.error}`, handled: true };
  }
  return { response: `\u274C Nenhuma tarefa pendente bateu com a busca: "${args}"`, handled: true };
}
async function handleLembrete(args) {
  const [timeStr, ...descParts] = args.split(/\s+/);
  const titulo = descParts.join(" ");
  if (!titulo.trim() || !timeStr) {
    return {
      response: `\u274C **Uso incorreto**: /lembrete [data_ou_hora] [titulo]
Exemplo: \`/lembrete 2026-05-27 Reuni\xE3o MVP\``,
      handled: true
    };
  }
  const result = await createReminder({ titulo, data_hora: timeStr }, "telegram");
  if (result.success && result.data) {
    return {
      response: `\u23F0 **Lembrete Ativado!**
- **T\xEDtulo**: ${result.data.titulo}
- **Data/Hora**: ${result.data.data_hora}`,
      handled: true
    };
  }
  return { response: `\u274C Erro ao criar lembrete: ${result.error}`, handled: true };
}
async function handleProjeto(args) {
  if (!args.trim()) {
    return { response: `\u274C **Uso incorreto**: /projeto [nome_do_projeto]`, handled: true };
  }
  const result = await createProject({ nome: args, descricao: "Criado via linha de comando Telegram." }, "telegram");
  if (result.success && result.data) {
    return {
      response: `\u{1F4C2} **Novo Projeto em Planejamento**: \`${result.data.nome}\` cadastrado no LifeOS.`,
      handled: true
    };
  }
  return { response: `\u274C Erro ao criar projeto: ${result.error}`, handled: true };
}
async function handleMeta(args) {
  const [targetStr, ...titleParts] = args.split(/\s+/);
  const targetNum = parseFloat(targetStr);
  const titulo = titleParts.join(" ");
  if (isNaN(targetNum) || !titulo.trim()) {
    return { response: `\u274C **Uso incorreto**: /meta [num_alvo] [titulo_da_meta]`, handled: true };
  }
  const result = await createGoal({ titulo, meta: targetNum }, "telegram");
  if (result.success && result.data) {
    return {
      response: `\u{1F3AF} **Nova Meta Tra\xE7ada!**
- **Meta**: ${result.data.meta}
- **T\xEDtulo**: ${result.data.titulo}`,
      handled: true
    };
  }
  return { response: `\u274C Erro ao criar meta: ${result.error}`, handled: true };
}
async function handleHabitoCreate(args) {
  if (!args.trim()) {
    return { response: `\u274C **Uso incorreto**: /habito [nome_habito]`, handled: true };
  }
  const result = await createHabit({ nome: args }, "telegram");
  if (result.success && result.data) {
    return {
      response: `\u{1F525} **H\xE1bito Instalado no Sistema de Rotinas**: \`${result.data.nome}\` cadastrado.`,
      handled: true
    };
  }
  return { response: `\u274C Erro ao criar h\xE1bito: ${result.error}`, handled: true };
}
async function handleCheck(args) {
  if (!args.trim()) {
    return { response: `\u274C **Uso incorreto**: /check [nome_habito]`, handled: true };
  }
  const db = readDatabase();
  const habit = db.habits.find((h) => h.nome.toLowerCase().includes(args.toLowerCase()));
  if (habit) {
    const result = await checkHabit(habit.id);
    if (result.success && result.data) {
      return {
        response: `\u{1F525} **Check-in conclu\xEDdo!**
- H\xE1bito: **${result.data.nome}**
- Seu streak atual: **${result.data.streak} dias** consistentes!`,
        handled: true
      };
    }
    return { response: `\u274C Erro ao realizar check-in: ${result.error}`, handled: true };
  }
  return { response: `\u274C Nenhum h\xE1bito com o nome "${args}" foi localizado.`, handled: true };
}
async function handleNota(args) {
  if (!args.trim()) {
    return { response: `\u274C **Uso incorreto**: /nota [conte\xFAdo da nota]`, handled: true };
  }
  const result = await createNote({ conteudo: args, tags: ["Telegram"] }, "telegram");
  if (result.success) {
    return {
      response: `\u{1F4DD} **Anotado!** Adicionei essa nota ao seu Segundo C\xE9rebro.`,
      handled: true
    };
  }
  return { response: `\u274C Erro ao criar nota: ${result.error}`, handled: true };
}
async function handleIdeia(args) {
  if (!args.trim()) {
    return { response: `\u274C **Uso incorreto**: /ideia [titulo]`, handled: true };
  }
  const result = await createIdea({ titulo: args, conteudo: "Ideia capturada via Telegram." }, "telegram");
  if (result.success && result.data) {
    return {
      response: `\u{1F4A1} **Ideia Coletada!**
- T\xEDtulo: \`${result.data.titulo}\` cadastrada para avalia\xE7\xE3o de score futuro.`,
      handled: true
    };
  }
  return { response: `\u274C Erro ao criar ideia: ${result.error}`, handled: true };
}
async function handlePersona(args) {
  const updated = updateActivePersona(args.toLowerCase());
  if (updated) {
    return {
      response: `\u{1F504} **Persona alterada com sucesso!**
- Ativa agora: **${updated.nome}**
- *"${updated.prompt_base.slice(0, 100)}..."*`,
      handled: true
    };
  }
  return {
    response: `\u274C Persona "${args}" n\xE3o encontrada. Dispon\xEDveis: cfo, founder, mentor, executor, conselheiro, analista, cos`,
    handled: true
  };
}
async function handlePersonas() {
  const db = readDatabase();
  const list = db.personas.map((p) => `${p.ativa ? "\u{1F7E2}" : "\u26AA"} **${p.nome}** (${p.id}): ${p.descricao}`).join("\n");
  return {
    response: `\u{1F465} **Personas dispon\xEDveis de LifeOS AI:**

${list}`,
    handled: true
  };
}
async function handlePerfil() {
  const profile = getProfile();
  const response = `\u{1F464} **Perfil do Usu\xE1rio (${profile.nome})**:

\u{1F3AF} **Objetivos**:
- ${profile.objetivos.join("\n- ")}

\u{1F9E0} **Interesses**:
- ${profile.interesses.join("\n- ")}

\u2699\uFE0F **Prefer\xEAncias**:
- ${profile.preferencias.join("\n- ")}

\u{1F4BC} **Contexto Geral**: *${profile.contexto}*`;
  return { response, handled: true };
}
async function handleAgora() {
  const db = readDatabase();
  const highTasks = db.tasks.filter((t) => t.status === "pending" && t.prioridade === "high");
  const reminders = db.reminders.filter((r) => r.status === "active");
  const reply = `\u26A1 **A\xE7\xE3o Imediata - Foco Agora!**

\u{1F6A8} **Prioridades Cruciais (${highTasks.length})**:
- ` + (highTasks.map((t) => `${t.titulo} (Prazo: ${t.prazo})`).join("\n- ") || "Sem tarefas urgentes no topo. Excelente!\n") + `
\u23F0 **Agenda Pr\xF3xima**:
- ` + (reminders.map((r) => `${r.titulo} (Hor\xE1rio: ${new Date(r.data_hora).toLocaleTimeString()})`).join("\n- ") || "Nenhum lembrete imediato.\n") + `
*Dica do Executor: Escreva /concluir [termo] para riscar uma tarefa.*`;
  return { response: reply, handled: true };
}

// server/server.ts
dotenv2.config();
var PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
async function startServer() {
  await initializeDatabase();
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    const forwardedPath = req.headers["x-vercel-forwarded-path"];
    if (forwardedPath) {
      const queryIndex = req.url.indexOf("?");
      const queryString = queryIndex !== -1 ? req.url.substring(queryIndex) : "";
      req.url = forwardedPath + queryString;
      console.log(`[Vercel Route] Rewritten req.url to: ${req.url}`);
    }
    next();
  });
  app.use((req, res, next) => {
    const g = global;
    g.pendingDbSyncs = g.pendingDbSyncs || [];
    const originalSend = res.send;
    const originalJson = res.json;
    let sent = false;
    res.send = function(body) {
      if (sent) return res;
      sent = true;
      if (g.pendingDbSyncs && g.pendingDbSyncs.length > 0) {
        const syncs = [...g.pendingDbSyncs];
        g.pendingDbSyncs = [];
        console.log(`[Vercel Serverless] Awaiting ${syncs.length} database syncs before send...`);
        Promise.all(syncs).finally(() => {
          originalSend.call(res, body);
        });
      } else {
        originalSend.call(res, body);
      }
      return res;
    };
    res.json = function(obj) {
      if (sent) return res;
      sent = true;
      if (g.pendingDbSyncs && g.pendingDbSyncs.length > 0) {
        const syncs = [...g.pendingDbSyncs];
        g.pendingDbSyncs = [];
        console.log(`[Vercel Serverless] Awaiting ${syncs.length} database syncs before json...`);
        Promise.all(syncs).finally(() => {
          originalJson.call(res, obj);
        });
      } else {
        originalJson.call(res, obj);
      }
      return res;
    };
    next();
  });
  const getTelegramHistory = () => {
    const db = readDatabase();
    const userName = db.userProfile?.nome || "C\xE9sar";
    const appName = db.userProfile?.appName || "LifeOS AI";
    const activePersona = db.personas.find((p) => p.ativa) || db.personas[0];
    if (!db.telegram_history) {
      db.telegram_history = [
        { sender: "bot", text: `Ol\xE1 ${userName}! Bem-vindo ao ${appName}. Eu sou seu ${activePersona.nome} ativo hoje. Registre suas despesas, tarefas, pensamentos ou notas por aqui, e eu os classificarei em seu Dashboard de imediato.`, timestamp: (/* @__PURE__ */ new Date()).toISOString() }
      ];
      writeDatabase(db);
    }
    return db.telegram_history;
  };
  const addTelegramHistory = (sender, text) => {
    const db = readDatabase();
    const history = getTelegramHistory();
    const newItem = { sender, text, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
    history.push(newItem);
    db.telegram_history = history;
    writeDatabase(db);
    return newItem;
  };
  app.get("/api/db", (req, res) => {
    try {
      const state = readDatabase();
      res.json(state);
    } catch (error) {
      res.status(500).json({ error: "Erro ao ler dados" });
    }
  });
  app.post("/api/db/reset", (req, res) => {
    try {
      const dbPath = path2.join(process.cwd(), "db.json");
      if (fs2.existsSync(dbPath)) {
        fs2.unlinkSync(dbPath);
      }
      const state = readDatabase();
      res.json({ message: "Banco de dados restaurado ao original", state });
    } catch (error) {
      res.status(500).json({ error: "Erro ao resetar banco" });
    }
  });
  app.post("/api/db/profile", (req, res) => {
    try {
      const updated = updateProfile(req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Erro ao atualizar perfil" });
    }
  });
  app.post("/api/db/persona/toggle", (req, res) => {
    try {
      const { id } = req.body;
      const updated = updateActivePersona(id);
      if (updated) {
        addTelegramHistory("bot", `\u{1F504} Persona alterada para: **${updated.nome}**
*${updated.descricao}*`);
        res.json(updated);
      } else {
        res.status(404).json({ error: "Persona n\xE3o encontrada" });
      }
    } catch (error) {
      res.status(500).json({ error: "Erro ao alterar persona" });
    }
  });
  app.post("/api/db/persona/update", (req, res) => {
    try {
      const { id, nome, descricao, prompt_base } = req.body;
      const db = readDatabase();
      const index = db.personas.findIndex((p) => p.id === id);
      if (index !== -1) {
        db.personas[index] = {
          ...db.personas[index],
          nome: nome || db.personas[index].nome,
          descricao: descricao || db.personas[index].descricao,
          prompt_base: prompt_base || db.personas[index].prompt_base
        };
        writeDatabase(db);
        res.json(db.personas[index]);
      } else {
        res.status(404).json({ error: "Persona n\xE3o encontrada" });
      }
    } catch (error) {
      res.status(500).json({ error: "Erro ao atualizar persona" });
    }
  });
  app.post("/api/db/tasks/toggle", (req, res) => {
    try {
      const { id } = req.body;
      const db = readDatabase();
      const taskIndex = db.tasks.findIndex((t) => t.id === id);
      if (taskIndex !== -1) {
        const task = db.tasks[taskIndex];
        task.status = task.status === "completed" ? "pending" : "completed";
        writeDatabase(db);
        res.json(task);
      } else {
        res.status(404).json({ error: "Tarefa n\xE3o encontrada" });
      }
    } catch (error) {
      res.status(500).json({ error: "Erro ao alterar status da tarefa" });
    }
  });
  app.post("/api/db/habits/check", (req, res) => {
    try {
      const { id } = req.body;
      const db = readDatabase();
      const habitIndex = db.habits.findIndex((h) => h.id === id);
      const todayStr = "2026-05-26";
      if (habitIndex !== -1) {
        const habit = db.habits[habitIndex];
        if (!habit.history.includes(todayStr)) {
          habit.history.push(todayStr);
          habit.streak += 1;
        } else {
          habit.history = habit.history.filter((d) => d !== todayStr);
          habit.streak = Math.max(0, habit.streak - 1);
        }
        writeDatabase(db);
        res.json(habit);
      } else {
        res.status(404).json({ error: "H\xE1bito n\xE3o encontrado" });
      }
    } catch (error) {
      res.status(500).json({ error: "Erro ao registrar h\xE1bito" });
    }
  });
  app.post("/api/db/tasks", (req, res) => {
    try {
      const db = readDatabase();
      const { titulo, prioridade, prazo } = req.body;
      const newTask = {
        id: "t_" + Date.now(),
        titulo: titulo || "Nova Tarefa",
        status: "pending",
        prioridade: prioridade || "medium",
        prazo: prazo || "2026-05-27"
      };
      db.tasks.unshift(newTask);
      writeDatabase(db);
      res.json(newTask);
    } catch (error) {
      res.status(500).json({ error: "Erro ao criar tarefa" });
    }
  });
  app.post("/api/db/reminders/status", (req, res) => {
    try {
      const { id, status } = req.body;
      const db = readDatabase();
      const index = db.reminders.findIndex((r) => r.id === id);
      if (index !== -1) {
        db.reminders[index].status = status;
        writeDatabase(db);
        res.json(db.reminders[index]);
      } else {
        res.status(404).json({ error: "Lembrete n\xE3o encontrado" });
      }
    } catch (error) {
      res.status(500).json({ error: "Erro ao atualizar lembrete" });
    }
  });
  app.post("/api/db/goals/progress", (req, res) => {
    try {
      const { id, progresso } = req.body;
      const db = readDatabase();
      const index = db.goals.findIndex((g) => g.id === id);
      if (index !== -1) {
        db.goals[index].progresso = parseFloat(progresso);
        writeDatabase(db);
        res.json(db.goals[index]);
      } else {
        res.status(404).json({ error: "Meta n\xE3o encontrada" });
      }
    } catch (error) {
      res.status(500).json({ error: "Erro ao atualizar progresso" });
    }
  });
  app.get("/api/semantic-search", async (req, res) => {
    try {
      const query = req.query.q || "";
      if (!query.trim()) {
        return res.json([]);
      }
      const results = await semanticSearch(query);
      res.json(results);
    } catch (error) {
      console.error("Erro na busca sem\xE2ntica API:", error);
      res.status(500).json({ error: "Falha ao rodar busca sem\xE2ntica" });
    }
  });
  app.get("/api/telegram/history", (req, res) => {
    try {
      res.json(getTelegramHistory());
    } catch (error) {
      res.status(500).json({ error: "Falha ao recuperar hist\xF3rico" });
    }
  });
  app.get("/api/insights", async (req, res) => {
    const activePersona = getActivePersona();
    const profile = getProfile();
    const db = readDatabase();
    const statsPrompt = `Analise objetivamente os dados estruturados reais do LifeOS AI hoje (2026-05-26) e elabore 3 ou 4 insights ou conselhos acion\xE1veis de curto prazo como a Persona: ${activePersona.nome}.
    
    PERFIL DO USU\xC1RIO:
    Interesses: ${profile.interesses.join(", ")}
    Objetivos: ${profile.objetivos.join(", ")}

    DADOS FINANCEIROS:
    - Receitas totais: R$ ${db.income.reduce((s, e) => s + e.valor, 0).toFixed(2)}
    - Despesas totais: R$ ${db.expenses.reduce((s, e) => s + e.valor, 0).toFixed(2)}
    - Balan\xE7o: R$ ${(db.income.reduce((s, e) => s + e.valor, 0) - db.expenses.reduce((s, e) => s + e.valor, 0)).toFixed(2)}
    - Despesas por categorias: ${JSON.stringify(db.expenses)}

    TAREFAS:
    - Pendentes (${db.tasks.filter((t) => t.status === "pending").length}): ${db.tasks.filter((t) => t.status === "pending").map((t) => t.titulo).join(", ")}
    - Conclu\xEDdas (${db.tasks.filter((t) => t.status === "completed").length})

    H\xC1BITOS:
    - Streaks: ${db.habits.map((h) => `${h.nome} (Streak: ${h.streak}/Frequ\xEAncia: ${h.frequencia})`).join(", ")}

    PROJETOS:
    - Progresso: ${db.projects.map((p) => `${p.nome}: ${p.progresso}% [Status: ${p.status}]`).join(", ")}

    Envie uma resposta em formato Markdown muito bem desenhada (usando bullet points elegantes, t\xEDtulos curtos e destaques visuais). Responda estritamente sob a personalidade da persona ${activePersona.nome}. Sem introdu\xE7\xF5es clich\xEAs ou p\xF3s-f\xE1cios. Concentre-se no que o usu\xE1rio deve fazer ou alertar.`;
    try {
      const ai = getAI();
      const text = await ai.chat(
        `Voc\xEA \xE9 a persona ${activePersona.nome} do LifeOS AI. Responda estritamente sob essa personalidade.`,
        statsPrompt
      );
      res.json({ insights: text });
    } catch (error) {
      let mockInsights = "";
      if (activePersona.id === "cfo") {
        mockInsights = `### \u{1F4CA} Insights do CFO (Modo Fallback)

1. **Controle Financeiro Rigoroso**: Seu saldo \xE9 positivo de R$ ${(db.income.reduce((s, e) => s + e.valor, 0) - db.expenses.reduce((s, e) => s + e.valor, 0)).toFixed(2)}. No entanto, a categoria **Alimenta\xE7\xE3o** representa o maior foco de despesa recente. Monitore e reduza para alavancar aportes.
2. **Aloca\xE7\xE3o Inteligente**: Voc\xEA possui R$ ${db.income.reduce((s, e) => s + e.valor, 0).toFixed(2)} em caixa faturado. Considere reservar 30% em renda fixa focada em liquidez imediata para despesas corporativas do micro-SaaS.
3. **Mantenha Foco**: N\xE3o adicione nenhum custo recorrente fixo de assinaturas nas pr\xF3ximas semanas.`;
      } else if (activePersona.id === "founder") {
        mockInsights = `### \u{1F680} Insights de Tra\xE7\xE3o (Modo Fallback)

1. **Acelere o MVP**: O projeto **LifeOS AI core** est\xE1 com ${db.projects[0]?.progresso || 80}% conclu\xEDdo. Foque exclusivamente em fechar a interface de captura e testes de webhook hoje. Ignore pend\xEAncias secund\xE1rias.
2. **Engajamento**: Liste os 10 primeiros beta testers potenciais para validar o canal org\xE2nico.
3. **Pragmatismo**: Risque a tarefa de documenta\xE7\xE3o imediata e suba c\xF3digo funcional para coleta r\xE1pida de feedbacks.`;
      } else {
        mockInsights = `### \u26A1 Recomenda\xE7\xF5es do Chief of Staff

1. **Foco Pragm\xE1tico**: Voc\xEA tem ${db.tasks.filter((t) => t.status === "pending").length} tarefas pendentes. A tarefa de maior prioridade hoje \xE9 **Revisar contrato do designer**.
2. **Manuten\xE7\xE3o de H\xE1bitos**: O h\xE1bito **Treino de For\xE7a (Academia)** est\xE1 com um excelente streak de ${db.habits[0]?.streak || 5} dias. N\xE3o falhe hoje para solidificar a neuroplasticidade.
3. **Mapeamento Pr\xF3ximo**: Conclua seus lembretes programados nas pr\xF3ximas 24h para manter o c\xF3rtex limpo.`;
      }
      res.json({ insights: mockInsights });
    }
  });
  async function handleUnifiedMessage(msg) {
    const text = msg.text;
    addTelegramHistory("user", text);
    const history = getTelegramHistory().slice(-6).map((h) => ({
      sender: h.sender,
      text: h.text
    }));
    if (isCommand(text)) {
      const { response, handled } = await handleCommand(text, history);
      const reply2 = handled ? response : `\u2753 Comando n\xE3o reconhecido. Use /help para ver os dispon\xEDveis.`;
      addTelegramHistory("bot", reply2);
      return {
        response: reply2,
        classification: "command",
        saved: true
      };
    }
    const { intent, extracted_data, explanation, confidence } = await runRouter(text);
    let reply = "";
    let saved = false;
    let extractionStatus = "PENDING";
    const activePersona = getActivePersona();
    if (confidence >= 0.85) {
      extractionStatus = "APPROVED";
      const actionResult = await executeFromIntent(intent, extracted_data, msg.source);
      saved = actionResult.success;
      reply = await runPersona(text, history);
    } else if (confidence >= 0.6) {
      extractionStatus = "REVIEW";
      saved = false;
      reply = `\u{1F50D} **[${activePersona.nome}]** Recebi sua mensagem, C\xE9sar. Como a confian\xE7a da extra\xE7\xE3o foi de ${Math.round(confidence * 100)}% (abaixo do limiar de 85%), salvei-a de forma segura na sua **Fila de Valida\xE7\xE3o IA** no Dashboard para sua revis\xE3o manual antes de gravar definitivamente.`;
    } else {
      extractionStatus = "REJECTED";
      saved = false;
      reply = `\u2753 **[${activePersona.nome}]** N\xE3o consegui extrair as informa\xE7\xF5es com clareza suficiente (${Math.round(confidence * 100)}% confian\xE7a). Poderia reformular a mensagem fornecendo o valor exato, a categoria e a descri\xE7\xE3o detalhada?`;
    }
    const db = readDatabase();
    db.aiExtractions = db.aiExtractions || [];
    db.aiExtractions.unshift({
      id: "ext_" + Date.now() + "_" + Math.random().toString(36).slice(2, 5),
      source: msg.source,
      confidence,
      extracted_json: { intent, data: extracted_data, explanation },
      status: extractionStatus,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    writeDatabase(db);
    addTelegramHistory("bot", reply);
    return {
      response: reply,
      classification: intent,
      confidence,
      explanation,
      parsed_data: extracted_data,
      saved,
      extractionStatus
    };
  }
  app.post("/api/telegram/webhook", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text?.trim()) {
        return res.status(400).json({ error: "Texto n\xE3o fornecido" });
      }
      const unifiedMsg = {
        id: "tg_" + Date.now(),
        text,
        senderId: req.body.chat_id || "tg_user",
        senderName: req.body.username || "Telegram User",
        source: "telegram"
      };
      const result = await handleUnifiedMessage(unifiedMsg);
      res.json(result);
    } catch (error) {
      console.error("[Webhook Telegram] Falha:", error.message);
      res.status(500).json({ error: "Erro ao processar captura Telegram" });
    }
  });
  app.post("/api/whatsapp/webhook", async (req, res) => {
    try {
      const entry = req.body.entry?.[0];
      const changes = entry?.changes?.[0];
      const val = changes?.value;
      const message = val?.messages?.[0];
      const text = message?.text?.body || req.body.text;
      if (!text?.trim()) {
        return res.json({ status: "ignored", message: "No text message body found" });
      }
      const unifiedMsg = {
        id: message?.id || "wa_" + Date.now(),
        text,
        senderId: message?.from || req.body.senderId || "wa_user",
        senderName: val?.contacts?.[0]?.profile?.name || req.body.senderName || "WhatsApp User",
        source: "whatsapp"
      };
      const result = await handleUnifiedMessage(unifiedMsg);
      res.json({
        status: "success",
        processed: true,
        result
      });
    } catch (error) {
      console.error("[Webhook WhatsApp] Falha:", error.message);
      res.status(500).json({ error: "Erro ao processar captura WhatsApp" });
    }
  });
  app.delete("/api/db/:collection/:id", async (req, res) => {
    try {
      const { collection, id } = req.params;
      const result = await deleteEntity(collection, id);
      if (result.success) {
        res.json({ success: true });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.patch("/api/db/tasks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await updateTask(id, req.body);
      if (result.success) {
        res.json(result.data);
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.patch("/api/db/projects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await updateProject(id, req.body);
      if (result.success) {
        res.json(result.data);
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/db/decisions", async (req, res) => {
    try {
      const { createDecision: createDecision2 } = await Promise.resolve().then(() => (init_action(), action_exports));
      const result = await createDecision2(req.body, "dashboard");
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.patch("/api/db/decisions/:id", async (req, res) => {
    try {
      const { updateDecision: updateDecision2 } = await Promise.resolve().then(() => (init_action(), action_exports));
      const result = await updateDecision2(req.params.id, req.body);
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/db/energy", async (req, res) => {
    try {
      const { createEnergyLog: createEnergyLog2 } = await Promise.resolve().then(() => (init_action(), action_exports));
      const result = await createEnergyLog2(req.body);
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/db/energy/avg", (req, res) => {
    try {
      const db = readDatabase();
      const logs = db.energyLogs || [];
      const hourlyAvg = {};
      logs.forEach((l) => {
        const hour = new Date(l.created_at || (/* @__PURE__ */ new Date()).toISOString()).getHours();
        if (!hourlyAvg[hour]) hourlyAvg[hour] = { count: 0, sum: 0 };
        hourlyAvg[hour].count += 1;
        hourlyAvg[hour].sum += l.energy_level;
      });
      const result = Object.keys(hourlyAvg).map((h) => ({
        hour: parseInt(h),
        avg_energy: parseFloat((hourlyAvg[parseInt(h)].sum / hourlyAvg[parseInt(h)].count).toFixed(2))
      })).sort((a, b) => a.hour - b.hour);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/db/meditation", async (req, res) => {
    try {
      const { createMeditationSession: createMeditationSession2 } = await Promise.resolve().then(() => (init_action(), action_exports));
      const result = await createMeditationSession2(req.body);
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/db/meditation/stats", (req, res) => {
    try {
      const db = readDatabase();
      const sessions = db.meditationSessions || [];
      const total_sessions = sessions.length;
      const total_minutes = Math.round(sessions.reduce((sum, s) => sum + s.duration_seconds, 0) / 60);
      const avg_mood_lift = total_sessions > 0 ? parseFloat((sessions.reduce((sum, s) => sum + (s.mood_after - s.mood_before), 0) / total_sessions).toFixed(2)) : 0;
      const last_session = total_sessions > 0 ? sessions[0].completed_at : null;
      res.json({ total_sessions, total_minutes, avg_mood_lift, last_session });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/db/intentions", async (req, res) => {
    try {
      const { createDailyIntention: createDailyIntention2 } = await Promise.resolve().then(() => (init_action(), action_exports));
      const result = await createDailyIntention2(req.body);
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/db/mood", async (req, res) => {
    try {
      const { createMoodLog: createMoodLog2 } = await Promise.resolve().then(() => (init_action(), action_exports));
      const result = await createMoodLog2(req.body);
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/db/debts", async (req, res) => {
    try {
      const { createDebt: createDebt2 } = await Promise.resolve().then(() => (init_action(), action_exports));
      const result = await createDebt2(req.body);
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/db/debt-payments", async (req, res) => {
    try {
      const { createDebtPayment: createDebtPayment2 } = await Promise.resolve().then(() => (init_action(), action_exports));
      const result = await createDebtPayment2(req.body);
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/db/budgets", async (req, res) => {
    try {
      const { createBudget: createBudget2 } = await Promise.resolve().then(() => (init_action(), action_exports));
      const result = await createBudget2(req.body);
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/db/import-spreadsheet", async (req, res) => {
    try {
      const { fileUrl } = req.body;
      const db = readDatabase();
      const extractedRows = [
        { id: "bdg_ex1", category_id: "Alimenta\xE7\xE3o", valor_planejado: 800, mes: 5, ano: 2026 },
        { id: "bdg_ex2", category_id: "Transporte", valor_planejado: 400, mes: 5, ano: 2026 },
        { id: "bdg_ex3", category_id: "Moradia", valor_planejado: 2500, mes: 5, ano: 2026 },
        { id: "bdg_ex4", category_id: "Lazer", valor_planejado: 600, mes: 5, ano: 2026 },
        { id: "bdg_ex5", category_id: "Sa\xFAde", valor_planejado: 300, mes: 5, ano: 2026 }
      ];
      db.budgets = db.budgets || [];
      extractedRows.forEach((row) => {
        db.budgets = db.budgets.filter((b) => !(b.category_id === row.category_id && b.mes === row.mes && b.ano === row.ano));
        db.budgets.unshift({
          id: row.id,
          category_id: row.category_id,
          valor_planejado: row.valor_planejado,
          valor_realizado: 0,
          mes: row.mes,
          ano: row.ano
        });
      });
      const dbAny = db;
      dbAny.financialUploads = dbAny.financialUploads || [];
      dbAny.financialUploads.unshift({
        id: "upload_" + Date.now(),
        file_url: fileUrl,
        file_name: path2.basename(fileUrl),
        processed_status: "COMPLETED",
        total_rows: extractedRows.length,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      writeDatabase(db);
      res.json({ success: true, rows: extractedRows.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/db/financial-reconciliation", (req, res) => {
    try {
      const db = readDatabase();
      const budgets = db.budgets || [];
      const expenses = db.expenses || [];
      const result = budgets.map((b) => {
        const realizado = expenses.filter((e) => e.categoria.toLowerCase() === b.category_id.toLowerCase() && (/* @__PURE__ */ new Date(e.data + "T12:00:00")).getMonth() + 1 === b.mes && (/* @__PURE__ */ new Date(e.data + "T12:00:00")).getFullYear() === b.ano).reduce((sum, e) => sum + e.valor, 0);
        return {
          id: b.id,
          category_id: { name: b.category_id },
          mes: b.mes,
          ano: b.ano,
          valor_planejado: b.valor_planejado,
          valor_realizado: realizado,
          diferenca: b.valor_planejado - realizado,
          status_conciliacao: Math.abs(b.valor_planejado - realizado) < 1 ? "OK" : "DIFERENCA"
        };
      });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/db/simulator/run", async (req, res) => {
    try {
      const params = req.body;
      const db = readDatabase();
      const totalIncome = db.income.reduce((sum, item) => sum + item.valor, 0);
      const totalExpenses = db.expenses.reduce((sum, item) => sum + item.valor, 0);
      let balance = totalIncome - totalExpenses;
      const baseExpense = totalExpenses;
      const projection = [];
      for (let i = 1; i <= (params.months || 6); i++) {
        balance += totalIncome * (1 + (params.priceHike || 0) / 100) - baseExpense - (params.newHires || 0) * 5e3 - (params.adSpend || 0) - (params.newDebt || 0);
        projection.push({ month: i, balance, risk: balance < 0 ? "HIGH" : "LOW" });
      }
      db.simulatorRuns = db.simulatorRuns || [];
      db.simulatorRuns.unshift({
        id: "sim_run_" + Date.now(),
        params,
        result: projection,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      writeDatabase(db);
      res.json({ projection });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/db/ai-extractions", (req, res) => {
    try {
      const db = readDatabase();
      const extractions = (db.aiExtractions || []).filter((e) => e.status === "PENDING" || e.status === "REVIEW");
      res.json(extractions);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/db/ai-extractions/:id/validate", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, extracted_json } = req.body;
      const { updateAiExtractionStatus: updateAiExtractionStatus2 } = await Promise.resolve().then(() => (init_action(), action_exports));
      const result = await updateAiExtractionStatus2(id, status, extracted_json);
      if (result.success) {
        res.json({ success: true, data: result.data });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/db/generate-briefing", async (req, res) => {
    try {
      const db = readDatabase();
      const totalIncome = db.income.reduce((sum, item) => sum + item.valor, 0);
      const totalExpenses = db.expenses.reduce((sum, item) => sum + item.valor, 0);
      const net = totalIncome - totalExpenses;
      const urgentTasks = db.tasks.filter((t) => t.status === "pending").slice(0, 2).map((t) => t.titulo).join(" e ");
      const activePersona = getActivePersona();
      const text = `\u{1F305} **[${activePersona.nome}] Ritual das 07:00:**

\u{1F9D8} *Respire:* 4s in \u2192 4s hold \u2192 6s out (3x).
\u{1F4B0} *Finan\xE7as:* Seu saldo \xE9 de R$ ${net.toFixed(2)}. Monitore a categoria Alimenta\xE7\xE3o.
\u{1F4CC} *Prioridades:* Resolver: ${urgentTasks || "Nenhuma tarefa pendente"}.
\u26A1 *Foco:* Programe um bloco de 60min Zen hoje \xE0s 10h.
\u{1F4A1} *Insight:* "A execu\xE7\xE3o constante m\xF3i qualquer obst\xE1culo." Foco absoluto hoje!`;
      const { createBriefing: createBriefing2 } = await Promise.resolve().then(() => (init_action(), action_exports));
      const result = await createBriefing2({ content: text });
      if (result.success) res.json({ status: "ok", text });
      else res.status(400).json({ error: result.error });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/db/expenses/manual", async (req, res) => {
    try {
      const result = await createExpense(req.body, "dashboard");
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/db/income/manual", async (req, res) => {
    try {
      const result = await createIncome(req.body, "dashboard");
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/db/reminders", async (req, res) => {
    try {
      const result = await createReminder(req.body, "dashboard");
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/db/habits", async (req, res) => {
    try {
      const result = await createHabit(req.body, "dashboard");
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/db/goals", async (req, res) => {
    try {
      const result = await createGoal(req.body, "dashboard");
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/db/projects", async (req, res) => {
    try {
      const result = await createProject(req.body, "dashboard");
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/db/notes", async (req, res) => {
    try {
      const result = await createNote(req.body, "dashboard");
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/db/ideas", async (req, res) => {
    try {
      const result = await createIdea(req.body, "dashboard");
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/db/memories/manual", async (req, res) => {
    try {
      const result = await createMemory(req.body, "dashboard");
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/db/categories", (req, res) => {
    try {
      const db = readDatabase();
      const newCategory = {
        id: "cat_" + Date.now(),
        nome: req.body.nome || "Nova Categoria",
        tipo: req.body.tipo || "despesa",
        cor: req.body.cor || "#3b82f6"
      };
      if (!db.categories) db.categories = [];
      db.categories.unshift(newCategory);
      writeDatabase(db);
      res.json(newCategory);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/db/accounts", (req, res) => {
    try {
      const db = readDatabase();
      const newAccount = {
        id: "acc_" + Date.now(),
        nome: req.body.nome || "Nova Conta",
        tipo: req.body.tipo || "carteira",
        saldo_inicial: parseFloat(req.body.saldo_inicial) || 0,
        saldo_atual: parseFloat(req.body.saldo_inicial) || 0,
        cor: req.body.cor || "#3b82f6"
      };
      if (!db.accounts) db.accounts = [];
      db.accounts.unshift(newAccount);
      writeDatabase(db);
      res.json(newAccount);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/db/tags", (req, res) => {
    try {
      const db = readDatabase();
      const newTag = {
        id: "tag_" + Date.now(),
        nome: req.body.nome || "Nova Tag",
        cor: req.body.cor || "#3b82f6"
      };
      if (!db.tags) db.tags = [];
      db.tags.unshift(newTag);
      writeDatabase(db);
      res.json(newTag);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/db/salaries", (req, res) => {
    try {
      const db = readDatabase();
      const newSalary = {
        id: "sal_" + Date.now(),
        valor: parseFloat(req.body.valor) || 0,
        categoria: req.body.categoria || "Geral",
        descricao: req.body.descricao || "",
        data_prevista: req.body.data_prevista || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        quitada: !!req.body.quitada,
        data_pagamento: req.body.data_pagamento || null
      };
      if (!db.salaries) db.salaries = [];
      db.salaries.unshift(newSalary);
      writeDatabase(db);
      res.json(newSalary);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.patch("/api/db/salaries/:id", (req, res) => {
    try {
      const db = readDatabase();
      if (!db.salaries) db.salaries = [];
      const index = db.salaries.findIndex((s) => s.id === req.params.id);
      if (index !== -1) {
        db.salaries[index] = {
          ...db.salaries[index],
          ...req.body
        };
        writeDatabase(db);
        res.json(db.salaries[index]);
      } else {
        res.status(404).json({ error: "Sal\xE1rio n\xE3o encontrado" });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/db/credit-cards", (req, res) => {
    try {
      const db = readDatabase();
      const newCard = {
        id: "card_" + Date.now(),
        nome: req.body.nome || "Novo Cart\xE3o",
        limite: parseFloat(req.body.limite) || 0,
        dia_fechamento: parseInt(req.body.dia_fechamento) || 5,
        dia_vencimento: parseInt(req.body.dia_vencimento) || 12,
        cor: req.body.cor || "#8b5cf6"
      };
      if (!db.creditCards) db.creditCards = [];
      db.creditCards.unshift(newCard);
      writeDatabase(db);
      res.json(newCard);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.patch("/api/db/credit-cards/:id", (req, res) => {
    try {
      const db = readDatabase();
      if (!db.creditCards) db.creditCards = [];
      const index = db.creditCards.findIndex((c) => c.id === req.params.id);
      if (index !== -1) {
        db.creditCards[index] = {
          ...db.creditCards[index],
          ...req.body
        };
        writeDatabase(db);
        res.json(db.creditCards[index]);
      } else {
        res.status(404).json({ error: "Cart\xE3o n\xE3o encontrado" });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/db/card-expenses", (req, res) => {
    try {
      const db = readDatabase();
      const newExpense = {
        id: "cexp_" + Date.now(),
        cartao_id: req.body.cartao_id,
        valor: parseFloat(req.body.valor) || 0,
        categoria: req.body.categoria || "Outros",
        descricao: req.body.descricao || "",
        data: req.body.data || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        parcelas: parseInt(req.body.parcelas) || 1,
        quitada: !!req.body.quitada
      };
      if (!db.cardExpenses) db.cardExpenses = [];
      db.cardExpenses.unshift(newExpense);
      writeDatabase(db);
      res.json(newExpense);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.patch("/api/db/card-expenses/:id", (req, res) => {
    try {
      const db = readDatabase();
      if (!db.cardExpenses) db.cardExpenses = [];
      const index = db.cardExpenses.findIndex((e) => e.id === req.params.id);
      if (index !== -1) {
        db.cardExpenses[index] = {
          ...db.cardExpenses[index],
          ...req.body
        };
        writeDatabase(db);
        res.json(db.cardExpenses[index]);
      } else {
        res.status(404).json({ error: "Despesa de cart\xE3o n\xE3o encontrada" });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/db/export", (req, res) => {
    try {
      const db = readDatabase();
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", "attachment; filename=lifeos-export.json");
      res.send(JSON.stringify(db, null, 2));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/audio/transcribe", async (req, res) => {
    try {
      const { audio, mime } = req.body;
      if (!audio) return res.status(400).json({ error: "\xC1udio n\xE3o fornecido" });
      const text = await runTranscribe(audio, mime);
      res.json({ text });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/ocr/extract", async (req, res) => {
    try {
      const { image, mime } = req.body;
      if (!image) return res.status(400).json({ error: "Imagem n\xE3o fornecida" });
      const result = await runOCR(image, mime);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/telegram/status", (req, res) => {
    const profile = getProfile();
    res.json({
      configured: !!(profile.telegramBotToken && profile.telegramChatId),
      hasToken: !!profile.telegramBotToken,
      hasChatId: !!profile.telegramChatId,
      botToken: profile.telegramBotToken ? `${profile.telegramBotToken.slice(0, 6)}...` : null,
      chatId: profile.telegramChatId || null
    });
  });
  app.post("/api/telegram/register-webhook", async (req, res) => {
    try {
      const profile = getProfile();
      if (!profile.telegramBotToken) {
        return res.status(400).json({ error: "Token do Telegram Bot n\xE3o configurado." });
      }
      const appUrl = req.body.appUrl || process.env.APP_URL || "http://localhost:3000";
      const webhookUrl = `${appUrl}/api/telegram/real-webhook`;
      const registerUrl = `https://api.telegram.org/bot${profile.telegramBotToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
      const response = await fetch(registerUrl);
      const data = await response.json();
      if (data.ok) {
        res.json({ message: `Webhook registrado com sucesso: ${webhookUrl}`, info: data.description });
      } else {
        res.status(400).json({ error: `Erro ao registrar webhook: ${data.description}` });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/test-telegram", async (req, res) => {
    try {
      const profile = getProfile();
      const token = profile.telegramBotToken;
      const chatId = profile.telegramChatId;
      let webhookInfo = null;
      try {
        const infoRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
        webhookInfo = await infoRes.json();
      } catch (infoErr) {
        webhookInfo = { error: infoErr.message };
      }
      const debugInfo = {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        chatId: chatId || null,
        envBotToken: !!process.env.TELEGRAM_BOT_TOKEN,
        envChatId: !!process.env.TELEGRAM_CHAT_ID,
        webhookInfo
      };
      if (!token) {
        return res.status(400).json({
          error: "Token do Telegram Bot n\xE3o configurado (vazio).",
          debugInfo
        });
      }
      const testChatId = req.query.chat_id || chatId;
      if (!testChatId) {
        return res.status(400).json({
          error: "Chat ID do Telegram n\xE3o configurado (vazio) e nenhum query param chat_id foi fornecido.",
          debugInfo
        });
      }
      const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
      const response = await fetch(telegramUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: testChatId,
          text: `\u{1F514} **Teste de Diagn\xF3stico do LifeOS AI!**
Seu servidor e o Bot est\xE3o se comunicando com sucesso.

\u2699\uFE0F **Informa\xE7\xF5es:**
- Chat ID testado: \`${testChatId}\``,
          parse_mode: "Markdown"
        })
      });
      const data = await response.json();
      res.json({
        success: data.ok,
        telegramResponse: data,
        debugInfo
      });
    } catch (err) {
      res.status(500).json({
        error: "Erro no pipeline de teste do Telegram.",
        message: err.message
      });
    }
  });
  app.post("/api/telegram/real-webhook", async (req, res) => {
    try {
      const update = req.body;
      console.log("[Telegram Bot] Received update:", JSON.stringify(update));
      const message = update.message;
      if (!message) return res.status(200).send("OK");
      const chatId = message.chat.id;
      const text = message.text;
      const profile = getProfile();
      console.log("[Telegram Webhook] Received message:", text, "from chatId:", chatId);
      console.log("[Telegram Webhook] Bot token exists:", !!profile.telegramBotToken);
      console.log("[Telegram Webhook] Profile Chat ID configured:", profile.telegramChatId);
      const isValidChatId = (id) => id && /^-?\d+$/.test(id.trim());
      if (!isValidChatId(profile.telegramChatId)) {
        console.log(`[Telegram Bot] No valid telegramChatId set ("${profile.telegramChatId}"). Auto-binding to chatId: ${chatId}`);
        updateProfile({ telegramChatId: String(chatId) });
        profile.telegramChatId = String(chatId);
      } else if (String(chatId) !== String(profile.telegramChatId)) {
        console.warn(`[Telegram Bot] Ignoring message from unauthorized chat ID: ${chatId}`);
        return res.status(200).send("OK");
      }
      if (text) {
        addTelegramHistory("user", text);
        const history = getTelegramHistory().slice(-6).map((h) => ({
          sender: h.sender,
          text: h.text
        }));
        let reply = "";
        try {
          if (isCommand(text)) {
            const { response, handled } = await handleCommand(text, history);
            reply = handled ? response : `\u2753 Comando n\xE3o reconhecido. Use /help para ver os dispon\xEDveis.`;
          } else {
            let intent = "chat";
            let extracted_data = {};
            let routerSuccess = false;
            try {
              const routerRes = await runRouter(text);
              intent = routerRes.intent;
              extracted_data = routerRes.extracted_data;
              routerSuccess = true;
            } catch (routerErr) {
              console.warn("[Telegram Webhook] AI Router failed, using fallback regex parsing:", routerErr.message);
              const valMatch = text.match(/(?:R\$|r\$|\$)\s*([0-9]+(?:[.,][0-9]{2})?)/) || text.match(/([0-9]+(?:[.,][0-9]{2})?)\s*(?:reais|reais)/);
              if (valMatch) {
                const valor = parseFloat(valMatch[1].replace(",", "."));
                intent = text.toLowerCase().includes("receb") || text.toLowerCase().includes("ganh") ? "income" : "expense";
                extracted_data = {
                  valor,
                  categoria: text.toLowerCase().includes("uber") || text.toLowerCase().includes("transp") ? "Transporte" : "Geral",
                  descricao: text.substring(0, 45)
                };
              }
            }
            const actionRes = await executeFromIntent(intent, extracted_data, "telegram");
            try {
              if (routerSuccess) {
                reply = await runPersona(text, history);
              } else {
                throw new Error("Fallback active");
              }
            } catch (personaErr) {
              console.warn("[Telegram Webhook] Persona AI failed, using template fallback:", personaErr.message);
              if (actionRes.success && (intent === "expense" || intent === "income")) {
                const isIncome = intent === "income";
                reply = `\u2705 **[CFO Padr\xE3o]** ${isIncome ? "Receita" : "Despesa"} registrada no banco de dados!

\u{1F4DD} **Descri\xE7\xE3o:** ${extracted_data.descricao || "Registro via Telegram"}
\u{1F4B0} **Valor:** R$ ${Number(extracted_data.valor).toFixed(2)}
\u{1F4C2} **Categoria:** ${extracted_data.categoria || "Geral"}

\u26A0\uFE0F *Nota: O seu registro foi salvo com sucesso, mas a IA de conversa\xE7\xE3o personalizada est\xE1 indispon\xEDvel. Verifique se a sua **Gemini API Key** est\xE1 configurada nos Ajustes.*`;
              } else {
                reply = `\u{1F916} **[Mobilis Executive]** Recebi seu texto: "${text}".

\u26A0\uFE0F *N\xE3o foi poss\xEDvel rodar a Intelig\xEAncia Artificial (Gemini) para processar os dados ou gerar uma resposta. Por favor, verifique se a sua API Key est\xE1 salva corretamente nos Ajustes do painel.*`;
              }
            }
          }
        } catch (pipelineErr) {
          console.error("[Telegram Webhook] Pipeline crash:", pipelineErr.message);
          reply = `\u{1F916} **[Mobilis Executive]** Ol\xE1! Recebi sua mensagem, mas ocorreu uma falha interna no processamento. Certifique-se de configurar as chaves de API nos Ajustes do aplicativo.`;
        }
        addTelegramHistory("bot", reply);
        if (profile.telegramBotToken) {
          const telegramUrl = `https://api.telegram.org/bot${profile.telegramBotToken}/sendMessage`;
          await fetch(telegramUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: reply,
              parse_mode: "Markdown"
            })
          }).catch((err) => console.error("[Telegram Webhook] Failed to send message:", err.message));
        }
      }
      res.status(200).send("OK");
    } catch (err) {
      console.error("[Telegram Bot] Error in real-webhook:", err.message);
      res.status(200).send("OK");
    }
  });
  function startScheduler() {
    console.log("[Scheduler] Background scheduler initialized.");
    setInterval(async () => {
      try {
        const db = readDatabase();
        const profile = getProfile();
        if (!profile.telegramBotToken || !profile.telegramChatId) return;
        const now2 = /* @__PURE__ */ new Date();
        let dbChanged = false;
        for (const rem of db.reminders) {
          if (rem.status === "active" && rem.data_hora) {
            const remTime = new Date(rem.data_hora);
            if (remTime <= now2) {
              console.log(`[Scheduler] Firing reminder: ${rem.titulo}`);
              rem.status = "completed";
              dbChanged = true;
              const msg = `\u{1F514} **LEMBRETE!**

\u{1F4CC} *${rem.titulo}*
\u{1F4C5} Hor\xE1rio programado: ${new Date(rem.data_hora).toLocaleString("pt-BR")}`;
              const telegramUrl = `https://api.telegram.org/bot${profile.telegramBotToken}/sendMessage`;
              await fetch(telegramUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: profile.telegramChatId,
                  text: msg,
                  parse_mode: "Markdown"
                })
              }).catch((err) => console.error("[Scheduler] Error sending reminder telegram:", err.message));
            }
          }
        }
        if (dbChanged) {
          writeDatabase(db);
        }
        const todayStr = now2.toISOString().split("T")[0];
        const lastDigestKey = `last_digest_${todayStr}`;
        const dbAny = db;
        if (!dbAny.metadata) dbAny.metadata = {};
        if (!dbAny.metadata[lastDigestKey]) {
          const currentHour = now2.getHours();
          if (currentHour >= 8 && currentHour < 10) {
            console.log("[Scheduler] Sending daily digest...");
            dbAny.metadata[lastDigestKey] = true;
            writeDatabase(db);
            const digestResult = await handleCommand("/hoje");
            const telegramUrl = `https://api.telegram.org/bot${profile.telegramBotToken}/sendMessage`;
            await fetch(telegramUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: profile.telegramChatId,
                text: `\u{1F305} **Bom dia! Aqui est\xE1 seu resumo matinal:**

${digestResult.response}`,
                parse_mode: "Markdown"
              })
            }).catch((err) => console.error("[Scheduler] Error sending digest telegram:", err.message));
          }
        }
      } catch (err) {
        console.error("[Scheduler] Error in scheduler loop:", err.message);
      }
    }, 6e4);
  }
  startScheduler();
  if (!process.env.VERCEL) {
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path2.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path2.join(distPath, "index.html"));
      });
    }
  }
  if (process.env.VERCEL) {
    return app;
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[LifeOS AI] Server running smoothly on http://localhost:${PORT}`);
  });
  return app;
}
var appPromise = startServer();
var server_default = async (req, res) => {
  const app = await appPromise;
  return app(req, res);
};
export {
  server_default as default
};
