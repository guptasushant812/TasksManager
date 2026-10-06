import { GoogleGenAI } from '@google/genai';

export interface AiTaskRequestOptions {
  rawText: string;
  preferredProvider?: 'auto' | 'gemini' | 'groq' | 'openrouter' | 'openai';
  preferredModel?: string;
  customApiKey?: string;
  customProvider?: string;
}

export interface AiSuccessResult {
  text: string;
  providerUsed: string;
  modelUsed: string;
  fallbackTriggered: boolean;
  fallbackReason?: string;
}

export interface AiRateLimitResult {
  rateLimitExceeded: true;
  exhaustedProviders: string[];
  retryAfter?: string;
  message: string;
}

export type AiGenerateResult = AiSuccessResult | AiRateLimitResult;

// ── Models & Providers Configuration ─────────────────────────────────────────

const GEMINI_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
];

const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
];

const OPENROUTER_MODELS = [
  'google/gemini-2.0-flash-exp:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'deepseek/deepseek-chat:free',
];

// Helper to gather all configured Gemini keys
function getGeminiKeys(customKey?: string): string[] {
  const keys: string[] = [];
  if (customKey && customKey.trim()) {
    keys.push(customKey.trim());
  }

  const primary = process.env.GEMINI_API_KEY;
  if (primary && primary !== 'your_gemini_api_key_here' && !keys.includes(primary)) {
    keys.push(primary);
  }

  // Check additional keys in environment
  for (const envVar of ['GEMINI_API_KEY_2', 'GEMINI_API_KEY_3', 'GEMINI_BACKUP_KEY']) {
    const k = process.env[envVar];
    if (k && !keys.includes(k)) {
      keys.push(k);
    }
  }

  // Support comma-separated GEMINI_API_KEYS
  if (process.env.GEMINI_API_KEYS) {
    const list = process.env.GEMINI_API_KEYS.split(',').map(s => s.trim()).filter(Boolean);
    for (const k of list) {
      if (!keys.includes(k)) keys.push(k);
    }
  }

  return keys;
}

// ── Call Google Gemini ───────────────────────────────────────────────────────
async function callGemini(apiKey: string, model: string, prompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const interaction = await ai.interactions.create({
    model,
    input: prompt,
  });

  const text = (interaction.output_text || '').trim();
  if (!text) throw new Error('Empty response from Gemini');
  return text;
}

// ── Call OpenAI-Compatible Endpoint (Groq / OpenRouter / OpenAI) ─────────────
async function callOpenAiCompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  prompt: string,
  extraHeaders: Record<string, string> = {}
): Promise<string> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    const err: any = new Error(`Provider API error (${res.status}): ${errText}`);
    err.status = res.status;
    err.rawResponse = errText;
    throw err;
  }

  const data = await res.json() as any;
  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('Empty completion from AI provider');
  }
  return content;
}

// ── Check if error is Rate Limit / Quota Exceeded ─────────────────────────────
function isRateLimitError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  const status = err.status || err.statusCode || (err.response && err.response.status);
  return (
    status === 429 ||
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('resource_exhausted') ||
    msg.includes('exceeded your current quota') ||
    msg.includes('requests per day')
  );
}

// Extract retry-after string if present
function extractRetryAfter(err: any): string | undefined {
  if (!err) return undefined;
  const msg = err.message || '';
  const match = msg.match(/retry in\s+([0-9a-zA-Z\s]+?)(?:\s+or|\.|$)/i);
  return match ? match[1].trim() : undefined;
}

