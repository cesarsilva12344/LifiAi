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
  descricao: string;
  data: string; // YYYY-MM-DD
}

export interface Income {
  id: string;
  valor: number;
  categoria: string;
  descricao: string;
  data: string; // YYYY-MM-DD
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
}
