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

async function callGrok(apiKey: string, model: string, prompt: string): Promise<string> {
  // Try modern xAI Responses API first
  try {
    const res = await fetch('https://api.x.ai/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'grok-4.7',
        input: prompt,
      }),
    });

    if (res.ok) {
      const data: any = await res.json();
      const text =
        data?.output_text ||
        (Array.isArray(data?.output) && data.output.map((o: any) => o?.text || o?.content || '').join('')) ||
        data?.text ||
        '';
      if (text.trim()) return text.trim();
    } else {
      const errData: any = await res.json().catch(() => ({}));
      const errMsg = errData?.error?.message || errData?.error || errData?.message;
      if (errMsg && (errMsg.includes('permission') || errMsg.includes('credit') || errMsg.includes('license') || errMsg.includes('quota'))) {
        throw new Error(errMsg);
      }
    }
  } catch (err: any) {
    if (err.message && (err.message.includes('permission') || err.message.includes('credit') || err.message.includes('license') || err.message.includes('quota'))) {
      throw err;
    }
  }

  // Fallback to OpenAI-compatible chat completions
  const chatRes = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'grok-4.7',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    }),
  });

  if (!chatRes.ok) {
    const errData: any = await chatRes.json().catch(() => ({}));
    throw new Error(errData?.error?.message || errData?.error || errData?.message || `xAI API failed with status ${chatRes.status}`);
  }

  const chatData: any = await chatRes.json();
  const text = chatData?.choices?.[0]?.message?.content || '';
  if (!text.trim()) throw new Error('Empty response from Grok');
  return text.trim();
}

export async function executeAiWithFallback(
  prompt: string,
  options: AiTaskRequestOptions
): Promise<AiGenerateResult> {
  const customProvider = (options.customProvider || '').toLowerCase();
  const geminiKey = (customProvider === 'gemini' ? options.customApiKey : undefined) || process.env.GEMINI_API_KEY;
  const grokKey = (customProvider === 'grok' || customProvider === 'xai' ? options.customApiKey : undefined) || process.env.XAI_API_KEY;

  const isGrokExplicit =
    options.preferredProvider === 'grok' ||
    customProvider === 'grok' ||
    customProvider === 'xai' ||
    Boolean(options.preferredModel && options.preferredModel.toLowerCase().includes('grok'));

  const geminiModel = options.preferredModel && !options.preferredModel.toLowerCase().includes('grok')
    ? options.preferredModel
    : 'gemini-3.8-flash';
  const grokModel = options.preferredModel && options.preferredModel.toLowerCase().includes('grok')
    ? options.preferredModel
    : (process.env.XAI_MODEL || 'grok-4.7');

  if (!geminiKey && !grokKey) {
    return {
      rateLimitExceeded: true,
      exhaustedProviders: ['Google Gemini', 'xAI Grok'],
      message: 'No valid AI provider API key configured on server or client.',
    };
  }

  // If user explicitly chose Grok
  if (isGrokExplicit) {
    if (!grokKey) {
      return {
        rateLimitExceeded: true,
        exhaustedProviders: ['xAI Grok'],
        message: 'No xAI / Grok API key configured on server or client.',
      };
    }
    try {
      const text = await callGrok(grokKey, grokModel, prompt);
      return {
        text,
        providerUsed: 'grok',
        modelUsed: grokModel,
        fallbackTriggered: false,
      };
    } catch (grokErr: any) {
      if (geminiKey && geminiKey !== 'your_gemini_api_key_here') {
        try {
          const text = await callGemini(geminiKey, geminiModel, prompt);
          return {
            text,
            providerUsed: 'gemini',
            modelUsed: geminiModel,
            fallbackTriggered: true,
            fallbackReason: `Grok failed (${grokErr.message || 'unknown error'}), automatically switched to Gemini.`,
          };
        } catch {}
      }
      return {
        rateLimitExceeded: true,
        exhaustedProviders: ['xAI Grok'],
        message: grokErr.message || 'xAI Grok request failed.',
      };
    }
  }

  // Primary path: Try Gemini first
  let geminiError: any = null;
  if (geminiKey && geminiKey !== 'your_gemini_api_key_here') {
    try {
      const text = await callGemini(geminiKey, geminiModel, prompt);
      return {
        text,
        providerUsed: 'gemini',
        modelUsed: geminiModel,
        fallbackTriggered: false,
      };
    } catch (err: any) {
      geminiError = err;
      console.warn('[AI Service] Gemini call failed, attempting fallback to Grok:', err.message || err);
    }
  } else {
    geminiError = new Error('Gemini key is not configured.');
  }

  // Fallback to Grok if Gemini is rate limited, busy, or errored
  if (grokKey && grokKey !== 'your_xai_api_key_here') {
    try {
      const text = await callGrok(grokKey, grokModel, prompt);
      return {
        text,
        providerUsed: 'grok',
        modelUsed: grokModel,
        fallbackTriggered: true,
        fallbackReason: `Gemini was unavailable (${geminiError?.message || 'limit reached'}), automatically switched to Grok.`,
      };
    } catch (grokErr: any) {
      console.error('[AI Service] Grok fallback also failed:', grokErr.message || grokErr);
      const isCreditOrQuota = (grokErr.message || '').toLowerCase().includes('credit') ||
        (grokErr.message || '').toLowerCase().includes('permission') ||
        (grokErr.message || '').toLowerCase().includes('quota') ||
        (grokErr.message || '').toLowerCase().includes('rate limit');

      return {
        rateLimitExceeded: true,
        exhaustedProviders: ['Google Gemini', 'xAI Grok'],
        message: isCreditOrQuota
          ? `Gemini quota reached and xAI Grok returned: ${grokErr.message}`
          : 'Both Gemini and Grok are currently unavailable or have reached their request limits.',
      };
    }
  }

  // If Grok key is not configured, format Gemini limit error
  const msg = (geminiError?.message || '').toLowerCase();
  const status = geminiError?.status || geminiError?.statusCode || (geminiError?.response && geminiError.response.status);
  const isLimit = status === 429 || msg.includes('429') || msg.includes('rate limit') || msg.includes('quota') || msg.includes('resource_exhausted');

  if (isLimit) {
    return {
      rateLimitExceeded: true,
      exhaustedProviders: ['Google Gemini'],
      message: 'Daily request quota reached for Gemini. Please try again later or provide a custom key.',
    };
  }

  throw geminiError;
}

export function getAvailableAiProviders() {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
  const hasGrok = Boolean(process.env.XAI_API_KEY && process.env.XAI_API_KEY !== 'your_xai_api_key_here');
  return {
    providers: [
      {
        id: 'gemini',
        name: 'Google Gemini',
        status: hasGemini ? 'active' : 'not_configured',
        models: ['gemini-3.8-flash'],
        defaultModel: 'gemini-3.8-flash',
      },
      {
        id: 'grok',
        name: 'xAI Grok',
        status: hasGrok ? 'active' : 'not_configured',
        models: ['grok-4.7'],
        defaultModel: 'grok-4.7',
      },
    ],
    fallbackEnabled: hasGemini && hasGrok,
  };
}
