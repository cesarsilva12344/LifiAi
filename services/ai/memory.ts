/**
 * services/ai/memory.ts
 *
 * CAMADA 3 — Memory Engine
 *
 * Monta o contexto antes de qualquer chamada à IA.
 * Busca no banco de dados as informações relevantes para a query atual.
 *
 * O fluxo correto:
 *   1. memory.buildContext(query)   → contexto estruturado
 *   2. personas.generateResponse(msg, context) → passa o contexto
 *   3. provider.chat(...)          → chamada real ao DeepSeek
 *
 * Esta camada NUNCA chama a IA diretamente para conversa.
 * Ela pode usar embeddings para busca semântica.
 */

import { readDatabase, writeDatabase, getProfile } from '../../server/db';
import { getProvider } from './provider';
import type { UserProfile, Expense, Income, Task, Goal, Habit, Project, Note, Idea, Memory } from '../../src/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MemoryContext {
  userProfile: UserProfile;
  recentExpenses: Expense[];       // últimas 10
  recentIncome: Income[];          // últimas 5
  pendingTasks: Task[];            // todas as pending
  activeGoals: Goal[];             // todas as metas
  activeHabits: Habit[];           // todos os hábitos
  activeProjects: Project[];       // projetos ativos
  relevantMemories: Memory[];      // busca semântica ou últimas 5
  relevantNotes: Note[];           // busca semântica ou últimas 5
  financialSummary: {
    totalExpenses: number;
    totalIncome: number;
    balance: number;
    topCategory: string;
  };
}

export interface SemanticSearchResult {
  item: any;
  type: 'note' | 'idea' | 'memory';
  score: number;
}

// ---------------------------------------------------------------------------
// Build Context (runs before every persona response)
// ---------------------------------------------------------------------------

export async function buildContext(query?: string): Promise<MemoryContext> {
  const db = readDatabase();
  const profile = getProfile();

  // Financial summary
  const totalExpenses = db.expenses.reduce((s, e) => s + e.valor, 0);
  const totalIncome = db.income.reduce((s, i) => s + i.valor, 0);

  // Top expense category
  const categoryMap: Record<string, number> = {};
  db.expenses.forEach(e => {
    categoryMap[e.categoria] = (categoryMap[e.categoria] || 0) + e.valor;
  });
  const topCategory = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Nenhuma';

  // Semantic search for relevant memories/notes if query provided
  let relevantMemories: Memory[] = db.memories.slice(0, 5);
  let relevantNotes: Note[] = db.notes.slice(0, 5);

  if (query && query.trim().length > 3) {
    const searchResults = await semanticSearch(query);
    relevantMemories = searchResults
      .filter(r => r.type === 'memory')
      .map(r => r.item as Memory)
      .slice(0, 5);
    relevantNotes = searchResults
      .filter(r => r.type === 'note')
      .map(r => r.item as Note)
      .slice(0, 5);

    // Fill with latest if semantic search returned nothing
    if (relevantMemories.length === 0) relevantMemories = db.memories.slice(0, 5);
    if (relevantNotes.length === 0) relevantNotes = db.notes.slice(0, 5);
  }

  return {
    userProfile: profile,
    recentExpenses: db.expenses.slice(0, 10),
    recentIncome: db.income.slice(0, 5),
    pendingTasks: db.tasks.filter(t => t.status === 'pending'),
    activeGoals: db.goals,
    activeHabits: db.habits,
    activeProjects: db.projects.filter(p => p.status === 'active' || p.status === 'planning'),
    relevantMemories,
    relevantNotes,
    financialSummary: { totalExpenses, totalIncome, balance: totalIncome - totalExpenses, topCategory },
  };
}

// ---------------------------------------------------------------------------
// Embeddings
// ---------------------------------------------------------------------------

export async function embed(text: string): Promise<number[] | null> {
  try {
    const provider = getProvider();
    return await provider.embed(text.slice(0, 8000));
  } catch (_) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Cosine Similarity
// ---------------------------------------------------------------------------

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
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

// ---------------------------------------------------------------------------
// Keyword Scoring Fallback (no API needed)
// ---------------------------------------------------------------------------

export function keywordScore(text: string, query: string): number {
  const textWords = text.toLowerCase().split(/\s+/);
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  if (queryWords.length === 0) return 0;
  let matches = 0;
  for (const qw of queryWords) {
    if (textWords.some(tw => tw.includes(qw) || qw.includes(tw))) matches++;
  }
  return matches / queryWords.length;
}

// ---------------------------------------------------------------------------
// Semantic Search (Embeddings → Cosine OR Keyword Fallback)
// ---------------------------------------------------------------------------

export async function semanticSearch(query: string): Promise<SemanticSearchResult[]> {
  const db = readDatabase();
  const results: SemanticSearchResult[] = [];

  const queryEmbed = await embed(query);

  type Target = { item: any; text: string; type: 'note' | 'idea' | 'memory'; embed?: number[] };
  const targets: Target[] = [
    ...db.notes.map(n => ({ item: n, text: `${n.conteudo} ${n.tags?.join(' ') ?? ''}`, type: 'note' as const })),
    ...db.ideas.map(i => ({ item: i, text: `${i.titulo} ${i.conteudo}`, type: 'idea' as const })),
    ...db.memories.map(m => ({ item: m, text: m.conteudo, type: 'memory' as const, embed: m.embedding })),
  ];

  for (const target of targets) {
    let score = 0;

    if (queryEmbed && target.embed && target.embed.length > 0) {
      score = cosineSimilarity(queryEmbed, target.embed);
    } else if (queryEmbed && !target.embed) {
      // Lazy generate and cache embedding for memories
      const itemEmbed = await embed(target.text);
      if (itemEmbed) {
        if (target.type === 'memory') {
          const idx = db.memories.findIndex(m => m.id === target.item.id);
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
