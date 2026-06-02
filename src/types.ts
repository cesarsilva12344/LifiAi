export interface InboxItem {
  id: string;
  type: string; // 'expense' | 'income' | 'task' | 'reminder' | 'goal' | 'habit' | 'project' | 'note' | 'idea' | 'memory' | 'chat' | 'unknown';
  raw_content: string;
  source: string; // 'Telegram'
  created_at: string;
  processed: boolean;
  extracted_id?: string; // Reference to the parsed item
}

export interface Expense {
  id: string;
  valor: number;
  categoria: string;
  categoria_id?: string;
  conta_id?: string;
  cartao_id?: string;
  descricao: string;
  data: string; // YYYY-MM-DD
  tag_ids?: string[];
  quitada?: boolean;
}

export interface Income {
  id: string;
  valor: number;
  categoria: string;
  categoria_id?: string;
  conta_id?: string;
  descricao: string;
  data: string; // YYYY-MM-DD
  tag_ids?: string[];
  quitada?: boolean;
}

export interface Task {
  id: string;
  titulo: string;
  status: 'pending' | 'completed';
  prioridade: 'high' | 'medium' | 'low';
  prazo: string; // YYYY-MM-DD
}

export interface Reminder {
  id: string;
  titulo: string;
  data_hora: string; // ISO String or YYYY-MM-DD HH:mm
  status: 'active' | 'completed' | 'canceled';
}

export interface Goal {
  id: string;
  titulo: string;
  meta: number;
  progresso: number;
  prazo: string; // YYYY-MM-DD
}

export interface Habit {
  id: string;
  nome: string;
  frequencia: 'diaria' | 'semanal';
  streak: number;
  history: string[]; // List of dates 'YYYY-MM-DD' checked
}

export interface Project {
  id: string;
  nome: string;
  descricao: string;
  status: 'planning' | 'active' | 'completed' | 'on_hold';
  progresso: number; // 0 - 100
  cliente?: string; // Optional client name for grouping
}

export interface Note {
  id: string;
  conteudo: string;
  tags: string[];
  created_at?: string;
}

export interface Idea {
  id: string;
  titulo: string;
  conteudo: string;
  score: number; // 1-10 priority/excitement
  created_at?: string;
}

export interface Memory {
  id: string;
  conteudo: string;
  embedding?: number[];
  origem: string;
  created_at: string;
}

export interface Persona {
  id: string;
  nome: string;
  descricao: string;
  prompt_base: string;
  ativa: boolean;
  icon: string; // lucide icon name
}

export interface UserProfile {
  nome: string;
  appName: string;
  geminiApiKey?: string;
  deepseekApiKey?: string;
  qwenApiKey?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  interesses: string[];
  objetivos: string[];
  preferencias: string[];
  contexto: string;
  lifeScore?: number;
}

export interface Salary {
  id: string;
  valor: number;
  categoria: string;
  descricao: string;
  data_prevista: string; // YYYY-MM-DD
  quitada: boolean;
  data_pagamento: string | null; // YYYY-MM-DD
}

export interface CreditCard {
  id: string;
  nome: string;
  limite: number;
  dia_fechamento: number;
  dia_vencimento: number;
  cor?: string;
}

export interface CardExpense {
  id: string;
  cartao_id: string;
  valor: number;
  categoria: string;
  descricao: string;
  data: string; // YYYY-MM-DD
  parcelas: number;
  quitada: boolean;
}

export interface Decision {
  id: string;
  user_id?: string;
  title: string;
  context: string;
  expected_outcome: string;
  actual_outcome?: string;
  review_at: string; // YYYY-MM-DD
  reviewed: boolean;
  status: 'ACTIVE' | 'REVIEW_PENDING' | 'REVIEWED' | 'ARCHIVED';
  created_at?: string;
}

export interface EnergyLog {
  id: string;
  user_id?: string;
  task_id?: string;
  energy_level: number; // 1-10
  context: any;
  created_at?: string;
}

export interface Briefing {
  id: string;
  user_id?: string;
  content: string;
  date: string; // YYYY-MM-DD
  generated_at?: string;
}

export interface SimulatorRun {
  id: string;
  user_id?: string;
  params: any;
  result: any;
  created_at?: string;
}

export interface LeakageAlert {
  id: string;
  user_id?: string;
  category: string;
  detected_change: number;
  description: string;
  dismissed: boolean;
  detected_at?: string;
}

export interface MeditationSession {
  id: string;
  user_id?: string;
  duration_seconds: number;
  type: 'breathing' | 'guided' | 'gratitude' | 'visualization' | 'body_scan';
  mood_before: number;
  mood_after: number;
  notes?: string;
  completed_at?: string;
}

export interface MorningRoutineConfig {
  id: string;
  user_id?: string;
  wake_up_time: string; // HH:mm:ss
  meditation_enabled: boolean;
  meditation_duration: number;
  briefing_enabled: boolean;
  gratitude_prompt: boolean;
  intention_setting: boolean;
  timezone: string;
}

export interface DailyIntention {
  id: string;
  user_id?: string;
  date: string; // YYYY-MM-DD
  intention_text: string;
  focus_area: string;
  completed: boolean;
  reflection?: string;
}

export interface MoodLog {
  id: string;
  user_id?: string;
  mood_score: number;
  energy_level: number;
  context: string;
  recorded_at?: string;
}

export interface Debt {
  id: string;
  descricao: string;
  credor: string;
  valor_original: number;
  saldo_atual: number;
  vencimento: string;
  status: 'ABERTA' | 'PARCIAL' | 'QUITADA' | 'ATRASADA';
}

export interface DebtPayment {
  id: string;
  debt_id: string;
  valor_pago: number;
  data_pagamento: string;
}

export interface Budget {
  id: string;
  category_id: string;
  valor_planejado: number;
  valor_realizado: number;
  mes: number;
  ano: number;
}

export interface AiExtraction {
  id: string;
  message_id?: string;
  user_id?: string;
  source: 'text' | 'voice' | 'image' | 'telegram';
  confidence: number;
  extracted_json: any;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVIEW';
  created_at?: string;
  processed_at?: string;
}

export interface Category {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  cor: string;
}

export interface Account {
  id: string;
  nome: string;
  tipo: 'carteira' | 'corrente' | 'poupança' | 'investimento';
  saldo_inicial: number;
  saldo_atual: number;
  cor: string;
}

export interface Tag {
  id: string;
  nome: string;
  cor: string;
}

export interface DatabaseState {
  inbox: InboxItem[];
  expenses: Expense[];
  income: Income[];
  tasks: Task[];
  reminders: Reminder[];
  goals: Goal[];
  habits: Habit[];
  projects: Project[];
  notes: Note[];
  ideas: Idea[];
  memories: Memory[];
  personas: Persona[];
  userProfile: UserProfile;
  salaries: Salary[];
  creditCards: CreditCard[];
  cardExpenses: CardExpense[];
  decisions: Decision[];
  energyLogs: EnergyLog[];
  briefings: Briefing[];
  simulatorRuns: SimulatorRun[];
  leakageAlerts: LeakageAlert[];
  meditationSessions: MeditationSession[];
  morningRoutineConfig?: MorningRoutineConfig;
  dailyIntentions: DailyIntention[];
  moodLogs: MoodLog[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  budgets: Budget[];
  aiExtractions: AiExtraction[];
  categories: Category[];
  accounts: Account[];
  tags: Tag[];
}
