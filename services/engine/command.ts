/**
 * services/engine/command.ts
 *
 * COMMAND ENGINE
 *
 * Todo comando do Telegram passa por aqui. Sem exceção.
 * Nenhuma rota do server.ts faz parse de /comandos diretamente.
 *
 * Comandos suportados:
 *   /ask <pergunta>     → resposta da persona com contexto completo
 *   /hoje               → resumo do dia
 *   /resumo             → resumo semanal executivo
 *   /financeiro         → relatório financeiro completo
 *   /tasks              → lista de tarefas pendentes
 *   /metas              → progresso das metas
 *   /habitos            → status dos hábitos e streaks
 *   /projetos           → status dos projetos ativos
 *   /insights           → 3 insights do dashboard
 *   /status             → status do sistema (bot, IA, banco)
 *   /help               → lista de comandos
 */

import { runPersona, runInsight, runRouter, ChatHistoryItem } from '../ai/core';
import { getContext } from './context';
import { 
  createExpense, createIncome, createTask, createReminder, createGoal, 
  createHabit, createProject, createNote, createIdea, completeTask, checkHabit 
} from './action';
import { readDatabase, getProfile, updateActivePersona, getActivePersona } from '../../server/db';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CommandResult {
  response: string;
  handled: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// handleCommand()
// Recebe o texto bruto ("/ask qual meu saldo?") e retorna a resposta.
// ─────────────────────────────────────────────────────────────────────────────

export async function handleCommand(
  rawText: string,
  history: ChatHistoryItem[] = []
): Promise<CommandResult> {
  const trimmed = rawText.trim();
  if (!trimmed.startsWith('/')) return { response: '', handled: false };

  const [cmd, ...argParts] = trimmed.split(' ');
  const command = cmd.toLowerCase();
  const args = argParts.join(' ').trim();

  switch (command) {
    case '/ask':
      return handleAsk(args || 'Dê um resumo do meu dia', history);

    case '/hoje':
    case '/today':
      return handleHoje();

    case '/resumo':
    case '/summary':
      return handleResumo();

    case '/financeiro':
    case '/finance':
    case '/cfo':
      return handleFinanceiro();

    case '/tasks':
    case '/tarefas':
      return handleTasks();

    case '/metas':
    case '/goals':
      return handleMetas();

    case '/habitos':
    case '/habits':
      return handleHabitos();

    case '/projetos':
    case '/projects':
      return handleProjetos();

    case '/insights':
      return handleInsights();

    case '/status':
      return handleStatus();

    case '/help':
    case '/ajuda':
      return handleHelp();

    case '/agora':
      return handleAgora();

    case '/gasto':
      return handleGasto(args);

    case '/receita':
      return handleReceita(args);

    case '/tarefa':
      return handleTarefa(args);

    case '/concluir':
      return handleConcluir(args);

    case '/lembrete':
      return handleLembrete(args);

    case '/projeto':
      return handleProjeto(args);

    case '/meta':
      return handleMeta(args);

    case '/habito':
      return handleHabitoCreate(args);

    case '/check':
      return handleCheck(args);

    case '/nota':
      return handleNota(args);

    case '/ideia':
      return handleIdeia(args);

    case '/persona':
      return handlePersona(args);

    case '/personas':
      return handlePersonas();

    case '/perfil':
      return handlePerfil();

    default:
      return {
        response: `❓ Comando não reconhecido: \`${command}\`\n\nUse /help para ver os comandos disponíveis.`,
        handled: true,
      };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// isCommand() — helper para verificar se texto é um comando
// ─────────────────────────────────────────────────────────────────────────────

export function isCommand(text: string): boolean {
  return text.trim().startsWith('/');
}

// ─────────────────────────────────────────────────────────────────────────────
// Handlers individuais
// ─────────────────────────────────────────────────────────────────────────────

async function handleAsk(question: string, history: ChatHistoryItem[]): Promise<CommandResult> {
  const response = await runPersona(question, history);
  return { response, handled: true };
}

async function handleHoje(): Promise<CommandResult> {
  const ctx = await getContext();
  const { financial: fs, pendingTasks, habits, goals, userProfile } = ctx;
  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const urgent = pendingTasks.filter(t => t.prioridade === 'high');
  const todayStr = new Date().toISOString().split('T')[0];
  const habitsHoje = habits.filter(h => h.history?.includes(todayStr));

  const lines = [
    `📅 *${hoje.toUpperCase()}*`,
    ``,
    `💰 *Financeiro:* R$ ${fs.balance.toFixed(2)} de saldo (↑ R$ ${fs.totalIncome.toFixed(2)} | ↓ R$ ${fs.totalExpenses.toFixed(2)})`,
    ``,
    `📋 *Tarefas:* ${pendingTasks.length} pendentes${urgent.length > 0 ? ` — 🔴 ${urgent.length} urgente(s)` : ''}`,
    urgent.slice(0, 3).map(t => `   • ${t.titulo}`).join('\n'),
    ``,
    `🔥 *Hábitos hoje:* ${habitsHoje.length}/${habits.length} feitos`,
    habits.filter(h => !h.history?.includes(todayStr)).slice(0, 3).map(h => `   • ⬜ ${h.nome} (${h.streak}d streak)`).join('\n'),
    ``,
    goals.length > 0
      ? `🎯 *Meta em foco:* ${goals[0].titulo} — ${Math.round((goals[0].progresso / goals[0].meta) * 100)}%`
      : '',
    ``,
    `_${userProfile.appName} — Resumo Diário_`,
  ];

  return { response: lines.filter(l => l !== '').join('\n'), handled: true };
}

async function handleResumo(): Promise<CommandResult> {
  const response = await runPersona(
    'Faça um resumo executivo completo da minha semana: financeiro, tarefas, metas e hábitos. Seja específico com números.',
    []
  );
  return { response, handled: true };
}

async function handleFinanceiro(): Promise<CommandResult> {
  const insights = await runInsight('financial');
  return { response: insights[0] || 'Sem dados financeiros suficientes.', handled: true };
}

async function handleTasks(): Promise<CommandResult> {
  const ctx = await getContext();
  const { pendingTasks } = ctx;

  if (pendingTasks.length === 0) {
    return { response: '✅ Nenhuma tarefa pendente! Aproveite para planejar a próxima semana.', handled: true };
  }

  const byPriority: Record<string, typeof pendingTasks> = { high: [], medium: [], low: [] };
  pendingTasks.forEach(t => byPriority[t.prioridade]?.push(t));

  const lines = [
    `📋 *TAREFAS PENDENTES (${pendingTasks.length})*`,
    '',
    ...(byPriority.high.length > 0 ? [`🔴 *Alta prioridade:*`, ...byPriority.high.map(t => `   • ${t.titulo} (${t.prazo})`), ''] : []),
    ...(byPriority.medium.length > 0 ? [`🟡 *Média prioridade:*`, ...byPriority.medium.slice(0, 5).map(t => `   • ${t.titulo}`), ''] : []),
    ...(byPriority.low.length > 0 ? [`🟢 *Baixa prioridade:*`, ...byPriority.low.slice(0, 3).map(t => `   • ${t.titulo}`)] : []),
  ];

  return { response: lines.join('\n'), handled: true };
}

async function handleMetas(): Promise<CommandResult> {
  const ctx = await getContext();
  const { goals } = ctx;

  if (goals.length === 0) {
    return { response: '🎯 Nenhuma meta cadastrada. Envie "Meta: [objetivo] até [data]" para criar uma.', handled: true };
  }

  const lines = [
    `🎯 *METAS ATIVAS (${goals.length})*`,
    '',
    ...goals.map(g => {
      const pct = Math.round((g.progresso / g.meta) * 100);
      const bar = '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10));
      return `*${g.titulo}*\n${bar} ${pct}% (${g.progresso}/${g.meta})\nPrazo: ${g.prazo}\n`;
    }),
  ];

  return { response: lines.join('\n'), handled: true };
}

async function handleHabitos(): Promise<CommandResult> {
  const ctx = await getContext();
  const { habits } = ctx;
  const todayStr = new Date().toISOString().split('T')[0];

  if (habits.length === 0) {
    return { response: '🔥 Nenhum hábito cadastrado. Envie "Hábito: [nome]" para criar um.', handled: true };
  }

  const lines = [
    `🔥 *HÁBITOS (${habits.length})*`,
    '',
    ...habits.map(h => {
      const done = h.history?.includes(todayStr);
      return `${done ? '✅' : '⬜'} *${h.nome}* — streak: ${h.streak} dias`;
    }),
  ];

  return { response: lines.join('\n'), handled: true };
}

async function handleProjetos(): Promise<CommandResult> {
  const ctx = await getContext();
  const { activeProjects } = ctx;

  if (activeProjects.length === 0) {
    return { response: '🗂️ Nenhum projeto ativo. Envie "Projeto: [nome]" para criar um.', handled: true };
  }

  const lines = [
    `🗂️ *PROJETOS ATIVOS (${activeProjects.length})*`,
    '',
    ...activeProjects.map(p => {
      const bar = '█'.repeat(Math.round(p.progresso / 10)) + '░'.repeat(10 - Math.round(p.progresso / 10));
      return `*${p.nome}*\n${bar} ${p.progresso}% — ${p.status}\n`;
    }),
  ];

  return { response: lines.join('\n'), handled: true };
}

async function handleInsights(): Promise<CommandResult> {
  const insights = await runInsight('daily');
  const lines = [
    `✨ *INSIGHTS DO DIA*`,
    '',
    ...insights.map((ins, i) => `${i + 1}. ${ins}`),
  ];
  return { response: lines.join('\n'), handled: true };
}

async function handleStatus(): Promise<CommandResult> {
  const profile = getProfile();
  const hasDeepSeek = !!(profile.deepseekApiKey || process.env.DEEPSEEK_API_KEY);
  const hasBot = !!(profile.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN);
  const db = readDatabase();

  const lines = [
    `🤖 *STATUS DO SISTEMA*`,
    ``,
    `🧠 DeepSeek AI: ${hasDeepSeek ? '✅ Configurado' : '❌ Sem chave'}`,
    `✈️ Telegram Bot: ${hasBot ? '✅ Ativo' : '❌ Sem token'}`,
    ``,
    `📊 *Banco de dados:*`,
    `   📥 Inbox: ${db.inbox.length} itens`,
    `   💰 Despesas: ${db.expenses.length}`,
    `   💵 Receitas: ${db.income.length}`,
    `   📋 Tarefas: ${db.tasks.length} (${db.tasks.filter(t => t.status === 'pending').length} pendentes)`,
    `   🧠 Memórias: ${db.memories.length}`,
    `   📝 Notas: ${db.notes.length}`,
    ``,
    `_${profile.appName} v1.0 — Arquitetura Modular_`,
  ];

  return { response: lines.join('\n'), handled: true };
}

function handleHelp(): CommandResult {
  const profile = getProfile();
  const response = [
    `🤖 *${profile.appName} — Comandos*`,
    ``,
    `*Consultas:*`,
    `/ask [pergunta] — Pergunte qualquer coisa`,
    `/hoje — Resumo do dia`,
    `/resumo — Resumo semanal`,
    `/financeiro — Relatório financeiro`,
    `/tasks — Tarefas pendentes`,
    `/metas — Progresso das metas`,
    `/habitos — Status dos hábitos`,
    `/projetos — Projetos ativos`,
    `/insights — 3 insights do dia`,
    ``,
    `*Sistema:*`,
    `/status — Status do sistema`,
    `/help — Esta lista`,
    ``,
    `*Captura direta (sem comando):*`,
    `"Gastei R$ 50 no Uber" → despesa`,
    `"Preciso entregar o relatório" → tarefa`,
    `"Lembrar reunião às 15h" → lembrete`,
    `"Ideia: app de meditação" → ideia`,
  ].join('\n');

  return { response, handled: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Novas implementações de comandos de captura direta / utilitários
// ─────────────────────────────────────────────────────────────────────────────

async function handleGasto(args: string): Promise<CommandResult> {
  const [valorStr, categoria, ...descParts] = args.split(/\s+/);
  const valor = parseFloat(valorStr);
  if (isNaN(valor)) {
    return {
      response: `❌ **Uso incorreto**: /gasto [valor] [categoria] [descricao]\nExemplo: \`/gasto 45.90 Alimentacao Pizza de noite\``,
      handled: true
    };
  }
  const cat = categoria || 'Geral';
  const desc = descParts.join(' ') || 'Despesa registrada por comando';
  const result = await createExpense({ valor, categoria: cat, descricao: desc }, 'telegram');
  if (result.success && result.data) {
    return {
      response: `✅ **Despesa Inserida!**\n- **Valor**: R$ ${result.data.valor.toFixed(2)}\n- **Categoria**: ${result.data.categoria}\n- **Descrição**: ${result.data.descricao}\nSincronizado no seu Dashboard Financeiro.`,
      handled: true
    };
  }
  return { response: `❌ Erro ao criar despesa: ${result.error}`, handled: true };
}

async function handleReceita(args: string): Promise<CommandResult> {
  const [valorStr, categoria, ...descParts] = args.split(/\s+/);
  const valor = parseFloat(valorStr);
  if (isNaN(valor)) {
    return {
      response: `❌ **Uso incorreto**: /receita [valor] [categoria] [descricao]\nExemplo: \`/receita 3500 Freelance MVP Venda\``,
      handled: true
    };
  }
  const cat = categoria || 'Receita';
  const desc = descParts.join(' ') || 'Faturamento por comando';
  const result = await createIncome({ valor, categoria: cat, descricao: desc }, 'telegram');
  if (result.success && result.data) {
    return {
      response: `💵 **Receita Recebida!**\n- **Valor**: R$ ${result.data.valor.toFixed(2)}\n- **Categoria**: ${result.data.categoria}\n- **Descrição**: ${result.data.descricao}\nRegistrado no fluxo de caixa mensal.`,
      handled: true
    };
  }
  return { response: `❌ Erro ao criar receita: ${result.error}`, handled: true };
}

async function handleTarefa(args: string): Promise<CommandResult> {
  const parts = args.split(/\s+/);
  const priorityInput = parts[0]?.toLowerCase();
  const hasPriority = ['high', 'medium', 'low'].includes(priorityInput);
  const prioridade = hasPriority ? (priorityInput as 'high' | 'medium' | 'low') : 'medium';
  const titulo = hasPriority ? parts.slice(1).join(' ') : args;

  if (!titulo.trim()) {
    return {
      response: `❌ **Uso incorreto**: /tarefa [high|medium|low] [titulo]\nExemplo: \`/tarefa high Revisar contrato legal\``,
      handled: true
    };
  }

  const result = await createTask({ titulo, prioridade }, 'telegram');
  if (result.success && result.data) {
    return {
      response: `📋 **Tarefa Adicionada!**\n- **Título**: ${result.data.titulo}\n- **Prioridade**: ${result.data.prioridade.toUpperCase()}\nPronto para ação no centro de controle.`,
      handled: true
    };
  }
  return { response: `❌ Erro ao criar tarefa: ${result.error}`, handled: true };
}

async function handleConcluir(args: string): Promise<CommandResult> {
  if (!args.trim()) {
    return {
      response: `❌ **Uso incorreto**: /concluir [termo da tarefa]\nExemplo: \`/concluir contrato\``,
      handled: true
    };
  }
  const db = readDatabase();
  const matchedTask = db.tasks.find(t => 
    t.status === 'pending' && 
    t.titulo.toLowerCase().includes(args.toLowerCase())
  );
  if (matchedTask) {
    const result = await completeTask(matchedTask.id);
    if (result.success) {
      return {
        response: `✅ **Tarefa Concluída com Sucesso!**\n- \`${matchedTask.titulo}\` riscada da lista.`,
        handled: true
      };
    }
    return { response: `❌ Erro ao concluir tarefa: ${result.error}`, handled: true };
  }
  return { response: `❌ Nenhuma tarefa pendente bateu com a busca: "${args}"`, handled: true };
}

async function handleLembrete(args: string): Promise<CommandResult> {
  const [timeStr, ...descParts] = args.split(/\s+/);
  const titulo = descParts.join(' ');
  if (!titulo.trim() || !timeStr) {
    return {
      response: `❌ **Uso incorreto**: /lembrete [data_ou_hora] [titulo]\nExemplo: \`/lembrete 2026-05-27 Reunião MVP\``,
      handled: true
    };
  }

  const result = await createReminder({ titulo, data_hora: timeStr }, 'telegram');
  if (result.success && result.data) {
    return {
      response: `⏰ **Lembrete Ativado!**\n- **Título**: ${result.data.titulo}\n- **Data/Hora**: ${result.data.data_hora}`,
      handled: true
    };
  }
  return { response: `❌ Erro ao criar lembrete: ${result.error}`, handled: true };
}

async function handleProjeto(args: string): Promise<CommandResult> {
  if (!args.trim()) {
    return { response: `❌ **Uso incorreto**: /projeto [nome_do_projeto]`, handled: true };
  }
  const result = await createProject({ nome: args, descricao: 'Criado via linha de comando Telegram.' }, 'telegram');
  if (result.success && result.data) {
    return {
      response: `📂 **Novo Projeto em Planejamento**: \`${result.data.nome}\` cadastrado no LifeOS.`,
      handled: true
    };
  }
  return { response: `❌ Erro ao criar projeto: ${result.error}`, handled: true };
}

async function handleMeta(args: string): Promise<CommandResult> {
  const [targetStr, ...titleParts] = args.split(/\s+/);
  const targetNum = parseFloat(targetStr);
  const titulo = titleParts.join(' ');
  if (isNaN(targetNum) || !titulo.trim()) {
    return { response: `❌ **Uso incorreto**: /meta [num_alvo] [titulo_da_meta]`, handled: true };
  }
  const result = await createGoal({ titulo, meta: targetNum }, 'telegram');
  if (result.success && result.data) {
    return {
      response: `🎯 **Nova Meta Traçada!**\n- **Meta**: ${result.data.meta}\n- **Título**: ${result.data.titulo}`,
      handled: true
    };
  }
  return { response: `❌ Erro ao criar meta: ${result.error}`, handled: true };
}

async function handleHabitoCreate(args: string): Promise<CommandResult> {
  if (!args.trim()) {
    return { response: `❌ **Uso incorreto**: /habito [nome_habito]`, handled: true };
  }
  const result = await createHabit({ nome: args }, 'telegram');
  if (result.success && result.data) {
    return {
      response: `🔥 **Hábito Instalado no Sistema de Rotinas**: \`${result.data.nome}\` cadastrado.`,
      handled: true
    };
  }
  return { response: `❌ Erro ao criar hábito: ${result.error}`, handled: true };
}

async function handleCheck(args: string): Promise<CommandResult> {
  if (!args.trim()) {
    return { response: `❌ **Uso incorreto**: /check [nome_habito]`, handled: true };
  }
  const db = readDatabase();
  const habit = db.habits.find(h => h.nome.toLowerCase().includes(args.toLowerCase()));
  if (habit) {
    const result = await checkHabit(habit.id);
    if (result.success && result.data) {
      return {
        response: `🔥 **Check-in concluído!**\n- Hábito: **${result.data.nome}**\n- Seu streak atual: **${result.data.streak} dias** consistentes!`,
        handled: true
      };
    }
    return { response: `❌ Erro ao realizar check-in: ${result.error}`, handled: true };
  }
  return { response: `❌ Nenhum hábito com o nome "${args}" foi localizado.`, handled: true };
}

async function handleNota(args: string): Promise<CommandResult> {
  if (!args.trim()) {
    return { response: `❌ **Uso incorreto**: /nota [conteúdo da nota]`, handled: true };
  }
  const result = await createNote({ conteudo: args, tags: ['Telegram'] }, 'telegram');
  if (result.success) {
    return {
      response: `📝 **Anotado!** Adicionei essa nota ao seu Segundo Cérebro.`,
      handled: true
    };
  }
  return { response: `❌ Erro ao criar nota: ${result.error}`, handled: true };
}

async function handleIdeia(args: string): Promise<CommandResult> {
  if (!args.trim()) {
    return { response: `❌ **Uso incorreto**: /ideia [titulo]`, handled: true };
  }
  const result = await createIdea({ titulo: args, conteudo: 'Ideia capturada via Telegram.' }, 'telegram');
  if (result.success && result.data) {
    return {
      response: `💡 **Ideia Coletada!**\n- Título: \`${result.data.titulo}\` cadastrada para avaliação de score futuro.`,
      handled: true
    };
  }
  return { response: `❌ Erro ao criar ideia: ${result.error}`, handled: true };
}

async function handlePersona(args: string): Promise<CommandResult> {
  const updated = updateActivePersona(args.toLowerCase());
  if (updated) {
    return {
      response: `🔄 **Persona alterada com sucesso!**\n- Ativa agora: **${updated.nome}**\n- *"${updated.prompt_base.slice(0, 100)}..."*`,
      handled: true
    };
  }
  return {
    response: `❌ Persona "${args}" não encontrada. Disponíveis: cfo, founder, mentor, executor, conselheiro, analista, cos`,
    handled: true
  };
}

async function handlePersonas(): Promise<CommandResult> {
  const db = readDatabase();
  const list = db.personas.map(p => `${p.ativa ? '🟢' : '⚪'} **${p.nome}** (${p.id}): ${p.descricao}`).join('\n');
  return {
    response: `👥 **Personas disponíveis de LifeOS AI:**\n\n${list}`,
    handled: true
  };
}

async function handlePerfil(): Promise<CommandResult> {
  const profile = getProfile();
  const response = `👤 **Perfil do Usuário (${profile.nome})**:\n\n` +
          `🎯 **Objetivos**:\n- ${profile.objetivos.join('\n- ')}\n\n` +
          `🧠 **Interesses**:\n- ${profile.interesses.join('\n- ')}\n\n` +
          `⚙️ **Preferências**:\n- ${profile.preferencias.join('\n- ')}\n\n` +
          `💼 **Contexto Geral**: *${profile.contexto}*`;
  return { response, handled: true };
}

async function handleAgora(): Promise<CommandResult> {
  const db = readDatabase();
  const highTasks = db.tasks.filter(t => t.status === 'pending' && t.prioridade === 'high');
  const reminders = db.reminders.filter(r => r.status === 'active');
  
  const reply = `⚡ **Ação Imediata - Foco Agora!**\n\n` +
          `🚨 **Prioridades Cruciais (${highTasks.length})**:\n- ` +
          (highTasks.map(t => `${t.titulo} (Prazo: ${t.prazo})`).join('\n- ') || 'Sem tarefas urgentes no topo. Excelente!\n') +
          `\n⏰ **Agenda Próxima**:\n- ` +
          (reminders.map(r => `${r.titulo} (Horário: ${new Date(r.data_hora).toLocaleTimeString()})`).join('\n- ') || 'Nenhum lembrete imediato.\n') +
          `\n*Dica do Executor: Escreva /concluir [termo] para riscar uma tarefa.*`;
  return { response: reply, handled: true };
}
