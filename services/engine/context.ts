/**
 * services/engine/context.ts
 *
 * CONTEXT ENGINE
 *
 * Toda resposta contextual da IA passa por aqui.
 * Monta o contexto completo antes de qualquer chamada ao AI Core.
 *
 * API pública:
 *   getContext(query?)  → AssembledContext
 *   formatContext(ctx)  → string (para prompts)
 */

import { readDatabase, getProfile } from '../../server/db';
import { CONTEXT_BLOCK } from '../ai/prompt-registry';
import { embed, cosineSimilarity, keywordScore } from '../ai/memory';
import type {
  UserProfile, Expense, Income, Task, Reminder,
  Goal, Habit, Project, Note, Idea, Memory
} from '../../src/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  topCategory: string;
  recentExpenses: Expense[];
  recentIncome: Income[];
}

export interface AssembledContext {
  userProfile: UserProfile;
  financial: FinancialSummary;
  pendingTasks: Task[];
  activeReminders: Reminder[];
  goals: Goal[];
  habits: Habit[];
  activeProjects: Project[];
  relevantMemories: Memory[];
  relevantNotes: Note[];
  relevantIdeas: Idea[];
  query?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// getContext()
// ─────────────────────────────────────────────────────────────────────────────

export async function getContext(query?: string): Promise<AssembledContext> {
  const db = readDatabase();
  const profile = getProfile();

  // Financial
  const totalIncome = db.income.reduce((s, i) => s + i.valor, 0);
  const totalExpenses = db.expenses.reduce((s, e) => s + e.valor, 0);

  const categoryTotals: Record<string, number> = {};
  db.expenses.forEach(e => {
    categoryTotals[e.categoria] = (categoryTotals[e.categoria] || 0) + e.valor;
  });
  const topCategory = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Nenhuma';

  const financial: FinancialSummary = {
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    topCategory,
    recentExpenses: db.expenses.slice(0, 10),
    recentIncome: db.income.slice(0, 5),
  };

  // Semantic retrieval if query provided
  let relevantMemories: Memory[] = db.memories.slice(0, 5);
  let relevantNotes: Note[] = db.notes.slice(0, 5);
  let relevantIdeas: Idea[] = db.ideas.slice(0, 3);

  if (query && query.trim().length > 2) {
    const queryVec = await embed(query).catch(() => null);

    // Score memories
    const scoredMemories = await Promise.all(
      db.memories.map(async m => {
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
    const topMemories = scoredMemories
      .filter(r => r.score > 0.05)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(r => r.item);
    if (topMemories.length > 0) relevantMemories = topMemories;

    // Score notes (keyword only for speed)
    const scoredNotes = db.notes
      .map(n => ({ item: n, score: keywordScore(n.conteudo, query) }))
      .filter(r => r.score > 0.05)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    if (scoredNotes.length > 0) relevantNotes = scoredNotes.map(r => r.item);

    // Score ideas
    const scoredIdeas = db.ideas
      .map(i => ({ item: i, score: keywordScore(`${i.titulo} ${i.conteudo}`, query) }))
      .filter(r => r.score > 0.05)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    if (scoredIdeas.length > 0) relevantIdeas = scoredIdeas.map(r => r.item);
  }

  return {
    userProfile: profile,
    financial,
    pendingTasks: db.tasks.filter(t => t.status === 'pending'),
    activeReminders: db.reminders.filter(r => r.status === 'active'),
    goals: db.goals,
    habits: db.habits,
    activeProjects: db.projects.filter(p => p.status !== 'completed'),
    relevantMemories,
    relevantNotes,
    relevantIdeas,
    query,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// formatContext() — formata AssembledContext para uso em prompts
// ─────────────────────────────────────────────────────────────────────────────

export function formatContext(ctx: AssembledContext): string {
  return CONTEXT_BLOCK({
    nome: ctx.userProfile.nome,
    interesses: ctx.userProfile.interesses ?? [],
    objetivos: ctx.userProfile.objetivos ?? [],
    totalIncome: ctx.financial.totalIncome,
    totalExpenses: ctx.financial.totalExpenses,
    balance: ctx.financial.balance,
    topCategory: ctx.financial.topCategory,
    pendingTasks: ctx.pendingTasks.map(t => ({
      titulo: t.titulo,
      prioridade: t.prioridade,
      prazo: t.prazo,
    })),
    goals: ctx.goals.map(g => ({
      titulo: g.titulo,
      progresso: g.progresso,
      meta: g.meta,
      prazo: g.prazo,
    })),
    habits: ctx.habits.map(h => ({ nome: h.nome, streak: h.streak })),
    projects: ctx.activeProjects.map(p => ({
      nome: p.nome,
      progresso: p.progresso,
      status: p.status,
    })),
    memories: ctx.relevantMemories.map(m => m.conteudo.slice(0, 120)),
    notes: ctx.relevantNotes.map(n => n.conteudo.slice(0, 120)),
  });
}
