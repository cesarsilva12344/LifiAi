/**
 * services/ai/personas.ts
 *
 * CAMADA 2 — Persona Engine
 *
 * Recebe uma mensagem + contexto (já montado pela Memory Layer)
 * e gera uma resposta contextualizada com a persona ativa.
 *
 * Esta camada NÃO busca dados do banco diretamente.
 * Ela apenas formata o prompt e chama o provedor.
 *
 * Fluxo:
 *   1. Recebe: message + context (MemoryContext)
 *   2. Formata: system prompt com persona + contexto completo
 *   3. Chama: provider.chat(...)
 *   4. Retorna: string de resposta
 */

import { getActivePersona } from '../../server/db';
import { getProvider } from './provider';
import type { MemoryContext } from './memory';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatHistoryItem {
  sender: 'user' | 'bot';
  text: string;
  timestamp?: string;
}

// ---------------------------------------------------------------------------
// Context Formatter
// ---------------------------------------------------------------------------

function formatContextBlock(ctx: MemoryContext): string {
  const { financialSummary: fs, pendingTasks, activeGoals, activeHabits, activeProjects, relevantMemories, relevantNotes, userProfile: p } = ctx;

  const lines: string[] = [
    '═══ DADOS DO SISTEMA (contexto para sua resposta) ═══',
    '',
    '👤 PERFIL DO USUÁRIO:',
    `   Nome: ${p.nome}`,
    `   Interesses: ${p.interesses?.join(', ') ?? 'não definidos'}`,
    `   Objetivos: ${p.objetivos?.join(', ') ?? 'não definidos'}`,
    p.contexto ? `   Contexto extra: ${p.contexto}` : '',
    '',
    '💰 FINANCEIRO:',
    `   Receitas: R$ ${fs.totalIncome.toFixed(2)} | Despesas: R$ ${fs.totalExpenses.toFixed(2)} | Saldo: R$ ${fs.balance.toFixed(2)}`,
    `   Categoria mais gastada: ${fs.topCategory}`,
    '',
    '📋 TAREFAS PENDENTES:',
    pendingTasks.length > 0
      ? pendingTasks.map(t => `   • [${t.prioridade.toUpperCase()}] ${t.titulo} (prazo: ${t.prazo})`).join('\n')
      : '   Nenhuma tarefa pendente.',
    '',
    '🎯 METAS ATIVAS:',
    activeGoals.length > 0
      ? activeGoals.map(g => `   • ${g.titulo}: ${g.progresso}/${g.meta} (prazo: ${g.prazo})`).join('\n')
      : '   Nenhuma meta cadastrada.',
    '',
    '🔥 HÁBITOS MONITORADOS:',
    activeHabits.length > 0
      ? activeHabits.map(h => `   • ${h.nome} (streak: ${h.streak} dias)`).join('\n')
      : '   Nenhum hábito registrado.',
    '',
    '🗂️ PROJETOS ATIVOS:',
    activeProjects.length > 0
      ? activeProjects.map(proj => `   • ${proj.nome} — ${proj.progresso}% concluído (${proj.status})`).join('\n')
      : '   Nenhum projeto ativo.',
    '',
  ];

  if (relevantMemories.length > 0) {
    lines.push('🧠 MEMÓRIAS RELEVANTES:');
    relevantMemories.forEach(m => lines.push(`   • ${m.conteudo.slice(0, 120)}...`));
    lines.push('');
  }

  if (relevantNotes.length > 0) {
    lines.push('📝 ANOTAÇÕES RELEVANTES:');
    relevantNotes.forEach(n => lines.push(`   • ${n.conteudo.slice(0, 120)}...`));
    lines.push('');
  }

  return lines.filter(l => l !== undefined).join('\n');
}

// ---------------------------------------------------------------------------
// Persona System Prompt Builder
// ---------------------------------------------------------------------------

function buildSystemPrompt(persona: any, context: MemoryContext): string {
  return `Você é a Persona Ativa: ${persona.nome}
Descrição: ${persona.descricao}

INSTRUÇÕES DE PERSONALIDADE (siga à risca):
${persona.prompt_base}

${formatContextBlock(context)}

REGRAS DE RESPOSTA:
- Responda SEMPRE em português brasileiro, de forma natural
- Use o contexto acima para dar respostas precisas e personalizadas
- Não invente dados financeiros ou de tarefas que não estejam no contexto
- Seja objetivo e direto, com no máximo 3-4 parágrafos
- Você pode usar emojis com moderação para tornar a resposta mais visual
- Se a pergunta for sobre dados específicos, cite os números exatos do contexto`;
}

