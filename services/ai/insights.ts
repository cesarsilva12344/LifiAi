/**
 * services/ai/insights.ts
 *
 * Gerador de insights executivos para o Dashboard.
 * Analisa os dados do usuário e gera análises inteligentes.
 *
 * Usado pelo HomeDashboard para exibir os cards de IA no topo.
 */

import { getProvider } from './provider';
import type { MemoryContext } from './memory';

// ---------------------------------------------------------------------------
// Daily Insights (cards do Dashboard)
// ---------------------------------------------------------------------------

export async function generateDailyInsights(ctx: MemoryContext): Promise<string[]> {
  const { financialSummary: fs, pendingTasks, activeGoals, activeHabits, activeProjects } = ctx;

  const systemPrompt = `Você é um consultor executivo pessoal analisando os dados do usuário.
Gere exatamente 3 insights curtos e acionáveis em português, em formato de array JSON.
Cada insight deve ter no máximo 2 frases. Seja direto, específico e útil.
Retorne APENAS o JSON array, sem markdown.
Exemplo: ["Insight 1.", "Insight 2.", "Insight 3."]`;

  const userMessage = `Dados do dia:
- Saldo: R$ ${fs.balance.toFixed(2)} (receitas: R$ ${fs.totalIncome.toFixed(2)}, despesas: R$ ${fs.totalExpenses.toFixed(2)})
- Categoria mais gastada: ${fs.topCategory}
- Tarefas pendentes: ${pendingTasks.length} (${pendingTasks.filter(t => t.prioridade === 'high').length} urgentes)
- Metas ativas: ${activeGoals.map(g => `${g.titulo} ${Math.round((g.progresso / g.meta) * 100)}%`).join(', ') || 'nenhuma'}
- Hábitos: ${activeHabits.map(h => `${h.nome} (${h.streak}d streak)`).join(', ') || 'nenhum'}
- Projetos: ${activeProjects.map(p => `${p.nome} ${p.progresso}%`).join(', ') || 'nenhum'}`;

  try {
    const provider = getProvider();
    if (!provider.isAvailable()) {
      return localInsightsFallback(ctx);
    }
    const result = await provider.chatJSON<string[]>(systemPrompt, userMessage);
    if (Array.isArray(result) && result.length > 0) return result.slice(0, 3);
    return localInsightsFallback(ctx);
  } catch (_) {
    return localInsightsFallback(ctx);
  }
}

function localInsightsFallback(ctx: MemoryContext): string[] {
  const { financialSummary: fs, pendingTasks, activeGoals, activeHabits } = ctx;
  const insights: string[] = [];

  // Financial insight
  if (fs.balance < 0) {
    insights.push(`⚠️ Saldo negativo de R$ ${Math.abs(fs.balance).toFixed(2)}. Revise as despesas em ${fs.topCategory} para equilibrar o caixa.`);
  } else if (fs.balance > 0) {
    insights.push(`💰 Saldo positivo de R$ ${fs.balance.toFixed(2)}. Maior gasto: ${fs.topCategory}. Considere alocar parte para suas metas.`);
  } else {
    insights.push(`📊 Finanças no zero a zero. Hora de registrar mais receitas ou cortar em ${fs.topCategory}.`);
  }

  // Task insight
  const urgent = pendingTasks.filter(t => t.prioridade === 'high');
  if (urgent.length > 0) {
    insights.push(`🔴 ${urgent.length} tarefa(s) urgente(s): "${urgent[0].titulo}". Priorize agora antes do fim do dia.`);
  } else if (pendingTasks.length > 0) {
    insights.push(`📋 ${pendingTasks.length} tarefa(s) pendente(s). Selecione 3 para focar hoje e ignore o restante.`);
  } else {
    insights.push(`✅ Nenhuma tarefa pendente. Ótimo momento para planejar a próxima semana.`);
  }

  // Habit/Goal insight
  const bestStreak = activeHabits.reduce((max, h) => h.streak > max.streak ? h : max, activeHabits[0]);
  if (bestStreak) {
    insights.push(`🔥 Melhor streak: ${bestStreak.nome} com ${bestStreak.streak} dias consecutivos. Não quebre a corrente hoje!`);
  } else if (activeGoals.length > 0) {
    const goal = activeGoals[0];
    const pct = Math.round((goal.progresso / goal.meta) * 100);
    insights.push(`🎯 Meta "${goal.titulo}": ${pct}% concluída. Prazo: ${goal.prazo}. Registre progresso hoje.`);
  } else {
    insights.push(`🚀 Sem hábitos ou metas cadastradas ainda. Defina pelo menos 1 meta para o mês.`);
  }

  return insights;
}

// ---------------------------------------------------------------------------
// Financial Report (análise financeira profunda)
// ---------------------------------------------------------------------------

export async function generateFinancialReport(ctx: MemoryContext): Promise<string> {
  const { recentExpenses, recentIncome, financialSummary: fs, userProfile } = ctx;

  const systemPrompt = `Você é o CFO pessoal de ${userProfile.nome}. 
Gere um relatório financeiro executivo conciso em português (máximo 4 parágrafos).
Seja específico com números, identifique padrões e dê 1-2 recomendações acionáveis.`;

  const topExpenses = recentExpenses
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5)
    .map(e => `${e.categoria}: R$ ${e.valor.toFixed(2)} (${e.descricao})`)
    .join('\n');

  const userMessage = `RESUMO FINANCEIRO:
Receitas totais: R$ ${fs.totalIncome.toFixed(2)}
Despesas totais: R$ ${fs.totalExpenses.toFixed(2)}
Saldo: R$ ${fs.balance.toFixed(2)}

TOP 5 MAIORES DESPESAS:
${topExpenses || 'Nenhuma despesa registrada'}

Categoria mais frequente: ${fs.topCategory}`;

  try {
    const provider = getProvider();
    if (!provider.isAvailable()) {
      return `📊 **Relatório CFO:** Receitas R$ ${fs.totalIncome.toFixed(2)}, Despesas R$ ${fs.totalExpenses.toFixed(2)}, Saldo R$ ${fs.balance.toFixed(2)}. Maior categoria: ${fs.topCategory}. Configure a API DeepSeek para análises detalhadas.`;
    }
    return await provider.chat(systemPrompt, userMessage, { temperature: 0.4 });
  } catch (_) {
    return `📊 Receitas: R$ ${fs.totalIncome.toFixed(2)} | Despesas: R$ ${fs.totalExpenses.toFixed(2)} | Saldo: R$ ${fs.balance.toFixed(2)}.`;
  }
}
