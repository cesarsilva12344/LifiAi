/**
 * server/ai.ts
 *
 * ⚠️  ARQUIVO DE COMPATIBILIDADE — Não edite a lógica aqui.
 *
 * Este arquivo foi refatorado. Toda a lógica de IA agora vive em:
 *   services/ai/
 *     ├── provider.ts   ← abstração do modelo (DeepSeek)
 *     ├── router.ts     ← Camada 1: classifica intent
 *     ├── memory.ts     ← Camada 3: contexto e busca semântica
 *     ├── personas.ts   ← Camada 2: respostas com persona
 *     ├── insights.ts   ← insights do dashboard
 *     └── index.ts      ← ponto de entrada
 *
 * Para trocar o modelo de IA (DeepSeek → OpenAI → Claude etc):
 *   edite APENAS services/ai/provider.ts
 */

export {
  classifyAndParseInput,
  generatePersonaResponse,
  getEmbedding,
  getAI,
  semanticSearch,
  cosineSimilarity,
  keywordScore as keywordSearchScoring,
} from '../services/ai/index';
