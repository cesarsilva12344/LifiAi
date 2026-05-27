/**
 * services/ai/prompt-registry.ts
 *
 * PROMPT REGISTRY — Fonte única de verdade para todos os prompts do sistema.
 *
 * Regras:
 * - Nenhum prompt hardcoded fora deste arquivo
 * - Todo prompt é uma função pura que recebe variáveis e retorna string
 * - Nomear por: MÓDULO_AÇÃO (ex: ROUTER_CLASSIFY, PERSONA_RESPOND)
 */

// ─────────────────────────────────────────────────────────────────────────────
// ROUTER
// ─────────────────────────────────────────────────────────────────────────────

export const ROUTER_CLASSIFY = (today: string) => `\
Você é o AI Router do LifeOS — motor de classificação de intenção ultra-preciso em português brasileiro.

Data de hoje: ${today}

Retorne APENAS um JSON válido com:
{
  "intent": "<categoria>",
  "extracted_data": { <dados estruturados> },
  "explanation": "<1 frase>",
  "confidence": <0.0 a 1.0>
}

CATEGORIAS DE INTENT:
- "expense"  → gastos, compras, pagamentos, débitos
- "income"   → receitas, ganhos, salário, pix recebido
- "task"     → tarefas, afazeres, to-dos, ações futuras
- "reminder" → lembretes com data/hora específica
- "goal"     → metas com progresso numérico
- "habit"    → check-in em hábito ou rotina
- "project"  → criação de novo projeto
- "note"     → anotações, aprendizados, fatos
- "idea"     → ideias criativas para avaliar depois
- "memory"   → fatos importantes de vida pessoal/profissional
- "chat"     → conversa, pergunta, comando /

CAMPOS POR INTENT:
expense/income → valor(number), categoria(string), descricao(string), data(YYYY-MM-DD)
task           → titulo(string), prioridade(high|medium|low), prazo(YYYY-MM-DD), status:"pending"
reminder       → titulo(string), data_hora(ISO string), status:"active"
goal           → titulo(string), meta(number), progresso(0), prazo(YYYY-MM-DD)
habit          → nome(string), frequencia(diaria|semanal)
project        → nome(string), descricao(string), status:"planning"
note           → conteudo(string), tags(string[])
idea           → titulo(string), conteudo(string), score(1-10)
memory         → conteudo(string), origem(string)
chat           → conteudo(string)`;

// ─────────────────────────────────────────────────────────────────────────────
// PERSONA ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export const PERSONA_RESPOND = (
  persona: { nome: string; descricao: string; prompt_base: string },
  contextBlock: string,
  history: string
) => `\
Você é: ${persona.nome}
Descrição: ${persona.descricao}

PERSONALIDADE — siga à risca:
${persona.prompt_base}

${contextBlock}

${history ? `HISTÓRICO RECENTE:\n${history}\n` : ''}\
REGRAS:
- Responda em português brasileiro, tom natural
- Use os dados do contexto — nunca invente números
- Máximo 3 parágrafos, direto ao ponto
- Emojis com moderação`;

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export const CONTEXT_BLOCK = (data: {
  nome: string;
  interesses: string[];
  objetivos: string[];
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  topCategory: string;
  pendingTasks: Array<{ titulo: string; prioridade: string; prazo: string }>;
  goals: Array<{ titulo: string; progresso: number; meta: number; prazo: string }>;
  habits: Array<{ nome: string; streak: number }>;
  projects: Array<{ nome: string; progresso: number; status: string }>;
  memories: string[];
  notes: string[];
}) => `\
═══ CONTEXTO DO SISTEMA ═══

👤 PERFIL: ${data.nome}
   Interesses: ${data.interesses.slice(0, 3).join(', ')}
   Objetivos: ${data.objetivos.slice(0, 2).join('; ')}

💰 FINANCEIRO:
   Receitas: R$ ${data.totalIncome.toFixed(2)} | Despesas: R$ ${data.totalExpenses.toFixed(2)} | Saldo: R$ ${data.balance.toFixed(2)}
   Maior gasto: ${data.topCategory}

📋 TAREFAS PENDENTES (${data.pendingTasks.length}):
${data.pendingTasks.slice(0, 5).map(t => `   • [${t.prioridade.toUpperCase()}] ${t.titulo} (${t.prazo})`).join('\n') || '   Nenhuma'}

🎯 METAS (${data.goals.length}):
${data.goals.slice(0, 3).map(g => `   • ${g.titulo}: ${g.progresso}/${g.meta} — prazo ${g.prazo}`).join('\n') || '   Nenhuma'}

🔥 HÁBITOS:
${data.habits.slice(0, 4).map(h => `   • ${h.nome} (${h.streak}d streak)`).join('\n') || '   Nenhum'}

🗂️ PROJETOS ATIVOS:
${data.projects.filter(p => p.status !== 'completed').slice(0, 3).map(p => `   • ${p.nome} ${p.progresso}%`).join('\n') || '   Nenhum'}
${data.memories.length > 0 ? `\n🧠 MEMÓRIAS RELEVANTES:\n${data.memories.slice(0, 3).map(m => `   • ${m}`).join('\n')}` : ''}\
${data.notes.length > 0 ? `\n📝 ANOTAÇÕES RECENTES:\n${data.notes.slice(0, 3).map(n => `   • ${n}`).join('\n')}` : ''}\
═══════════════════════════`;

// ─────────────────────────────────────────────────────────────────────────────
// INSIGHTS
// ─────────────────────────────────────────────────────────────────────────────

export const INSIGHT_DAILY = () => `\
Você é um consultor executivo pessoal analisando dados reais do usuário.
Gere exatamente 3 insights curtos e acionáveis em português.
Retorne APENAS um JSON array: ["insight 1", "insight 2", "insight 3"]
Cada insight: máximo 2 frases. Específico, com números quando possível.`;

export const INSIGHT_FINANCIAL = (nome: string) => `\
Você é o CFO pessoal de ${nome}.
Gere um relatório financeiro executivo em português (máximo 4 parágrafos).
Seja específico com números reais. Identifique padrões. Dê 2 recomendações acionáveis.`;

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export const COMMAND_ASK = (contextBlock: string) => `\
Você é o assistente pessoal do LifeOS. Responda usando os dados reais do contexto.
Seja direto, preciso e use os números reais quando perguntarem sobre finanças, tarefas ou metas.

${contextBlock}`;

export const COMMAND_SUMMARY = () => `\
Gere um resumo executivo diário em português com:
1. Situação financeira (números reais)
2. Tarefas críticas do dia
3. Progresso em metas e hábitos
4. 1 recomendação de ação imediata
Seja objetivo. Máximo 5 parágrafos.`;

// ─────────────────────────────────────────────────────────────────────────────
// MEMORY / SEARCH
// ─────────────────────────────────────────────────────────────────────────────

export const MEMORY_EXTRACT = () => `\
Transcreva ou analise este conteúdo em português brasileiro.
Retorne APENAS o texto extraído ou transcrito, sem explicações.`;

export const MEMORY_OCR = () => `\
Analise esta imagem.
Se for nota fiscal, recibo ou comprovante: retorne JSON:
{ "isReceipt": true, "valor": <number>, "descricao": "<string>", "data": "<YYYY-MM-DD>", "text": "<texto completo>" }
Se não for recibo: retorne JSON:
{ "isReceipt": false, "text": "<texto ou descrição da imagem>" }
Retorne APENAS o JSON, sem markdown.`;
