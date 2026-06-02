/**
 * services/engine/action.ts
 *
 * ACTION ENGINE (CONSOLIDADO)
 *
 * Toda escrita no banco de dados passa por aqui. Sem exceção.
 * Nenhuma rota do server.ts deve chamar readDatabase/writeDatabase diretamente
 * para operações de escrita — tudo passa pelo Action Engine.
 */

import { readDatabase, writeDatabase, addInboxItem } from '../../server/db';
import { embed } from '../ai/memory';
import type {
  Expense, Income, Task, Reminder, Goal,
  Habit, Project, Note, Idea, Memory, InboxItem,
  Decision, EnergyLog, Briefing, SimulatorRun, LeakageAlert,
  MeditationSession, MorningRoutineConfig, DailyIntention, MoodLog,
  Debt, DebtPayment, Budget, AiExtraction
} from '../../src/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types & Helpers
// ─────────────────────────────────────────────────────────────────────────────

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  inboxId?: string;
}

type Collection = 'expenses' | 'income' | 'tasks' | 'reminders' | 'goals' |
  'habits' | 'projects' | 'notes' | 'ideas' | 'memories' | 'inbox' |
  'decisions' | 'energyLogs' | 'briefings' | 'simulatorRuns' | 'leakageAlerts' |
  'meditationSessions' | 'dailyIntentions' | 'moodLogs' | 'debts' | 'debtPayments' | 'budgets' | 'aiExtractions';

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
// CORE FINANCE & TRADITIONAL CREATION
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
      categoria_id: data.categoria_id,
      conta_id: data.conta_id,
      cartao_id: data.cartao_id,
      descricao: data.descricao || '',
      data: data.data || today(),
      tag_ids: data.tag_ids || [],
      quitada: data.quitada !== undefined ? data.quitada : true,
    };
    db.expenses.unshift(entity);
    
    // Debit from account
    if (entity.conta_id) {
      db.accounts = db.accounts || [];
      const acc = db.accounts.find(a => a.id === entity.conta_id);
      if (acc) {
        acc.saldo_atual = Number(acc.saldo_atual) - entity.valor;
      }
    }

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
      categoria_id: data.categoria_id,
      conta_id: data.conta_id,
      descricao: data.descricao || '',
      data: data.data || today(),
      tag_ids: data.tag_ids || [],
      quitada: data.quitada !== undefined ? data.quitada : true,
    };
    db.income.unshift(entity);

    // Credit to account
    if (entity.conta_id) {
      db.accounts = db.accounts || [];
      const acc = db.accounts.find(a => a.id === entity.conta_id);
      if (acc) {
        acc.saldo_atual = Number(acc.saldo_atual) + entity.valor;
      }
    }

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
// NEW ADVANCED BLUEPRINT CREATIONS (EXECUTION)
// ─────────────────────────────────────────────────────────────────────────────

