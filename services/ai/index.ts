/**
 * services/ai/index.ts
 *
 * Ponto de entrada único do serviço de IA do LifeOS.
 *
 * ARQUITETURA EM CAMADAS:
 *
 *   [provider]  → abstração do modelo (DeepSeek)
 *   [router]    → Camada 1: classifica intent da mensagem
 *   [memory]    → Camada 3: monta contexto do banco antes de chamar IA
 *   [personas]  → Camada 2: gera resposta com persona ativa
 *   [insights]  → gera insights executivos para o Dashboard
 *
 * USO:
 *   import { routeMessage, generateResponse, buildContext, semanticSearch } from '../services/ai';
 *
 * Para trocar de DeepSeek para qualquer outro modelo:
 *   edite APENAS services/ai/provider.ts
 */

// Provider (único que conhece o modelo)
export { getProvider } from './provider';
export type { AIProvider, ChatOptions } from './provider';

// Camada 1 — Router
export { routeMessage } from './router';
export type { RouterResult } from './router';

// Camada 3 — Memory Engine
export { buildContext, semanticSearch, embed, cosineSimilarity, keywordScore } from './memory';
export type { MemoryContext, SemanticSearchResult } from './memory';

// Camada 2 — Persona Engine
export { generateResponse } from './personas';
export type { ChatHistoryItem } from './personas';

// Insights
export { generateDailyInsights, generateFinancialReport } from './insights';

// ─────────────────────────────────────────────────────────────────────────────
// Aliases de compatibilidade com server/ai.ts (para não quebrar server.ts)
// ─────────────────────────────────────────────────────────────────────────────

import { routeMessage } from './router';
import { buildContext, semanticSearch, embed } from './memory';
import { generateResponse } from './personas';
import { getProvider } from './provider';

/**
 * @deprecated Use routeMessage() from services/ai instead
 * Mantido apenas para compatibilidade com imports existentes em server.ts
 */
export async function classifyAndParseInput(text: string) {
  const result = await routeMessage(text);
  return {
    classification: result.intent,
    extracted_data: result.extracted_data,
    explanation: result.explanation,
  };
}

/**
 * @deprecated Use generateResponse() + buildContext() from services/ai instead
 */
export async function generatePersonaResponse(
  message: string,
  recentHistory: any[] = []
): Promise<string> {
  const context = await buildContext(message);
  const history = recentHistory.map((h: any) => ({
    sender: h.sender as 'user' | 'bot',
    text: h.text,
    timestamp: h.timestamp,
  }));
  return generateResponse(message, context, history);
}

/**
 * @deprecated Use embed() from services/ai/memory instead
 */
export const getEmbedding = embed;

/**
 * @deprecated Use getProvider() from services/ai/provider instead
 */
export const getAI = getProvider;