// ---------------------------------------------------------------------------
// Main: Generate Persona Response
// ---------------------------------------------------------------------------

export async function generateResponse(
  message: string,
  context: MemoryContext,
  history: ChatHistoryItem[] = []
): Promise<string> {
  const persona = getActivePersona();

  const systemPrompt = buildSystemPrompt(persona, context);

  // Build user message including recent chat history for continuity
  const historyStr = history.slice(-6).map(h =>
    `${h.sender === 'user' ? 'Usuário' : persona.nome}: ${h.text}`
  ).join('\n');

  const userMessage = historyStr
    ? `HISTÓRICO RECENTE:\n${historyStr}\n\nMENSAGEM ATUAL DO USUÁRIO:\n"${message}"`
    : `"${message}"`;

  try {
    const provider = getProvider();
    if (!provider.isAvailable()) {
      return localPersonaFallback(persona, message, context);
    }

    const response = await provider.chat(systemPrompt, userMessage, {
      temperature: 0.6,
      maxTokens: 1024,
    });

    return response || localPersonaFallback(persona, message, context);
  } catch (error: any) {
    console.error('[Personas] Falha na resposta da persona:', error.message);
    return localPersonaFallback(persona, message, context);
  }
}

// ---------------------------------------------------------------------------
// Local Fallback (zero API dependency)
// ---------------------------------------------------------------------------

function localPersonaFallback(persona: any, message: string, ctx: MemoryContext): string {
  const lower = message.toLowerCase();
  const { financialSummary: fs, pendingTasks, activeGoals, userProfile } = ctx;
  const name = userProfile.nome || 'você';

  if (persona.id === 'cfo' || persona.nome?.toLowerCase().includes('cfo')) {
    if (lower.match(/gasto|despesa|gastei|paguei/)) {
      return `📊 **[CFO]** Despesa computada. Seu saldo atual é R$ ${fs.balance.toFixed(2)} (receitas: R$ ${fs.totalIncome.toFixed(2)} − despesas: R$ ${fs.totalExpenses.toFixed(2)}). Maior categoria de gasto: **${fs.topCategory}**. Recomendo revisar se esse gasto está alinhado com suas metas financeiras.`;
    }
    if (lower.match(/mês|resumo|como foi|financeiro/)) {
      return `📊 **[CFO — Relatório]** Situação atual: receitas **R$ ${fs.totalIncome.toFixed(2)}**, despesas **R$ ${fs.totalExpenses.toFixed(2)}**, saldo líquido **R$ ${fs.balance.toFixed(2)}**. ${pendingTasks.length} tarefas pendentes. ${activeGoals.length} metas ativas. Foco recomendado: ${activeGoals[0]?.titulo ?? 'definir metas financeiras'}.`;
    }
    return `📊 **[CFO]** Entendido. Do ponto de vista de capital, cada ação deve estar alinhada às suas metas. Saldo atual: **R$ ${fs.balance.toFixed(2)}**. O que mais posso analisar?`;
  }

  if (persona.id === 'founder' || persona.nome?.toLowerCase().includes('founder')) {
    return `🚀 **[Founder]** Fala, ${name}! Registrado no sistema. Lembre-se: execução > perfeição. Você tem **${pendingTasks.length}** tarefas pendentes e **${activeGoals.length}** metas no radar. Qual delas move mais a agulha hoje?`;
  }

  if (persona.id === 'executor' || persona.nome?.toLowerCase().includes('executor')) {
    const urgent = pendingTasks.filter(t => t.prioridade === 'high');
    return `⚡ **[Executor]** Registrado. ${urgent.length > 0 ? `URGENTE: ${urgent[0].titulo}.` : ''} ${pendingTasks.length} tarefas no backlog. Próximos 15 minutos: qual ação você pode riscar da lista agora?`;
  }

  return `🧙 **[${persona.nome}]** Recebido e registrado no sistema. Contexto atual: **${pendingTasks.length}** tarefas, saldo **R$ ${fs.balance.toFixed(2)}**. Como posso ajudar a avançar nos próximos passos?`;
}
