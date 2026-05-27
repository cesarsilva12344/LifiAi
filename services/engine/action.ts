/**
 * services/engine/action.ts
 *
 * ACTION ENGINE
 *
 * Toda escrita no banco de dados passa por aqui. Sem exceção.
 * Nenhuma rota do server.ts deve chamar readDatabase/writeDatabase diretamente
 * para operações de escrita — tudo passa pelo Action Engine.
 *
 * API pública:
 *   createExpense(data)   → Expense
 *   createIncome(data)    → Income
 *   createTask(data)      → Task
 *   createReminder(data)  → Reminder
 *   createGoal(data)      → Goal
 *   createHabit(data)     → Habit
 *   createProject(data)   → Project
 *   createNote(data)      → Note
 *   createIdea(data)      → Idea
 *   createMemory(data)    → Memory
 *
 *   updateTask(id, data)          → Task
 *   completeTask(id)              → Task
 *   updateGoalProgress(id, val)   → Goal
 *   checkHabit(id)                → Habit
 *   updateProject(id, data)       → Project
 *
 *   deleteEntity(collection, id)  → boolean
 *
 *   executeFromIntent(intent, extractedData, source) → ActionResult
 */

import { readDatabase, writeDatabase, addInboxItem } from '../../server/db';
import { embed } from '../ai/memory';
import type {
  Expense, Income, Task, Reminder, Goal,
  Habit, Project, Note, Idea, Memory, InboxItem
} from '../../src/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  inboxId?: string;
}

type Collection = 'expenses' | 'income' | 'tasks' | 'reminders' | 'goals' |
  'habits' | 'projects' | 'notes' | 'ideas' | 'memories' | 'inbox';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const uid = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const today = () => new Date().toISOString().split('T')[0];
const now = () => new Date().toISOString();

