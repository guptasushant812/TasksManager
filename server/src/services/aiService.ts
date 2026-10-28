import { GoogleGenAI } from '@google/genai';

export interface AiTaskRequestOptions {
  rawText: string;
  preferredProvider?: string;
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

export interface AiApiKeyErrorResult {
  apiKeyError: true;
  message: string;
}

export interface AiRateLimitResult {
  rateLimitExceeded: true;
  exhaustedProviders: string[];
  retryAfter?: string;
  message: string;
}

export type AiGenerateResult = AiSuccessResult | AiRateLimitResult | AiApiKeyErrorResult;

export function detectKeyProvider(apiKey?: string, explicitProvider?: string): 'gemini' | 'groq' | 'grok' {
  if (explicitProvider) {
    const p = explicitProvider.toLowerCase();
    if (p === 'groq') return 'groq';
    if (p === 'grok' || p === 'xai') return 'grok';
    if (p === 'gemini') return 'gemini';
  }
  if (!apiKey) return 'gemini';
  const trimmed = apiKey.trim();
  if (trimmed.startsWith('gsk_')) return 'groq';
  if (trimmed.startsWith('xai-')) return 'grok';
  return 'gemini';
}

async function callGemini(apiKey: string, model: string, prompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  try {
    const res = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    const text = (res?.text || '').trim();
    if (text) return text;
  } catch (err: any) {
    const msg = (err?.message || '').toLowerCase();
    const isAuth =
      msg.includes('api_key_invalid') ||
      msg.includes('api key not valid') ||
      msg.includes('unauthenticated') ||
      (msg.includes('invalid_argument') && msg.includes('api key')) ||
      err?.status === 400 && msg.includes('api key') ||
      err?.status === 401 ||
      err?.status === 403;

    if (isAuth) {
      const authErr: any = new Error('The API key provided for Google Gemini is invalid or unauthorized.');
      authErr.isAuthError = true;
      authErr.provider = 'gemini';
      throw authErr;
    }

    const isQuota =
      err?.status === 429 ||
      msg.includes('quota') ||
      msg.includes('resource_exhausted');

    if (isQuota) {
      const quotaErr: any = new Error(`Quota limit reached for ${model}.`);
      quotaErr.isQuotaError = true;
      throw quotaErr;
    }

    // Try interactions fallback only if generateContent is not supported on this model
    try {
      const interaction = await ai.interactions.create(
        { model, input: prompt },
        { maxRetries: 0 }
      );
      const text = (interaction?.output_text || '').trim();
      if (text) return text;
    } catch {
      // ignore interactions error and preserve initial generateContent failure
    }

    throw err;
  }

  throw new Error('Empty response from Gemini');
}

async function callGroq(apiKey: string, model: string, prompt: string): Promise<string> {
  const selectedModel = model && !model.toLowerCase().includes('grok') && !model.toLowerCase().includes('gemini')
    ? model
    : (process.env.GROQ_MODEL || 'openai/gpt-oss-120b');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errData: any = await res.json().catch(() => ({}));
      const errMsg = errData?.error?.message || errData?.message || `Groq API failed with status ${res.status}`;
      const err: any = new Error(errMsg);
      err.status = res.status;
      if (res.status === 401 || res.status === 403) {
        err.isAuthError = true;
      }
      if (res.status === 429) {
        err.isQuotaError = true;
      }
      throw err;
    }

