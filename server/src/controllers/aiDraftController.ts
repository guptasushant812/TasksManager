import { Request, Response, NextFunction } from 'express';
import { GoogleGenAI } from '@google/genai';

const SYSTEM_PROMPT = `You are a professional task extraction assistant for a daily timesheet task manager system.

The user will give you free-form text describing one or more work tasks. The input may be:
- Written in Marathi (मराठी), Marathi in English script/format (Roman Marathi like "kam kela", "HOD sir ni sangitla", "baki aahe", etc.), Hindi, Hinglish (Roman Hindi), or English.
- Informal, conversational, or fragmented (e.g. WhatsApp/message style)
- Numbered (1, 2, 3) or lettered (a, b, c sub-tasks)
- A single sentence or multiple paragraphs

YOUR JOB:
1. Identify EACH separate main task (usually numbered 1, 2, 3).
2. If a main task has sub-tasks (like a, b, c or indented bullets), DO NOT create separate task objects for them. Instead, merge all sub-tasks cleanly into the single main task's "description" field as bullet points.
3. Extract and structure everything into clean, professional English using simple, concise, layman terms (no jargon).
4. Translate any Marathi, Roman Marathi (Marathi in English format), Hindi, or Hinglish content into clean, fluent, professional English.
5. Return a JSON array of task objects — one object per main task.

Return ONLY a valid JSON array (no markdown, no code blocks, no explanation):
[
  {
    "title": "string - short clear task title in English (max 8 words)",
    "description": "string - full details of what was done, including any sub-tasks as bullet points in English",
    "givenBy": "string - person who assigned it (if mentioned, e.g., 'Sachin sir', 'HOD sir'), else empty string",
    "contactPerson": "string - person to follow up with or contact regarding this task (if mentioned), else empty string",
    "priority": "High | Medium | Low",
    "workStatus": "InProgress | Pending | Completed",
    "reason": "string - why it is pending/delayed translated to English, empty if completed",
    "remarks": "string - what was accomplished (for Completed tasks) translated to English, empty if not completed",
    "date": "string - ISO date YYYY-MM-DD (e.g. today's date if 'aaj', 'today', etc. is mentioned), empty if not",
    "dueDate": "string - ISO date YYYY-MM-DD if a deadline is mentioned, empty if not"
  }
]

STRICT RULES:
- LANGUAGE SUPPORT: The user can provide instructions in Marathi (मराठी), Marathi in English format (Roman Marathi, e.g. "aaj he kam kela", "HOD sir ni sangitla", "file submit keli", "pending aahe"), Hinglish, Hindi, or English. Always translate all extracted task titles, descriptions, reasons, and remarks into natural professional English.
- AUTO-FILL LOGIC:
  * If the user indicates pending (e.g. "pending", "baaki aahe", "baaki hai", "rahilay", "thambavlay", "waiting") -> set workStatus to "Pending".
  * If the user indicates ongoing work (e.g. "in progress", "chalu aahe", "karat aahe", "kar raha hu", "ongoing") -> set workStatus to "InProgress".
  * If the user speaks in past tense or indicates done (e.g. "kela", "jhala", "kiya", "done", "completed", "submit kela", "pathavla") -> set workStatus to "Completed".
- PRIORITY: If they mention "high", "low", "mid/medium", "urgent", "mahatvacha", use that. Otherwise, infer based on urgency (exam/inspection/audit = High).
- REASON: If they mention *why* a task is pending or delayed, extract and translate that into the "reason" field in clean English.
- SUB-TASKS: Remember, sub-tasks (a, b, c) MUST be inside the parent task's description. Do NOT create separate objects for sub-tasks.
- The response must be a valid parseable JSON array ONLY — nothing else.`;

// ── Sanitization and Validation Helper ─────────────────────────────────────────
function sanitizeDraft(d: Record<string, any>, today: string): Record<string, string> {
  const fields = ['title', 'description', 'givenBy', 'contactPerson', 'priority', 'workStatus', 'reason', 'remarks', 'date', 'dueDate'];
  for (const f of fields) {
    if (typeof d[f] !== 'string') {
      d[f] = d[f] != null ? String(d[f]) : '';
    }
    d[f] = d[f].trim();
  }

  // WorkStatus normalization
  const validStatus = ['Completed', 'InProgress', 'Pending'];
  if (!validStatus.includes(d.workStatus)) {
    const s = d.workStatus.toLowerCase();
    if (s.includes('comp') || s.includes('done') || s.includes('kela') || s.includes('jhala') || s.includes('kiya')) d.workStatus = 'Completed';
    else if (s.includes('prog') || s.includes('chalu') || s.includes('karat') || s.includes('work')) d.workStatus = 'InProgress';
    else d.workStatus = 'Pending';
  }

  // Priority normalization
  const validPriorities = ['High', 'Medium', 'Low'];
  if (!validPriorities.includes(d.priority)) {
    const p = d.priority.toLowerCase();
    if (p.includes('hi') || p.includes('urg')) d.priority = 'High';
    else if (p.includes('lo')) d.priority = 'Low';
    else d.priority = 'Medium';
  }

  // Default date to today if missing
  if (!d.date || d.date.trim() === '') {
    d.date = today;
  }

  return d as Record<string, string>;
}

