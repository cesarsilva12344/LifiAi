/**
 * services/ai/router.ts
 *
 * CAMADA 1 — AI Router
 *
 * Recebe qualquer texto (Telegram, Dashboard, etc.)
 * e retorna um intent estruturado com os dados extraídos.
 *
 * Exemplo:
 *   input:  "Gastei R$ 50 no Uber"
 *   output: { intent: 'expense', extracted_data: { valor: 50, categoria: 'Transporte' }, confidence: 0.98 }
 *
 * Esta camada NÃO sabe nada sobre personas, memórias ou banco de dados.
 * Ela apenas classifica e extrai dados.
 */

import { getProvider } from './provider';
import { readDatabase } from '../../server/db';
import { ROUTER_CLASSIFY } from './prompt-registry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RouterResult {
  intent: string;
  extracted_data: Record<string, any>;
  explanation: string;
  confidence: number; // 0.0 – 1.0
}

// ---------------------------------------------------------------------------
// Main Router Function
// ---------------------------------------------------------------------------

export async function routeMessage(text: string): Promise<RouterResult> {
  const today = new Date().toISOString().split('T')[0];
  const userMessage = `Texto para classificar: "${text}"`;

  let accountsList = '';
  let cardsList = '';
  let categoriesList = '';

  try {
    const db = readDatabase();
    if (db.accounts && db.accounts.length > 0) {
      accountsList = db.accounts.map(a => `- Nome: "${a.nome}", ID: "${a.id}", Tipo: "${a.tipo}"`).join('\n');
    }
    if (db.creditCards && db.creditCards.length > 0) {
      cardsList = db.creditCards.map(c => `- Nome: "${c.nome}", ID: "${c.id}"`).join('\n');
    }
    if (db.categories && db.categories.length > 0) {
      categoriesList = db.categories.map(c => `- Nome: "${c.nome}", ID: "${c.id}", Tipo: "${c.tipo}"`).join('\n');
    }
  } catch (dbErr: any) {
    console.warn('[Router] Erro ao ler banco para mapear entidades no prompt:', dbErr.message);
  }

  const systemPrompt = ROUTER_CLASSIFY(today, accountsList, cardsList, categoriesList);

  try {
    const provider = getProvider();
    if (!provider.isAvailable()) {
      console.warn('[Router] Provedor IA indisponível — usando fallback heurístico.');
      return heuristicFallback(text, today);
    }

    const result = await provider.chatJSON<RouterResult>(systemPrompt, userMessage);

    // Validate and normalize
    return {
      intent: result.intent || 'note',
      extracted_data: result.extracted_data || {},
      explanation: result.explanation || 'Processado pelo AI Router.',
      confidence: Math.min(1, Math.max(0, result.confidence ?? 0.8)),
    };
  } catch (error: any) {
    console.error('[Router] Falha na classificação IA:', error.message);
    return heuristicFallback(text, today);
  }
}

// ---------------------------------------------------------------------------
// Heuristic Fallback (zero API dependency)
// ---------------------------------------------------------------------------

function heuristicFallback(text: string, today: string): RouterResult {
  const lower = text.toLowerCase();
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Expense
  if (lower.match(/gastei|paguei|comprei|compra|custou|r\$|\bpix\b saiu|débito|debitou/)) {
    const numMatch = text.match(/(\d[\d.,]*)/);
    const valor = numMatch ? parseFloat(numMatch[0].replace(',', '.')) : 0;
    return {
      intent: 'expense',
      extracted_data: {
        valor,
        categoria: lower.includes('uber') || lower.includes('taxi') ? 'Transporte'
          : lower.includes('comida') || lower.includes('restaurante') || lower.includes('lanche') ? 'Alimentação'
          : lower.includes('mercado') || lower.includes('supermercado') ? 'Mercado'
          : 'Geral',
        descricao: text.replace(/r\$\s*[\d,.]+/gi, '').trim(),
        data: today,
      },
      explanation: 'Padrão de despesa detectado (fallback).',
      confidence: 0.7,
    };
  }

  // Income
  if (lower.match(/recebi|ganhei|faturei|salário|pix recebido|depositou|faturamento/)) {
    const numMatch = text.match(/(\d[\d.,]*)/);
    return {
      intent: 'income',
      extracted_data: {
        valor: numMatch ? parseFloat(numMatch[0].replace(',', '.')) : 0,
        categoria: lower.includes('salário') ? 'Salário'
          : lower.includes('consultor') ? 'Consultoria' : 'Receita',
        descricao: text.trim(),
        data: today,
      },
      explanation: 'Padrão de receita detectado (fallback).',
      confidence: 0.7,
    };
  }

  // Task
  if (lower.match(/preciso|tenho que|devo|fazer|criar|desenvolver|terminar|entregar|prazo/)) {
    return {
      intent: 'task',
      extracted_data: {
        titulo: text.replace(/preciso|tenho que|devo|fazer|criar/gi, '').trim() || 'Nova Tarefa',
        prioridade: lower.includes('urgente') || lower.includes('importante') ? 'high' : 'medium',
        prazo: tomorrow,
        status: 'pending',
      },
      explanation: 'Padrão de tarefa detectado (fallback).',
      confidence: 0.65,
    };
  }

  // Reminder
  if (lower.match(/lembrar|lembrete|me lembra|agendar|reunião às|call às|às \d+h/)) {
    return {
      intent: 'reminder',
      extracted_data: {
        titulo: text.replace(/lembrar|me lembra de|lembrete/gi, '').trim(),
        data_hora: new Date(Date.now() + 3600000).toISOString(),
        status: 'active',
      },
      explanation: 'Padrão de lembrete detectado (fallback).',
      confidence: 0.65,
    };
  }

  // Idea
  if (lower.match(/ideia|e se|e se eu|insight|seria incrível|pensei em|lampejo/)) {
    return {
      intent: 'idea',
      extracted_data: { titulo: text.slice(0, 60).trim(), conteudo: text, score: 7 },
      explanation: 'Padrão de ideia detectado (fallback).',
      confidence: 0.6,
    };
  }

  // Habit
  if (lower.match(/meditei|treinei|academia|corri|li|estudei|fiz|completei|check/)) {
    return {
      intent: 'habit',
      extracted_data: {
        nome: text.replace(/meditei|treinei|fiz|completei/gi, '').trim() || 'Hábito diário',
        frequencia: 'diaria',
      },
      explanation: 'Padrão de hábito detectado (fallback).',
      confidence: 0.6,
    };
  }

  // Chat (questions / greetings)
  if (lower.match(/^\/|quem|como|onde|o que|por que|qual|ajuda|oi|olá|bom dia|boa tarde/)) {
    return {
      intent: 'chat',
      extracted_data: { conteudo: text },
      explanation: 'Mensagem conversacional (fallback).',
      confidence: 0.6,
    };
  }

  // Default: note
  return {
    intent: 'note',
    extracted_data: { conteudo: text, tags: [] },
    explanation: 'Classificado como anotação por falta de padrão específico (fallback).',
    confidence: 0.4,
  };
}
