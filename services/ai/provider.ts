/**
 * services/ai/provider.ts
 *
 * ÚNICA camada que sabe qual modelo de IA está sendo usado.
 * Suporta Qwen (70M tokens free, prioritário), DeepSeek e Gemini.
 *
 * API Key vem de (em ordem de prioridade):
 * 1. userProfile config (configurada no Dashboard)
 * 2. Variáveis de ambiente (.env, Vercel, etc.)
 */

import { getProfile } from '../../server/db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface AIProvider {
  chat(systemPrompt: string, userMessage: string, opts?: ChatOptions): Promise<string>;
  chatJSON<T = any>(systemPrompt: string, userMessage: string): Promise<T>;
  embed(text: string): Promise<number[] | null>;
  isAvailable(): boolean;
}

// ---------------------------------------------------------------------------
// DeepSeek Config
// ---------------------------------------------------------------------------
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';
const DEEPSEEK_CHAT_MODEL = 'deepseek-chat';

function getDeepSeekKey(): string | null {
  try {
    const profile = getProfile();
    const profileKey = profile?.deepseekApiKey;
    if (profileKey && profileKey.trim().length > 10) return profileKey.trim();
  } catch (_) { /* ignore */ }
  const envKey = process.env.DEEPSEEK_API_KEY;
  if (envKey && envKey.trim().length > 10) return envKey.trim();
  return null;
}

// ---------------------------------------------------------------------------
// Qwen Config (OpenAI-compatible)
// ---------------------------------------------------------------------------
function getQwenKey(): string | null {
  try {
    const profile = getProfile();
    const profileKey = profile?.qwenApiKey;
    if (profileKey && profileKey.trim().length > 10) return profileKey.trim();
  } catch (_) { /* ignore */ }
  const envKey = process.env.QWEN_API_KEY;
  if (envKey && envKey.trim().length > 10) return envKey.trim();
  return null;
}

function getQwenBaseUrl(): string {
  const envUrl = process.env.QWEN_BASE_URL;
  if (envUrl && envUrl.trim().length > 5) return envUrl.trim();
  return 'https://dashscope.aliyuncs.com/compatible-mode/v1'; // Default Alibaba DashScope
}

function getQwenModel(): string {
  const envModel = process.env.QWEN_MODEL;
  if (envModel && envModel.trim().length > 1) return envModel.trim();
  return 'qwen-plus'; // Default Alibaba model
}

// ---------------------------------------------------------------------------
// OpenAI-Compatible Request Executors
// ---------------------------------------------------------------------------

async function openAIChat(
  apiKey: string,
  baseUrl: string,
  model: string,
  systemPrompt: string,
  userMessage: string,
  opts: ChatOptions = {}
): Promise<string> {
  const body: any = {
    model: model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    temperature: opts.temperature ?? 0.4,
    max_tokens: opts.maxTokens ?? 2048,
  };

  if (opts.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI API error ${response.status}: ${errText}`);
  }

  const data = await response.json() as any;
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

async function deepseekChat(apiKey: string, systemPrompt: string, userMessage: string, opts: ChatOptions = {}): Promise<string> {
  return openAIChat(apiKey, DEEPSEEK_BASE_URL, DEEPSEEK_CHAT_MODEL, systemPrompt, userMessage, opts);
}

async function deepseekEmbed(apiKey: string, text: string): Promise<number[] | null> {
  try {
    const response = await fetch(`${DEEPSEEK_BASE_URL}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        input: text.slice(0, 8000),
      }),
    });

    if (!response.ok) return null;
    const data = await response.json() as any;
    return data.data?.[0]?.embedding ?? null;
  } catch (_) {
    return null;
  }
}

async function qwenChat(apiKey: string, baseUrl: string, model: string, systemPrompt: string, userMessage: string, opts: ChatOptions = {}): Promise<string> {
  return openAIChat(apiKey, baseUrl, model, systemPrompt, userMessage, opts);
}

async function qwenEmbed(apiKey: string, baseUrl: string, text: string): Promise<number[] | null> {
  try {
    const isDashScope = baseUrl.includes('dashscope.aliyuncs.com');
    // For Alibaba DashScope, compatible embedding model is text-embedding-v2
    const model = isDashScope ? 'text-embedding-v2' : 'qwen-plus';
    
    const response = await fetch(`${baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        input: text.slice(0, 8000),
      }),
    });

    if (!response.ok) return null;
    const data = await response.json() as any;
    return data.data?.[0]?.embedding ?? null;
  } catch (_) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Provider Singleton
// ---------------------------------------------------------------------------

export function getProvider(): AIProvider {
  const provider: AIProvider = {
    isAvailable(): boolean {
      return !!(getQwenKey() || getDeepSeekKey());
    },

    async chat(systemPrompt: string, userMessage: string, opts?: ChatOptions): Promise<string> {
      const qwenKey = getQwenKey();
      if (qwenKey) {
        try {
          return await qwenChat(qwenKey, getQwenBaseUrl(), getQwenModel(), systemPrompt, userMessage, opts);
        } catch (e) {
          console.warn('[AI Provider] Qwen chat failed, falling back to DeepSeek:', e);
        }
      }

      const deepseekKey = getDeepSeekKey();
      if (deepseekKey) {
        return deepseekChat(deepseekKey, systemPrompt, userMessage, opts);
      }
      throw new Error('AI_KEYS_MISSING');
    },

    async chatJSON<T = any>(systemPrompt: string, userMessage: string): Promise<T> {
      const qwenKey = getQwenKey();
      if (qwenKey) {
        try {
          const raw = await qwenChat(qwenKey, getQwenBaseUrl(), getQwenModel(), systemPrompt, userMessage, { jsonMode: true });
          const clean = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
          return JSON.parse(clean) as T;
        } catch (e) {
          console.warn('[AI Provider] Qwen JSON chat failed, falling back to DeepSeek:', e);
        }
      }

      const deepseekKey = getDeepSeekKey();
      if (deepseekKey) {
        const raw = await deepseekChat(deepseekKey, systemPrompt, userMessage, { jsonMode: true });
        const clean = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
        return JSON.parse(clean) as T;
      }
      throw new Error('AI_KEYS_MISSING');
    },

    async embed(text: string): Promise<number[] | null> {
      const qwenKey = getQwenKey();
      if (qwenKey) {
        const emb = await qwenEmbed(qwenKey, getQwenBaseUrl(), text);
        if (emb) return emb;
      }

      const deepseekKey = getDeepSeekKey();
      if (deepseekKey) {
        return deepseekEmbed(deepseekKey, text);
      }
      return null;
    },
  };

  return provider;
}
