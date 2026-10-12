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

export interface AiRateLimitResult {
  rateLimitExceeded: true;
  exhaustedProviders: string[];
  retryAfter?: string;
  message: string;
}

export type AiGenerateResult = AiSuccessResult | AiRateLimitResult;

function detectKeyProvider(apiKey?: string, explicitProvider?: string): 'gemini' | 'groq' | 'grok' {
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
  const ai = new GoogleGenAI({ 
    apiKey,
    httpOptions: { timeout: 8000 }
  });

  // Try interactions endpoint first, falling back to generateContent for keys/models lacking interaction support
  try {
    const interaction = await ai.interactions.create({
      model,
      input: prompt,
    }, {
      maxRetries: 0,
      timeout: 8000,
    });
    const text = (interaction.output_text || '').trim();
    if (text) return text;
  } catch (err: any) {
    const msg = (err?.message || '').toLowerCase();
    if (
      msg.includes('quota') || 
      msg.includes('429') || 
      msg.includes('resource_exhausted') || 
      msg.includes('api_key_invalid') || 
      msg.includes('unauthenticated')
    ) {
      throw err;
    }
    const res = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    const text = (res?.text || '').trim();
    if (text) return text;
    throw err;
  }

  throw new Error('Empty response from Gemini');
}

async function callGroq(apiKey: string, model: string, prompt: string): Promise<string> {
  const selectedModel = model && !model.toLowerCase().includes('grok') && !model.toLowerCase().includes('gemini')
    ? model
    : (process.env.GROQ_MODEL || 'openai/gpt-oss-120b');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

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
  const timeoutId = setTimeout(() => controller.abort(), 8000);

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

  const primaryGeminiModel = options.preferredModel && !options.preferredModel.toLowerCase().includes('grok') && !options.preferredModel.toLowerCase().includes('groq')
    ? options.preferredModel
    : 'gemini-3.8-flash';
  const fallbackGeminiModel = primaryGeminiModel === 'gemini-3.5-flash-lite' ? 'gemini-3.8-flash' : 'gemini-3.5-flash-lite';

  const groqModel = options.preferredModel && (options.preferredModel.includes('gpt-oss') || options.preferredModel.includes('qwen') || options.preferredModel.includes('llama'))
    ? options.preferredModel
    : (process.env.GROQ_MODEL || 'openai/gpt-oss-120b');
  const grokModel = options.preferredModel && options.preferredModel.toLowerCase().includes('grok')
    ? options.preferredModel
    : (process.env.XAI_MODEL || 'grok-2-latest');

  const candidates: AiCandidate[] = [];

  // Prioritize user-entered custom key above all default keys
  if (customKey) {
    if (customProvider === 'gemini') {
      candidates.push({
        provider: 'gemini',
        name: `Custom Gemini (${primaryGeminiModel})`,
        model: primaryGeminiModel,
        call: () => callGemini(customKey, primaryGeminiModel, prompt),
      });
      candidates.push({
        provider: 'gemini',
        name: `Custom Gemini Fallback (${fallbackGeminiModel})`,
        model: fallbackGeminiModel,
        call: () => callGemini(customKey, fallbackGeminiModel, prompt),
      });
    } else if (customProvider === 'groq') {
      candidates.push({
        provider: 'groq',
        name: `Custom Groq (${groqModel})`,
        model: groqModel,
        call: () => callGroq(customKey, groqModel, prompt),
      });
    } else if (customProvider === 'grok') {
      candidates.push({
        provider: 'grok',
        name: `Custom Grok (${grokModel})`,
        model: grokModel,
        call: () => callGrok(customKey, grokModel, prompt),
      });
    }
  }

  // Server Gemini keys (try primary model, then fallback model for separate quota pools)
  for (let i = 0; i < serverGeminiKeys.length; i++) {
    const key = serverGeminiKeys[i];
    if (key === customKey) continue;
    candidates.push({
      provider: 'gemini',
      name: i === 0 ? `Google Gemini (${primaryGeminiModel})` : `Google Gemini Backup ${i} (${primaryGeminiModel})`,
      model: primaryGeminiModel,
      call: () => callGemini(key, primaryGeminiModel, prompt),
    });
    candidates.push({
      provider: 'gemini',
      name: i === 0 ? `Google Gemini Lite (${fallbackGeminiModel})` : `Google Gemini Backup ${i} Lite (${fallbackGeminiModel})`,
      model: fallbackGeminiModel,
      call: () => callGemini(key, fallbackGeminiModel, prompt),
    });
  }

  // Server Groq fallback
  if (groqKey && groqKey !== 'your_groq_api_key_here' && groqKey !== customKey) {
    candidates.push({
      provider: 'groq',
      name: `Groq (${groqModel})`,
      model: groqModel,
      call: () => callGroq(groqKey, groqModel, prompt),
    });
    if (groqModel !== 'qwen/qwen3.8-27b') {
      candidates.push({
        provider: 'groq',
        name: 'Groq (qwen/qwen3.8-27b)',
        model: 'qwen/qwen3.8-27b',
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
    }
  }

  return {
    rateLimitExceeded: true,
    exhaustedProviders,
    message: 'AI request limit reached on all configured engines. Please try again shortly or configure a custom API key.',
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
        models: ['gemini-3.8-flash', 'gemini-3.5-flash-lite'],
        defaultModel: 'gemini-3.8-flash',
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
