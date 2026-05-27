/**
 * services/ai/core.ts
 *
 * AI CORE — Gateway único de inteligência artificial.
 *
 * Toda interação com IA passa por aqui. Sem exceção.
 * Nenhuma rota, engine ou componente chama o provider diretamente.
 *
 * API pública:
 *   runPersona(message, history?)   → string    (resposta da persona ativa)
 *   runInsight(type?)               → string[]  (insights do dashboard)
 *   searchMemory(query)             → SearchResult[]  (busca semântica)
 *   runRouter(text)                 → RouterResult    (classificação de intent)
 *   runOCR(imageBase64, mime?)      → OCRResult
 *   runTranscribe(audioBase64, mime?) → string
 */

import { getProvider } from './provider';
import { routeMessage, RouterResult } from './router';
import { getContext, formatContext, AssembledContext } from '../engine/context';
import { semanticSearch, SemanticSearchResult } from './memory';
import {
  PERSONA_RESPOND,
  INSIGHT_DAILY,
  INSIGHT_FINANCIAL,
  MEMORY_OCR,
  MEMORY_EXTRACT,
} from './prompt-registry';
import { getActivePersona } from '../../server/db';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ChatHistoryItem {
  sender: 'user' | 'bot';
  text: string;
}

export interface OCRResult {
  isReceipt: boolean;
  valor?: number;
  descricao?: string;
  data?: string;
  text: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// runPersona()
// Gera resposta contextual da persona ativa.
// ─────────────────────────────────────────────────────────────────────────────

export async function runPersona(
  message: string,
  history: ChatHistoryItem[] = []
): Promise<string> {
  const persona = getActivePersona();
  const ctx = await getContext(message);
  const contextBlock = formatContext(ctx);

  const historyStr = history
    .slice(-6)
    .map(h => `${h.sender === 'user' ? 'Usuário' : persona.nome}: ${h.text}`)
    .join('\n');

  const systemPrompt = PERSONA_RESPOND(persona, contextBlock, historyStr);

  try {
    const provider = getProvider();
    if (!provider.isAvailable()) return localPersonaFallback(persona, message, ctx);
    const response = await provider.chat(systemPrompt, `"${message}"`, {
      temperature: 0.65,
      maxTokens: 1024,
    });
    return response || localPersonaFallback(persona, message, ctx);
  } catch (err: any) {
    console.error('[AICore] runPersona falhou:', err.message);
    return localPersonaFallback(persona, message, ctx);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// runInsight()
// Gera insights executivos para o dashboard.
// type: 'daily' (3 insights curtos) | 'financial' (relatório completo)
// ─────────────────────────────────────────────────────────────────────────────

export async function runInsight(type: 'daily' | 'financial' = 'daily'): Promise<string[]> {
  const ctx = await getContext();
  const { financial: fs, pendingTasks, goals, habits, activeProjects, userProfile } = ctx;

  if (type === 'financial') {
    const systemPrompt = INSIGHT_FINANCIAL(userProfile.nome);
    const topExpenses = fs.recentExpenses
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5)
      .map(e => `${e.categoria}: R$ ${e.valor.toFixed(2)} (${e.descricao})`)
      .join('\n');

    const userMessage = `Receitas: R$ ${fs.totalIncome.toFixed(2)}\nDespesas: R$ ${fs.totalExpenses.toFixed(2)}\nSaldo: R$ ${fs.balance.toFixed(2)}\nCat. maior gasto: ${fs.topCategory}\n\nTop despesas:\n${topExpenses || 'Nenhuma'}`;

    try {
      const provider = getProvider();
      if (!provider.isAvailable()) return [localFinancialReport(ctx)];
      const text = await provider.chat(systemPrompt, userMessage, { temperature: 0.4 });
      return [text];
    } catch {
      return [localFinancialReport(ctx)];
    }
  }

  // type === 'daily'
  const systemPrompt = INSIGHT_DAILY();
  const userMessage = [
    `Saldo: R$ ${fs.balance.toFixed(2)} (receitas ${fs.totalIncome.toFixed(2)}, despesas ${fs.totalExpenses.toFixed(2)})`,
    `Maior gasto: ${fs.topCategory}`,
    `Tarefas pendentes: ${pendingTasks.length} (${pendingTasks.filter(t => t.prioridade === 'high').length} urgentes)`,
    `Metas: ${goals.map(g => `${g.titulo} ${Math.round((g.progresso / g.meta) * 100)}%`).join(', ') || 'nenhuma'}`,
    `Hábitos: ${habits.map(h => `${h.nome} (${h.streak}d)`).join(', ') || 'nenhum'}`,
    `Projetos ativos: ${activeProjects.length}`,
  ].join('\n');

  try {
    const provider = getProvider();
    if (!provider.isAvailable()) return localDailyInsights(ctx);
    const raw = await provider.chatJSON<string[]>(systemPrompt, userMessage);
    if (Array.isArray(raw) && raw.length > 0) return raw.slice(0, 3);
    return localDailyInsights(ctx);
  } catch {
    return localDailyInsights(ctx);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// searchMemory()
// Busca semântica nas memórias, notas e ideias.
// ─────────────────────────────────────────────────────────────────────────────

export async function searchMemory(query: string): Promise<SemanticSearchResult[]> {
  return semanticSearch(query);
}

// ─────────────────────────────────────────────────────────────────────────────
// runRouter()
// Classifica o intent de qualquer mensagem de texto.
// ─────────────────────────────────────────────────────────────────────────────

export async function runRouter(text: string): Promise<RouterResult> {
  return routeMessage(text);
}

// ─────────────────────────────────────────────────────────────────────────────
// runTranscribe()
// Transcreve áudio para texto.
// ─────────────────────────────────────────────────────────────────────────────

export async function runTranscribe(audioBase64: string, mimeType = 'audio/webm'): Promise<string> {
  try {
    const provider = getProvider();
    if (!provider.isAvailable()) return '';

    // DeepSeek não tem suporte nativo a áudio, mas Gemini sim
    // Este endpoint usa inlineData — funciona com Gemini multimodal
    // Para DeepSeek puro, usar Whisper/Google Speech externo
    const result = await (provider as any).chatMultimodal?.(
      MEMORY_EXTRACT(),
      audioBase64,
      mimeType
    );
    return result || '';
  } catch (err: any) {
    console.error('[AICore] runTranscribe falhou:', err.message);
    return '';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// runOCR()
// Extrai texto e dados estruturados de imagem.
// ─────────────────────────────────────────────────────────────────────────────

export async function runOCR(imageBase64: string, mimeType = 'image/jpeg'): Promise<OCRResult> {
  try {
    const provider = getProvider();
    if (!provider.isAvailable()) return { isReceipt: false, text: 'IA não disponível' };

    const result = await (provider as any).chatMultimodal?.(
      MEMORY_OCR(),
      imageBase64,
      mimeType
    );

    if (!result) return { isReceipt: false, text: '' };

    try {
      const clean = result.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
      return JSON.parse(clean) as OCRResult;
    } catch {
      return { isReceipt: false, text: result };
    }
  } catch (err: any) {
    console.error('[AICore] runOCR falhou:', err.message);
    return { isReceipt: false, text: '' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallbacks locais (sem API)
// ─────────────────────────────────────────────────────────────────────────────

function localPersonaFallback(persona: any, message: string, ctx: AssembledContext): string {
  const { financial: fs, pendingTasks, goals, userProfile } = ctx;
  const name = userProfile.nome || 'você';
  const lower = message.toLowerCase();

  if (persona.id === 'cfo' || persona.nome?.toLowerCase().includes('cfo')) {
    if (lower.match(/gasto|despesa|gastei|paguei/)) {
      return `📊 **[CFO]** Computado. Saldo atual: **R$ ${fs.balance.toFixed(2)}**. Receitas: R$ ${fs.totalIncome.toFixed(2)} | Despesas: R$ ${fs.totalExpenses.toFixed(2)}. Maior categoria: **${fs.topCategory}**. Esse gasto está dentro do orçamento?`;
    }
    return `📊 **[CFO]** Entendido. Situação: saldo **R$ ${fs.balance.toFixed(2)}**, ${pendingTasks.length} tarefas, ${goals.length} metas. O que analisar?`;
  }

  if (persona.id === 'founder') {
    return `🚀 **[Founder]** Fala, ${name}! Registrado. ${pendingTasks.length} pendências no radar. Qual move a agulha hoje? Foco em execução.`;
  }

  if (persona.id === 'executor') {
    const urgent = pendingTasks.filter(t => t.prioridade === 'high');
    return `⚡ **[Executor]** Registrado. ${urgent.length > 0 ? `Urgente: **${urgent[0].titulo}**. ` : ''}${pendingTasks.length} tarefas. Próxima ação agora?`;
  }

  return `🧙 **[${persona.nome}]** Registrado. Saldo: **R$ ${fs.balance.toFixed(2)}** | Tarefas: ${pendingTasks.length}. Como avançar?`;
}

function localDailyInsights(ctx: AssembledContext): string[] {
  const { financial: fs, pendingTasks, goals, habits } = ctx;
  const urgent = pendingTasks.filter(t => t.prioridade === 'high');
  const bestHabit = habits.reduce((b, h) => h.streak > b.streak ? h : b, habits[0]);

  return [
    fs.balance >= 0
      ? `💰 Saldo positivo de R$ ${fs.balance.toFixed(2)}. Maior gasto: ${fs.topCategory}. Considere alocar parte para suas metas.`
      : `⚠️ Saldo negativo de R$ ${Math.abs(fs.balance).toFixed(2)}. Revise ${fs.topCategory} para equilibrar o caixa.`,
    urgent.length > 0
      ? `🔴 ${urgent.length} urgente(s): "${urgent[0].titulo}". Priorize antes do fim do dia.`
      : `📋 ${pendingTasks.length} tarefa(s) pendente(s). Escolha 3 para hoje e ignore o resto.`,
    bestHabit
      ? `🔥 Melhor streak: ${bestHabit.nome} com ${bestHabit.streak} dias. Não quebre hoje!`
      : goals[0]
        ? `🎯 Meta "${goals[0].titulo}": ${Math.round((goals[0].progresso / goals[0].meta) * 100)}% concluída.`
        : `🚀 Defina pelo menos 1 hábito ou meta para acompanhar o progresso.`,
  ];
}

function localFinancialReport(ctx: AssembledContext): string {
  const { financial: fs, goals, pendingTasks } = ctx;
  return `📊 **Relatório Financeiro**\n\nReceitas: R$ ${fs.totalIncome.toFixed(2)} | Despesas: R$ ${fs.totalExpenses.toFixed(2)} | **Saldo: R$ ${fs.balance.toFixed(2)}**\n\nMaior categoria de gasto: **${fs.topCategory}**. ${pendingTasks.length} tarefas pendentes. ${goals.length} metas ativas.\n\nConfigure a API DeepSeek para análises detalhadas com IA.`;
}