// ── Master Generate Orchestrator with Intelligent Multi-AI Fallback ───────────
export async function executeAiWithFallback(
  prompt: string,
  options: AiTaskRequestOptions
): Promise<AiGenerateResult> {
  const exhaustedProviders: string[] = [];
  let detectedRetryAfter: string | undefined;

  // 1. Prepare candidates queue
  interface AiCandidate {
    provider: 'gemini' | 'groq' | 'openrouter' | 'openai';
    model: string;
    apiKey: string;
    name: string;
  }

  const candidates: AiCandidate[] = [];

  // Check if user provided custom key
  if (options.customApiKey && options.customApiKey.trim()) {
    const cProvider = (options.customProvider || 'gemini').toLowerCase();
    if (cProvider === 'groq') {
      candidates.push({
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        apiKey: options.customApiKey.trim(),
        name: 'User Custom Groq (Llama 3.3)',
      });
    } else if (cProvider === 'openrouter') {
      candidates.push({
        provider: 'openrouter',
        model: 'google/gemini-2.0-flash-exp:free',
        apiKey: options.customApiKey.trim(),
        name: 'User Custom OpenRouter',
      });
    } else {
      for (const m of GEMINI_MODELS) {
        candidates.push({
          provider: 'gemini',
          model: m,
          apiKey: options.customApiKey.trim(),
          name: `User Custom Gemini (${m})`,
        });
      }
    }
  }

  // Server Gemini Keys & Models
  const geminiKeys = getGeminiKeys();
  for (let keyIdx = 0; keyIdx < geminiKeys.length; keyIdx++) {
    const key = geminiKeys[keyIdx];
    const keyLabel = keyIdx === 0 ? 'Primary' : `Backup #${keyIdx}`;
    for (const m of GEMINI_MODELS) {
      candidates.push({
        provider: 'gemini',
        model: m,
        apiKey: key,
        name: `Gemini ${m} (${keyLabel})`,
      });
    }
  }

  // Server Groq (if configured)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && groqKey !== 'your_groq_api_key_here') {
    for (const m of GROQ_MODELS) {
      candidates.push({
        provider: 'groq',
        model: m,
        apiKey: groqKey,
        name: `Groq (${m})`,
      });
    }
  }

  // Server OpenRouter (if configured)
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey && openRouterKey !== 'your_openrouter_api_key_here') {
    for (const m of OPENROUTER_MODELS) {
      candidates.push({
        provider: 'openrouter',
        model: m,
        apiKey: openRouterKey,
        name: `OpenRouter (${m})`,
      });
    }
  }

  // If user requested a specific preferred model or provider, prioritize matching candidate
  if (options.preferredModel && options.preferredModel !== 'auto') {
    const idx = candidates.findIndex(c => c.model === options.preferredModel);
    if (idx > 0) {
      const [matched] = candidates.splice(idx, 1);
      candidates.unshift(matched);
    }
  }

  if (candidates.length === 0) {
    return {
      rateLimitExceeded: true,
      exhaustedProviders: ['No AI API keys configured'],
      message: 'No valid AI provider API key configured on server or client.',
    };
  }

  // 2. Iterate candidates with automatic fallback on rate limit / server error
  let lastError: any = null;
  let attempts = 0;
  let primaryName = candidates[0].name;

  for (const candidate of candidates) {
    attempts++;
    try {
      let output = '';
      if (candidate.provider === 'gemini') {
        output = await callGemini(candidate.apiKey, candidate.model, prompt);
      } else if (candidate.provider === 'groq') {
        output = await callOpenAiCompatible(
          'https://api.groq.com/openai/v1/chat/completions',
          candidate.apiKey,
          candidate.model,
          prompt
        );
      } else if (candidate.provider === 'openrouter') {
        output = await callOpenAiCompatible(
          'https://openrouter.ai/api/v1/chat/completions',
          candidate.apiKey,
          candidate.model,
          prompt,
          {
            'HTTP-Referer': 'https://tasksmanager.app',
            'X-Title': 'TasksManager AI',
          }
        );
      } else if (candidate.provider === 'openai') {
        output = await callOpenAiCompatible(
          'https://api.openai.com/v1/chat/completions',
          candidate.apiKey,
          candidate.model,
          prompt
        );
      }

      if (output) {
        const fallbackTriggered = attempts > 1;
        return {
          text: output,
          providerUsed: candidate.provider,
          modelUsed: candidate.model,
          fallbackTriggered,
          fallbackReason: fallbackTriggered
            ? `Primary ${primaryName} quota reached. Auto-switched to ${candidate.name}.`
            : undefined,
        };
      }
    } catch (err: any) {
      lastError = err;
      const isLimit = isRateLimitError(err);
      const retry = extractRetryAfter(err);
      if (retry && !detectedRetryAfter) detectedRetryAfter = retry;

      exhaustedProviders.push(`${candidate.name}${isLimit ? ' (Quota Limit)' : ''}`);
      console.warn(`[AI Fallback] ${candidate.name} failed: ${err.message}. Trying next candidate...`);

      // If error is 404 (model not found), or 429 (rate limit), continue immediately to next candidate
      continue;
    }
  }

  // If we reach here, all candidates failed
  return {
    rateLimitExceeded: true,
    exhaustedProviders,
    retryAfter: detectedRetryAfter,
    message: detectedRetryAfter
      ? `Daily request quota reached across AI models. Retry in ${detectedRetryAfter} or use an alternate AI key.`
      : `Daily request quota reached across configured AI models. You can add a personal free Gemini or Groq key to continue immediately.`,
  };
}

// ── Export Information on Available Providers ────────────────────────────────
export function getAvailableAiProviders() {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
  const hasGroq = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here');
  const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'your_openrouter_api_key_here');

  return {
    providers: [
      {
        id: 'gemini',
        name: 'Google Gemini',
        status: hasGemini ? 'active' : 'not_configured',
        models: GEMINI_MODELS,
        defaultModel: 'gemini-3.5-flash',
      },
      {
        id: 'groq',
        name: 'Groq (Ultra-Fast Llama 3.3)',
        status: hasGroq ? 'active' : 'optional',
        models: GROQ_MODELS,
        defaultModel: 'llama-3.3-70b-versatile',
      },
      {
        id: 'openrouter',
        name: 'OpenRouter (Multi-Model Hub)',
        status: hasOpenRouter ? 'active' : 'optional',
        models: OPENROUTER_MODELS,
        defaultModel: 'google/gemini-2.0-flash-exp:free',
      },
    ],
    fallbackEnabled: true,
  };
}