function addToInbox(type: string, raw_content: string, source: string, extracted_id?: string): string {
  const item: InboxItem = {
    id: uid('inbox'),
    type,
    raw_content,
    source,
    created_at: now(),
    processed: true,
    extracted_id,
  };
  addInboxItem(item);
  return item.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE operations
// ─────────────────────────────────────────────────────────────────────────────

export async function createExpense(
  data: Partial<Expense> & { valor: number },
  source = 'dashboard'
): Promise<ActionResult<Expense>> {
  try {
    const db = readDatabase();
    const entity: Expense = {
      id: uid('exp'),
      valor: Number(data.valor),
      categoria: data.categoria || 'Geral',
      descricao: data.descricao || '',
      data: data.data || today(),
    };
    db.expenses.unshift(entity);
    writeDatabase(db);
    const inboxId = addToInbox(
      'expense',
      `Despesa: ${entity.descricao || entity.categoria} R$ ${entity.valor.toFixed(2)}`,
      source,
      entity.id
    );
    return { success: true, data: entity, inboxId };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createIncome(
  data: Partial<Income> & { valor: number },
  source = 'dashboard'
): Promise<ActionResult<Income>> {
  try {
    const db = readDatabase();
    const entity: Income = {
      id: uid('inc'),
      valor: Number(data.valor),
      categoria: data.categoria || 'Receita',
      descricao: data.descricao || '',
      data: data.data || today(),
    };
    db.income.unshift(entity);
    writeDatabase(db);
    const inboxId = addToInbox(
      'income',
      `Receita: ${entity.descricao || entity.categoria} R$ ${entity.valor.toFixed(2)}`,
      source,
      entity.id
    );
    return { success: true, data: entity, inboxId };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createTask(
  data: Partial<Task> & { titulo: string },
  source = 'dashboard'
): Promise<ActionResult<Task>> {
  try {
    const db = readDatabase();
    const entity: Task = {
      id: uid('task'),
      titulo: data.titulo,
      status: 'pending',
      prioridade: data.prioridade || 'medium',
      prazo: data.prazo || new Date(Date.now() + 86400000).toISOString().split('T')[0],
    };
    db.tasks.unshift(entity);
    writeDatabase(db);
    const inboxId = addToInbox('task', `Tarefa: ${entity.titulo}`, source, entity.id);
    return { success: true, data: entity, inboxId };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createReminder(
  data: Partial<Reminder> & { titulo: string },
  source = 'dashboard'
): Promise<ActionResult<Reminder>> {
  try {
    const db = readDatabase();
    const entity: Reminder = {
      id: uid('rem'),
      titulo: data.titulo,
      data_hora: data.data_hora || new Date(Date.now() + 3600000).toISOString(),
      status: 'active',
    };
    db.reminders.unshift(entity);
    writeDatabase(db);
    const inboxId = addToInbox(
      'reminder',
      `Lembrete: ${entity.titulo} em ${entity.data_hora}`,
      source,
      entity.id
    );
    return { success: true, data: entity, inboxId };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createGoal(
  data: Partial<Goal> & { titulo: string; meta: number },
  source = 'dashboard'
): Promise<ActionResult<Goal>> {
  try {
    const db = readDatabase();
    const entity: Goal = {
      id: uid('goal'),
      titulo: data.titulo,
      meta: Number(data.meta),
      progresso: 0,
      prazo: data.prazo || '2026-12-31',
    };
    db.goals.push(entity);
    writeDatabase(db);
    addToInbox('goal', `Meta: ${entity.titulo} (alvo: ${entity.meta})`, source, entity.id);
    return { success: true, data: entity };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createHabit(
  data: Partial<Habit> & { nome: string },
  source = 'dashboard'
): Promise<ActionResult<Habit>> {
  try {
    const db = readDatabase();
    const entity: Habit = {
      id: uid('hab'),
      nome: data.nome,
      frequencia: data.frequencia || 'diaria',
      streak: 0,
      history: [],
    };
    db.habits.push(entity);
    writeDatabase(db);
    addToInbox('habit', `Hábito criado: ${entity.nome}`, source, entity.id);
    return { success: true, data: entity };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createProject(
  data: Partial<Project> & { nome: string },
  source = 'dashboard'
): Promise<ActionResult<Project>> {
  try {
    const db = readDatabase();
    const entity: Project = {
      id: uid('proj'),
      nome: data.nome,
      descricao: data.descricao || '',
      status: data.status || 'planning',
      progresso: 0,
      cliente: data.cliente || '',
    };
    db.projects.push(entity);
    writeDatabase(db);
    addToInbox('project', `Projeto: ${entity.nome}`, source, entity.id);
    return { success: true, data: entity };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createNote(
  data: Partial<Note> & { conteudo: string },
  source = 'dashboard'
): Promise<ActionResult<Note>> {
  try {
    const db = readDatabase();
    const entity: Note = {
      id: uid('note'),
      conteudo: data.conteudo,
      tags: data.tags || [],
      created_at: now(),
    };
    db.notes.unshift(entity);
    writeDatabase(db);
    addToInbox('note', entity.conteudo.slice(0, 120), source, entity.id);
    return { success: true, data: entity };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createIdea(
  data: Partial<Idea> & { titulo: string },
  source = 'dashboard'
): Promise<ActionResult<Idea>> {
  try {
    const db = readDatabase();
    const entity: Idea = {
      id: uid('idea'),
      titulo: data.titulo,
      conteudo: data.conteudo || '',
      score: data.score || 5,
      created_at: now(),
    };
    db.ideas.unshift(entity);
    writeDatabase(db);
    addToInbox('idea', `Ideia: ${entity.titulo}`, source, entity.id);
    return { success: true, data: entity };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createMemory(
  data: Partial<Memory> & { conteudo: string },
  source = 'dashboard'
): Promise<ActionResult<Memory>> {
  try {
    const db = readDatabase();
    const entity: Memory = {
      id: uid('mem'),
      conteudo: data.conteudo,
      embedding: [],
      origem: data.origem || source,
      created_at: now(),
    };
    db.memories.unshift(entity);
    writeDatabase(db);
    addToInbox('memory', entity.conteudo.slice(0, 120), source, entity.id);

    // Embed async (non-blocking)
    embed(entity.conteudo).then(vec => {
      if (vec) {
        const fresh = readDatabase();
        const idx = fresh.memories.findIndex(m => m.id === entity.id);
        if (idx !== -1) { fresh.memories[idx].embedding = vec; writeDatabase(fresh); }
      }
    }).catch(() => {});

    return { success: true, data: entity };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE operations
// ─────────────────────────────────────────────────────────────────────────────

export async function updateTask(
  id: string,
  data: Partial<Pick<Task, 'titulo' | 'status' | 'prioridade' | 'prazo'>>
): Promise<ActionResult<Task>> {
  try {
    const db = readDatabase();
    const idx = db.tasks.findIndex(t => t.id === id);
    if (idx === -1) return { success: false, error: 'Tarefa não encontrada' };
    db.tasks[idx] = { ...db.tasks[idx], ...data };
    writeDatabase(db);
    return { success: true, data: db.tasks[idx] };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function completeTask(id: string): Promise<ActionResult<Task>> {
  return updateTask(id, { status: 'completed' });
}

export async function updateGoalProgress(id: string, progresso: number): Promise<ActionResult<Goal>> {
  try {
    const db = readDatabase();
    const idx = db.goals.findIndex(g => g.id === id);
    if (idx === -1) return { success: false, error: 'Meta não encontrada' };
    db.goals[idx].progresso = Math.min(db.goals[idx].meta, Math.max(0, progresso));
    writeDatabase(db);
    return { success: true, data: db.goals[idx] };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function checkHabit(id: string): Promise<ActionResult<Habit>> {
  try {
    const db = readDatabase();
    const idx = db.habits.findIndex(h => h.id === id);
    if (idx === -1) return { success: false, error: 'Hábito não encontrado' };
    const todayStr = today();
    if (!db.habits[idx].history.includes(todayStr)) {
      db.habits[idx].history.push(todayStr);
      db.habits[idx].streak += 1;
      writeDatabase(db);
    }
    return { success: true, data: db.habits[idx] };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateProject(
  id: string,
  data: Partial<Project>
): Promise<ActionResult<Project>> {
  try {
    const db = readDatabase();
    const idx = db.projects.findIndex(p => p.id === id);
    if (idx === -1) return { success: false, error: 'Projeto não encontrado' };
    db.projects[idx] = { ...db.projects[idx], ...data };
    writeDatabase(db);
    return { success: true, data: db.projects[idx] };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteEntity(collection: Collection, id: string): Promise<ActionResult<boolean>> {
  try {
    const db = readDatabase() as any;
    if (!Array.isArray(db[collection])) return { success: false, error: 'Coleção inválida' };
    const before = db[collection].length;
    db[collection] = db[collection].filter((item: any) => item.id !== id);
    if (db[collection].length === before) return { success: false, error: 'Item não encontrado' };
    writeDatabase(db);
    return { success: true, data: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// executeFromIntent() — chamado pelo Router após classificar uma mensagem
// ─────────────────────────────────────────────────────────────────────────────

export async function executeFromIntent(
  intent: string,
  extractedData: Record<string, any>,
  source = 'telegram'
): Promise<ActionResult> {
  switch (intent) {
    case 'expense':   return createExpense(extractedData as any, source);
    case 'income':    return createIncome(extractedData as any, source);
    case 'task':      return createTask(extractedData as any, source);
    case 'reminder':  return createReminder(extractedData as any, source);
    case 'goal':      return createGoal(extractedData as any, source);
    case 'habit':     return createHabit(extractedData as any, source);
    case 'project':   return createProject(extractedData as any, source);
    case 'note':      return createNote(extractedData as any, source);
    case 'idea':      return createIdea(extractedData as any, source);
    case 'memory':    return createMemory(extractedData as any, source);
    default:
      return { success: true, data: null }; // chat — sem escrita
  }
}