export async function createDecision(
  data: Partial<Decision> & { title: string; expected_outcome: string },
  source = 'dashboard'
): Promise<ActionResult<Decision>> {
  try {
    const db = readDatabase();
    const entity: Decision = {
      id: uid('dec'),
      title: data.title,
      context: data.context || '',
      expected_outcome: data.expected_outcome,
      actual_outcome: '',
      review_at: data.review_at || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      reviewed: false,
      status: 'ACTIVE',
      created_at: now()
    };
    db.decisions = db.decisions || [];
    db.decisions.unshift(entity);
    writeDatabase(db);
    addToInbox('decision', `Decisão Estratégica: ${entity.title}`, source, entity.id);
    return { success: true, data: entity };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateDecision(
  id: string,
  data: Partial<Decision>
): Promise<ActionResult<Decision>> {
  try {
    const db = readDatabase();
    const idx = db.decisions.findIndex(d => d.id === id);
    if (idx === -1) return { success: false, error: 'Decisão não encontrada' };
    db.decisions[idx] = { ...db.decisions[idx], ...data };
    writeDatabase(db);
    return { success: true, data: db.decisions[idx] };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createEnergyLog(
  data: { energy_level: number; task_id?: string; context?: any }
): Promise<ActionResult<EnergyLog>> {
  try {
    const db = readDatabase();
    const entity: EnergyLog = {
      id: uid('nrg'),
      energy_level: Number(data.energy_level),
      task_id: data.task_id || undefined,
      context: data.context || {},
      created_at: now()
    };
    db.energyLogs = db.energyLogs || [];
    db.energyLogs.unshift(entity);

    // Recompute Life Score mock after energy updates
    if (db.userProfile) {
      db.userProfile.lifeScore = Math.min(100, Math.max(0, (db.userProfile.lifeScore || 80) + (data.energy_level - 5) * 0.4));
    }

    writeDatabase(db);
    return { success: true, data: entity };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createBriefing(
  data: { content: string; date?: string }
): Promise<ActionResult<Briefing>> {
  try {
    const db = readDatabase();
    const entity: Briefing = {
      id: uid('brf'),
      content: data.content,
      date: data.date || today(),
      generated_at: now()
    };
    db.briefings = db.briefings || [];
    // Enforce unique user_id + date constraint
    db.briefings = db.briefings.filter(b => b.date !== entity.date);
    db.briefings.unshift(entity);
    writeDatabase(db);
    return { success: true, data: entity };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createSimulatorRun(
  data: { params: any; result: any }
): Promise<ActionResult<SimulatorRun>> {
  try {
    const db = readDatabase();
    const entity: SimulatorRun = {
      id: uid('sim'),
      params: data.params,
      result: data.result,
      created_at: now()
    };
    db.simulatorRuns = db.simulatorRuns || [];
    db.simulatorRuns.unshift(entity);
    writeDatabase(db);
    return { success: true, data: entity };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createLeakageAlert(
  data: { category: string; detected_change: number; description: string }
): Promise<ActionResult<LeakageAlert>> {
  try {
    const db = readDatabase();
    const entity: LeakageAlert = {
      id: uid('lka'),
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
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createMeditationSession(
  data: { duration_seconds: number; type: 'breathing' | 'guided' | 'gratitude' | 'visualization' | 'body_scan'; mood_before: number; mood_after: number; notes?: string }
): Promise<ActionResult<MeditationSession>> {
  try {
    const db = readDatabase();
    const entity: MeditationSession = {
      id: uid('med'),
      duration_seconds: Number(data.duration_seconds),
      type: data.type,
      mood_before: Number(data.mood_before),
      mood_after: Number(data.mood_after),
      notes: data.notes || '',
      completed_at: now()
    };
    db.meditationSessions = db.meditationSessions || [];
    db.meditationSessions.unshift(entity);

    // Recompute Life Score mock after mindfulness session
    if (db.userProfile) {
      db.userProfile.lifeScore = Math.min(100, (db.userProfile.lifeScore || 80) + 1.8);
    }

    writeDatabase(db);
    addToInbox('meditation', `Meditação concluída: ${entity.type} de ${Math.floor(entity.duration_seconds/60)}min`, 'dashboard', entity.id);
    return { success: true, data: entity };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createDailyIntention(
  data: { intention_text: string; focus_area: string }
): Promise<ActionResult<DailyIntention>> {
  try {
    const db = readDatabase();
    const entity: DailyIntention = {
      id: uid('int'),
      date: today(),
      intention_text: data.intention_text,
      focus_area: data.focus_area,
      completed: false
    };
    db.dailyIntentions = db.dailyIntentions || [];
    db.dailyIntentions = db.dailyIntentions.filter(i => i.date !== entity.date);
    db.dailyIntentions.unshift(entity);
    writeDatabase(db);
    return { success: true, data: entity };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createMoodLog(
  data: { mood_score: number; energy_level: number; context: string }
): Promise<ActionResult<MoodLog>> {
  try {
    const db = readDatabase();
    const entity: MoodLog = {
      id: uid('mld'),
      mood_score: Number(data.mood_score),
      energy_level: Number(data.energy_level),
      context: data.context,
      recorded_at: now()
    };
    db.moodLogs = db.moodLogs || [];
    db.moodLogs.unshift(entity);

    // Trigger update life score emulation
    if (db.userProfile) {
      db.userProfile.lifeScore = Math.min(100, Math.max(0, (db.userProfile.lifeScore || 80) + (data.mood_score - 5) * 0.2));
    }

    writeDatabase(db);
    return { success: true, data: entity };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createDebt(
  data: { descricao: string; credor: string; valor_original: number; vencimento: string }
): Promise<ActionResult<Debt>> {
  try {
    const db = readDatabase();
    const entity: Debt = {
      id: uid('dbt'),
      descricao: data.descricao,
      credor: data.credor,
      valor_original: Number(data.valor_original),
      saldo_atual: Number(data.valor_original),
      vencimento: data.vencimento,
      status: 'ABERTA'
    };
    db.debts = db.debts || [];
    db.debts.unshift(entity);
    writeDatabase(db);
    return { success: true, data: entity };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createDebtPayment(
  data: { debt_id: string; valor_pago: number; data_pagamento?: string }
): Promise<ActionResult<DebtPayment>> {
  try {
    const db = readDatabase();
    const entity: DebtPayment = {
      id: uid('dpt'),
      debt_id: data.debt_id,
      valor_pago: Number(data.valor_pago),
      data_pagamento: data.data_pagamento || today()
    };
    db.debtPayments = db.debtPayments || [];
    db.debtPayments.unshift(entity);

    // Trigger emulation: recalculate debt
    db.debts = db.debts || [];
    const debtIdx = db.debts.findIndex(d => d.id === data.debt_id);
    if (debtIdx !== -1) {
      const debt = db.debts[debtIdx];
      const totalPaid = db.debtPayments
        .filter(p => p.debt_id === data.debt_id)
        .reduce((sum, p) => sum + p.valor_pago, 0);
      
      debt.saldo_atual = Math.max(0, debt.valor_original - totalPaid);
      if (debt.saldo_atual <= 0) {
        debt.status = 'QUITADA';
      } else if (debt.saldo_atual < debt.valor_original) {
        debt.status = 'PARCIAL';
      } else {
        debt.status = 'ABERTA';
      }
    }

    writeDatabase(db);
    return { success: true, data: entity };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createBudget(
  data: { category_id: string; valor_planejado: number; mes: number; ano: number }
): Promise<ActionResult<Budget>> {
  try {
    const db = readDatabase();
    const entity: Budget = {
      id: uid('bdg'),
      category_id: data.category_id,
      valor_planejado: Number(data.valor_planejado),
      valor_realizado: 0,
      mes: Number(data.mes),
      ano: Number(data.ano)
    };
    db.budgets = db.budgets || [];
    // Enforce unique constraints in array
    db.budgets = db.budgets.filter(b => !(b.category_id === entity.category_id && b.mes === entity.mes && b.ano === entity.ano));
    db.budgets.unshift(entity);
    writeDatabase(db);
    return { success: true, data: entity };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createAiExtraction(
  data: { source: 'text' | 'voice' | 'image' | 'telegram'; confidence: number; extracted_json: any }
): Promise<ActionResult<AiExtraction>> {
  try {
    const db = readDatabase();
    const entity: AiExtraction = {
      id: uid('ext'),
      source: data.source,
      confidence: Number(data.confidence),
      extracted_json: data.extracted_json,
      status: 'PENDING',
      created_at: now()
    };
    db.aiExtractions = db.aiExtractions || [];
    db.aiExtractions.unshift(entity);
    writeDatabase(db);
    return { success: true, data: entity };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateAiExtractionStatus(
  id: string,
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVIEW',
  extractedJson?: any
): Promise<ActionResult<AiExtraction>> {
  try {
    const db = readDatabase();
    const idx = db.aiExtractions.findIndex(e => e.id === id);
    if (idx === -1) return { success: false, error: 'Extração não encontrada' };
    
    const extraction = db.aiExtractions[idx];
    extraction.status = status;
    extraction.processed_at = now();
    if (extractedJson) {
      extraction.extracted_json = extractedJson;
    }

    if (status === 'APPROVED') {
      const { intent, data } = extraction.extracted_json;
      if (intent && data) {
        await executeFromIntent(intent, data, extraction.source);
      }
    }

    writeDatabase(db);
    return { success: true, data: extraction };
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

    // Reverse account balance adjustment on deletion
    if (collection === 'expenses') {
      const expense = db.expenses.find((e: any) => e.id === id);
      if (expense && expense.conta_id) {
        db.accounts = db.accounts || [];
        const acc = db.accounts.find((a: any) => a.id === expense.conta_id);
        if (acc) {
          acc.saldo_atual = Number(acc.saldo_atual) + Number(expense.valor);
        }
      }
    } else if (collection === 'income') {
      const income = db.income.find((i: any) => i.id === id);
      if (income && income.conta_id) {
        db.accounts = db.accounts || [];
        const acc = db.accounts.find((a: any) => a.id === income.conta_id);
        if (acc) {
          acc.saldo_atual = Number(acc.saldo_atual) - Number(income.valor);
        }
      }
    }

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
    case 'decision':  return createDecision(extractedData as any, source);
    case 'meditation': return createMeditationSession(extractedData as any);
    case 'mood':      return createMoodLog(extractedData as any);
    case 'debt':      return createDebt(extractedData as any);
    case 'debt_payment': return createDebtPayment(extractedData as any);
    case 'budget':    return createBudget(extractedData as any);
    default:
      return { success: true, data: null }; // chat — sem escrita
  }
}