// ── POST /api/ai-draft ────────────────────────────────────────────────────────
export async function createAiDraft(req: Request, res: Response, next: NextFunction) {
  try {
    const { rawText } = req.body as { rawText: string };

    if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
      res.status(400).json({ error: 'rawText string is required' });
      return;
    }
    if (rawText.length > 50000) {
      res.status(400).json({ error: 'Input text exceeds maximum allowable limit of 50,000 characters' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      res.json({
        drafts: [{
          title: '',
          description: rawText.trim(),
          givenBy: '',
          contactPerson: '',
          priority: 'Medium',
          workStatus: 'Pending',
          reason: '',
          remarks: '',
          date: '',
          dueDate: '',
        }],
        warning: 'Gemini API key not configured. Raw text preserved as description — please fill in other fields manually.',
      });
      return;
    }

    const ai = new GoogleGenAI({ apiKey });

    const interaction = await ai.interactions.create({
      model: "gemini-3.8-flash",
      input: `${SYSTEM_PROMPT}\n\nUSER INPUT:\n${rawText.trim()}`,
    });

    let raw = (interaction.output_text || '').trim();

    // Strip markdown code block if present
    if (raw.startsWith('```json')) {
      raw = raw.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (raw.startsWith('```')) {
      raw = raw.replace(/^```/, '').replace(/```$/, '').trim();
    }

    let drafts: Record<string, string>[];
    try {
      const parsed = JSON.parse(raw);
      drafts = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      console.error('[AI Draft] Failed to parse model output:', raw.slice(0, 200));
      res.status(500).json({ error: 'AI returned unparseable content. Please refine your input.' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    // Validate and sanitize each draft
    drafts = drafts.map(d => sanitizeDraft(d, today));

    res.json({ drafts });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/ai-draft/regenerate ──────────────────────────────────────────────
export async function regenerateSingleAiDraft(req: Request, res: Response, next: NextFunction) {
  try {
    const { task, instruction, context } = req.body as {
      task: Record<string, string>;
      instruction?: string;
      context?: string;
    };

    if (!task || typeof task !== 'object') {
      res.status(400).json({ error: 'task object is required' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      res.json({ task, warning: 'Gemini API key not configured.' });
      return;
    }

    const ai = new GoogleGenAI({ apiKey });

    const REGEN_PROMPT = `You are an expert task extraction and refinement assistant for a professional daily timesheet task manager system.
Your job is to regenerate and improve a SINGLE work task based on the user's instructions or by making it clean, professional, and high quality.

The user instruction or context may be in Marathi (मराठी), Marathi in English format (Roman Marathi), Hindi, Hinglish, or English.
Always extract, refine, and translate everything into clean, professional English using simple, concise terms:
- title: short clear task title in English (max 8 words)
- description: full details of what was done, including any sub-tasks as bullet points in English
- priority: High | Medium | Low
- workStatus: InProgress | Pending | Completed
- reason: why it is pending or delayed in English, empty if completed
- remarks: what was accomplished (for Completed tasks) in English, empty if not completed
- date: ISO date YYYY-MM-DD
- dueDate: ISO date YYYY-MM-DD if mentioned

CURRENT TASK:
${JSON.stringify(task, null, 2)}
${instruction && instruction.trim() ? `USER REFINEMENT INSTRUCTION: "${instruction.trim()}"` : ''}
${context && context.trim() ? `ORIGINAL RAW CONTEXT: "${context.trim()}"` : ''}

Return ONLY a single valid JSON object representing the improved task (no array, no markdown, no explanation):
{
  "title": "string",
  "description": "string",
  "givenBy": "string",
  "contactPerson": "string",
  "priority": "High | Medium | Low",
  "workStatus": "InProgress | Pending | Completed",
  "reason": "string",
  "remarks": "string",
  "date": "string",
  "dueDate": "string"
}`;

    const interaction = await ai.interactions.create({
      model: "gemini-3.8-flash",
      input: REGEN_PROMPT,
    });

    let raw = (interaction.output_text || '').trim();
    if (raw.startsWith('```json')) {
      raw = raw.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (raw.startsWith('```')) {
      raw = raw.replace(/^```/, '').replace(/```$/, '').trim();
    }

    let parsedTask: Record<string, string>;
    try {
      const parsed = JSON.parse(raw);
      parsedTask = Array.isArray(parsed) ? parsed[0] : parsed;
    } catch {
      console.error('[AI Draft Regen] Failed to parse model output:', raw.slice(0, 200));
      res.status(500).json({ error: 'AI returned unparseable content for task regeneration.' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const cleaned = sanitizeDraft({ ...task, ...parsedTask }, today);

    res.json({ task: cleaned });
  } catch (err) {
    next(err);
  }
}


