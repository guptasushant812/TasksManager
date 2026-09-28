import { Request, Response, NextFunction } from 'express';
import { GoogleGenAI } from '@google/genai';

const SYSTEM_PROMPT = `You are a professional task extraction assistant for a daily timesheet task manager system.

The user will give you free-form text describing one or more work tasks. The input may be:
- Written in a mix of Hindi and English (Hinglish/Roman Hindi)
- Informal, conversational, or fragmented
- Numbered (1, 2, 3) or lettered (a, b, c sub-tasks)
- A single sentence or multiple paragraphs

YOUR JOB:
1. Identify EACH separate main task (usually numbered 1, 2, 3).
2. If a main task has sub-tasks (like a, b, c or indented bullets), DO NOT create separate task objects for them. Instead, merge all sub-tasks cleanly into the single main task's "description" field as bullet points.
3. Extract and structure everything into clean, professional English using simple, concise, layman terms (no jargon).
4. Translate any Hindi/Hinglish content to clean professional English.
5. Return a JSON array of task objects — one object per main task.

Return ONLY a valid JSON array (no markdown, no code blocks, no explanation):
[
  {
    "title": "string - short clear task title in English (max 8 words)",
    "description": "string - full details of what was done, including any sub-tasks as bullet points",
    "givenBy": "string - person who assigned it (if mentioned), else empty string",
    "contactPerson": "string - person to follow up with or contact regarding this task (if mentioned), else empty string",
    "priority": "High | Medium | Low",
    "workStatus": "InProgress | Pending | Completed",
    "reason": "string - why it is pending/delayed, empty if completed",
    "remarks": "string - what was accomplished (for Completed tasks), empty if not completed",
    "date": "string - ISO date YYYY-MM-DD (e.g. today's date if 'aaj' or 'today' is mentioned), empty if not",
    "dueDate": "string - ISO date YYYY-MM-DD if a deadline is mentioned, empty if not"
  }
]

STRICT RULES:
- AUTO-FILL LOGIC: If the user says "pending" or "in progress" -> set workStatus appropriately. If they say "kiya", "done", or speak in past tense -> set "Completed".
- PRIORITY: If they mention "high", "low", "mid/medium", use that. Otherwise, infer based on urgency (exam/inspection = High).
- REASON: If they mention *why* a task is pending or delayed, extract that exactly into the "reason" field.
- SUB-TASKS: Remember, sub-tasks (a, b, c) MUST be inside the parent task's description. Do NOT create separate objects for sub-tasks.
- The response must be a valid parseable JSON array ONLY — nothing else.`;

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

    // Sanitise — ensure all expected fields exist on every draft
    const fields = ['title', 'description', 'givenBy', 'contactPerson', 'priority', 'workStatus', 'reason', 'remarks', 'date', 'dueDate'];
    const today = new Date().toISOString().split('T')[0];

    drafts = drafts.map(d => {
      for (const f of fields) {
        if (!(f in d) || d[f] === null || d[f] === undefined) d[f] = '';
      }
      // By default, set the date to today if not provided
      if (!d.date || d.date.trim() === '') {
        d.date = today;
      }
      return d;
    });

    res.json({ drafts });
  } catch (err) {
    next(err);
  }
}