    const data: any = await res.json();
    const text = data?.choices?.[0]?.message?.content || '';
    if (!text.trim()) throw new Error('Empty response from Groq');
    return text.trim();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callGrok(apiKey: string, model: string, prompt: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const chatRes = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || process.env.XAI_MODEL || 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    if (!chatRes.ok) {
      const errData: any = await chatRes.json().catch(() => ({}));
      const errMsg = errData?.error?.message || errData?.error || errData?.message || `xAI API failed with status ${chatRes.status}`;
      const err: any = new Error(errMsg);
      err.status = chatRes.status;
      if (chatRes.status === 401 || chatRes.status === 403 || errMsg.includes('permission-denied')) {
        err.isAuthError = true;
      }
      if (chatRes.status === 429) {
        err.isQuotaError = true;
      }
      throw err;
    }

    const chatData: any = await chatRes.json();
    const text = chatData?.choices?.[0]?.message?.content || '';
    if (!text.trim()) throw new Error('Empty response from Grok');
    return text.trim();
  } finally {
    clearTimeout(timeoutId);
  }
}

function getServerGeminiKeys(): string[] {
  const keys: string[] = [];
  for (const envName of ['GEMINI_API_KEY', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3', 'GEMINI_BACKUP_KEY']) {
    const k = process.env[envName];
    if (k && k.trim() && k !== 'your_gemini_api_key_here' && !keys.includes(k.trim())) {
      keys.push(k.trim());
    }
  }
  return keys;
}

interface AiCandidate {
  provider: 'gemini' | 'groq' | 'grok';
  name: string;
  model: string;
  isCustomKey?: boolean;
  call: () => Promise<string>;
}

export async function executeAiWithFallback(
  prompt: string,
  options: AiTaskRequestOptions
): Promise<AiGenerateResult> {
  const customKey = options.customApiKey?.trim();
  const customProvider = customKey ? detectKeyProvider(customKey, options.customProvider) : undefined;

  const serverGeminiKeys = getServerGeminiKeys();
  const groqKey = (customProvider === 'groq' ? customKey : undefined) || process.env.GROQ_API_KEY;
  const grokKey = (customProvider === 'grok' ? customKey : undefined) || process.env.XAI_API_KEY;

  const preferredGemini = options.preferredModel && !options.preferredModel.toLowerCase().includes('grok') && !options.preferredModel.toLowerCase().includes('groq')
    ? options.preferredModel
    : undefined;

  // Resilient Gemini model cascade avoiding single-point 503 bottlenecks
  const geminiModelChain = Array.from(new Set([
    preferredGemini,
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-3.8-flash',
  ].filter(Boolean))) as string[];

  const groqModel = options.preferredModel && (options.preferredModel.includes('gpt-oss') || options.preferredModel.includes('qwen') || options.preferredModel.includes('llama'))
    ? options.preferredModel
    : (process.env.GROQ_MODEL || 'openai/gpt-oss-120b');
  const grokModel = options.preferredModel && options.preferredModel.toLowerCase().includes('grok')
    ? options.preferredModel
    : (process.env.XAI_MODEL || 'grok-2-latest');

  const candidates: AiCandidate[] = [];

  // Prioritize user custom API key first
  if (customKey) {
    if (customProvider === 'gemini') {
      for (const m of geminiModelChain) {
        candidates.push({
          provider: 'gemini',
          name: `Custom Gemini (${m})`,
          model: m,
          isCustomKey: true,
          call: () => callGemini(customKey, m, prompt),
        });
      }
    } else if (customProvider === 'groq') {
      candidates.push({
        provider: 'groq',
        name: `Custom Groq (${groqModel})`,
        model: groqModel,
        isCustomKey: true,
        call: () => callGroq(customKey, groqModel, prompt),
      });
    } else if (customProvider === 'grok') {
      candidates.push({
        provider: 'grok',
        name: `Custom Grok (${grokModel})`,
        model: grokModel,
        isCustomKey: true,
        call: () => callGrok(customKey, grokModel, prompt),
      });
    }
  }

  // Server default keys
  for (let i = 0; i < serverGeminiKeys.length; i++) {
    const key = serverGeminiKeys[i];
    if (key === customKey) continue;
    for (const m of geminiModelChain.slice(0, 3)) {
      candidates.push({
        provider: 'gemini',
        name: i === 0 ? `Google Gemini (${m})` : `Google Gemini Backup ${i} (${m})`,
        model: m,
        isCustomKey: false,
        call: () => callGemini(key, m, prompt),
      });
    }
  }

  // Server Groq fallback
  if (groqKey && groqKey !== 'your_groq_api_key_here' && groqKey !== customKey) {
    candidates.push({
      provider: 'groq',
      name: `Groq (${groqModel})`,
      model: groqModel,
      isCustomKey: false,
      call: () => callGroq(groqKey, groqModel, prompt),
    });
    if (groqModel !== 'qwen/qwen3.8-27b') {
      candidates.push({
        provider: 'groq',
        name: 'Groq (qwen/qwen3.8-27b)',
        model: 'qwen/qwen3.8-27b',
        isCustomKey: false,
        call: () => callGroq(groqKey, 'qwen/qwen3.8-27b', prompt),
      });
    }
  }

  // Server Grok fallback
  if (grokKey && grokKey !== 'your_xai_api_key_here' && grokKey !== customKey) {
    candidates.push({
      provider: 'grok',
      name: `xAI Grok (${grokModel})`,
      model: grokModel,
      isCustomKey: false,
      call: () => callGrok(grokKey, grokModel, prompt),
    });
  }

  if (candidates.length === 0) {
    return {
      rateLimitExceeded: true,
      exhaustedProviders: ['Google Gemini', 'Groq', 'xAI Grok'],
      message: 'No valid AI provider API key configured on server or client.',
    };
  }

  const exhaustedProviders: string[] = [];
  let attempts = 0;
  const primaryName = candidates[0].name;

  for (const candidate of candidates) {
    attempts++;
    try {
      const text = await candidate.call();
      const fallbackTriggered = attempts > 1;
      return {
        text,
        providerUsed: candidate.provider,
        modelUsed: candidate.model,
        fallbackTriggered,
        fallbackReason: fallbackTriggered
          ? `${primaryName} was unavailable; automatically switched to ${candidate.name}.`
          : undefined,
      };
    } catch (err: any) {
      console.warn(`[AI Service] ${candidate.name} failed:`, err.message || err);
      exhaustedProviders.push(candidate.name);

      // If user entered a custom key and it failed authentication, stop and report immediately
      if (candidate.isCustomKey && err?.isAuthError) {
        return {
          apiKeyError: true,
          message: `The custom ${candidate.provider === 'gemini' ? 'Google Gemini' : candidate.provider} API key is invalid or unauthorized. Please verify your key on Google AI Studio.`,
        };
      }
    }
  }

  if (customKey) {
    return {
      rateLimitExceeded: true,
      exhaustedProviders,
      message: 'All AI models attempted with your custom key reached quota or rate limits. Please try again in a few moments.',
    };
  }

  return {
    rateLimitExceeded: true,
    exhaustedProviders,
    message: 'The free-tier daily request allowance on the default AI endpoint has reached its limit. Add your own free Gemini API key to continue without limits.',
  };
}

export function getAvailableAiProviders() {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
  const hasGroq = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here');
  const hasGrok = Boolean(process.env.XAI_API_KEY && process.env.XAI_API_KEY !== 'your_xai_api_key_here');

  return {
    providers: [
      {
        id: 'gemini',
        name: 'Google Gemini',
        status: hasGemini ? 'active' : 'not_configured',
        models: ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'],
        defaultModel: 'gemini-3.5-flash',
      },
      {
        id: 'groq',
        name: 'Groq (Ultra-Fast)',
        status: hasGroq ? 'active' : 'not_configured',
        models: ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b'],
        defaultModel: 'openai/gpt-oss-120b',
      },
      {
        id: 'grok',
        name: 'xAI Grok',
        status: hasGrok ? 'active' : 'not_configured',
        models: ['grok-2-latest'],
        defaultModel: 'grok-2-latest',
      },
    ],
    fallbackEnabled: (hasGemini && (hasGroq || hasGrok)) || (hasGroq && hasGrok),
  };
}
