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

export async function executeAiWithFallback(
  prompt: string,
  options: AiTaskRequestOptions
): Promise<AiGenerateResult> {
  const apiKey = options.customApiKey || process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return {
      rateLimitExceeded: true,
      exhaustedProviders: ['Google Gemini'],
      message: 'No valid AI provider API key configured on server or client.',
    };
  }

  const model = 'gemini-3.5-flash';

  try {
    const text = await callGemini(apiKey, model, prompt);
    return {
      text,
      providerUsed: 'gemini',
      modelUsed: model,
      fallbackTriggered: false,
    };
  } catch (err: any) {
    const msg = (err.message || '').toLowerCase();
    const status = err.status || err.statusCode || (err.response && err.response.status);
    const isLimit = status === 429 || msg.includes('429') || msg.includes('rate limit') || msg.includes('quota') || msg.includes('resource_exhausted');
    
    if (isLimit) {
      return {
        rateLimitExceeded: true,
        exhaustedProviders: ['Google Gemini'],
        message: 'Daily request quota reached for Gemini. Please try again later or provide a custom key.',
      };
    }
    
    throw err;
  }
}

export function getAvailableAiProviders() {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
  return {
    providers: [
      {
        id: 'gemini',
        name: 'Google Gemini',
        status: hasGemini ? 'active' : 'not_configured',
        models: ['gemini-3.5-flash'],
        defaultModel: 'gemini-3.5-flash',
      }
    ],
    fallbackEnabled: false,
  };
}
