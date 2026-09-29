import { Request, Response, NextFunction } from 'express';
import { GoogleGenAI } from '@google/genai';

const SYSTEM_PROMPT = `You are an expert task extraction assistant for a professional task management and timesheet system.
Your job is to convert raw, messy, or conversational text (English, Hindi, or Hinglish) into structured, high-density task records.

CORE PRINCIPLE: DRY (Don't Repeat Yourself) & High Information Density.
- NEVER repeat the same information across multiple fields.
- Write in simple, professional English using layman terms and short, crisp sentences.
- Avoid AI filler ("Ensure that...", "In order to...", "Successfully completed").
- Optimize for information value per word.

FIELD RESPONSIBILITIES & CONSTRAINTS:

1. "title": string (3 to 6 words, max 8 words)
   - What is the task? A punchy action verb phrase (e.g., "Submit NBA Accreditation Report", "Repair Department Floor Router").
   - Do NOT include unnecessary background, long filler, or dates in the title.

2. "description": string (8 to 25 words max)
   - What needs to be done / what was done. Key action details, document names, or specific sub-tasks.
   - Do NOT repeat the title.
   - If sub-tasks (a, b, c) exist, format them concisely as bullet points (- item).
   - Do NOT write paragraphs or essay-style explanations.

3. "workStatus": "Completed" | "InProgress" | "Pending"
   - "Completed": Done, finished, submitted, or past-tense action ("ho gaya", "kiya", "done").
   - "InProgress": Currently being worked on, ongoing ("kar raha hu", "working on it").
   - "Pending": Not started, blocked, or awaiting approval ("baaki hai", "pending").

4. "reason": string
   - Applicable ONLY when workStatus is "Pending" or "InProgress".
   - State the blocker, dependency, or reason for delay (e.g., "Awaiting Dean signature", "Waiting for spare parts").
   - If workStatus is "Completed", this MUST be an empty string: "".
   - If there is no specific blocker, leave as empty string: "".

5. "remarks": string
   - An outcome deliverable, artifact reference, or specific follow-up note (e.g., "PR #142 merged", "Sent via dispatch #8821", "Next review on Monday").
   - CRITICAL DRY RULE: NEVER summarize, rephrase, or rewrite the description here!
   - If the task is completed and there is NO separate deliverable ID or outcome note, leave as empty string: "".
   - NEVER use filler such as "Task completed", "Done successfully", or "No remarks".

6. "priority": "High" | "Medium" | "Low"
   - "High": Urgent deadlines (today/tomorrow), executive escalations, exam/audit/critical failure.
   - "Medium": Standard scheduled work, normal operational tasks.
   - "Low": General backlog, housekeeping, low-urgency reference tasks.
   - Default to "Medium" unless urgency is explicitly stated or strongly implied.

7. "givenBy": string
   - Person or authority who assigned the task (e.g., "Sachin Oak Sir", "HOD", "Client"). Empty string "" if not mentioned.

8. "contactPerson": string
   - Person to contact or follow up with. Empty string "" if not mentioned.

9. "date": string (ISO date YYYY-MM-DD)
   - Date of the task. If user says "today", "aaj", or specifies a date, use that ISO date. Otherwise empty string "".

10. "dueDate": string (ISO date YYYY-MM-DD)
    - Explicit deadline if mentioned. Empty string "" if none.

FEW-SHOT EXAMPLES:

--- Example 1 (Completed task with deliverable) ---
INPUT:
"Sachin sir told me to submit the NBA criteria 4 document today. I completed the verification and uploaded it to the college portal."
OUTPUT:
[
  {
    "title": "Submit NBA Criteria 4 Document",
    "description": "Verified criteria 4 details and uploaded document to college portal.",
    "givenBy": "Sachin Sir",
    "contactPerson": "",
    "priority": "High",
    "workStatus": "Completed",
    "reason": "",
    "remarks": "Uploaded to college portal",
    "date": "",
    "dueDate": ""
  }
]

--- Example 2 (Pending task with blocker — notice Remarks is EMPTY, Reason has blocker) ---
INPUT:
"Follow up with IT regarding floor router repair. Pending because technician is unavailable until tomorrow."
OUTPUT:
[
  {
    "title": "Repair Floor Wi-Fi Router",
    "description": "Follow up with IT team for hardware troubleshooting.",
    "givenBy": "",
    "contactPerson": "IT Team",
    "priority": "Medium",
    "workStatus": "Pending",
    "reason": "Technician unavailable until tomorrow",
    "remarks": "",
    "date": "",
    "dueDate": ""
  }
]

--- Example 3 (Completed task without extra deliverable — Remarks MUST BE EMPTY) ---
INPUT:
"Cleaned up department attendance register and filed daily records."
OUTPUT:
[
  {
    "title": "Update Department Attendance Register",
    "description": "Checked attendance entries and filed daily records.",
    "givenBy": "",
    "contactPerson": "",
    "priority": "Low",
    "workStatus": "Completed",
    "reason": "",
    "remarks": "",
    "date": "",
    "dueDate": ""
  }
]

--- Example 4 (Multi-task numbered with subtasks) ---
INPUT:
"1. Prepare exam timetable given by HOD sir. Subtasks: a) collect batch counts b) room allocation.
2. Call vendor for library books quote, waiting for their reply."
OUTPUT:
[
  {
    "title": "Prepare Exam Timetable",
    "description": "Draft exam schedule:\n- Collect batch counts\n- Room allocation",
    "givenBy": "HOD Sir",
    "contactPerson": "",
    "priority": "High",
    "workStatus": "InProgress",
    "reason": "",
    "remarks": "",
    "date": "",
    "dueDate": ""
  },
  {
    "title": "Request Library Books Quotation",
    "description": "Contact vendor for quotation on required library books.",
    "givenBy": "",
    "contactPerson": "Book Vendor",
    "priority": "Medium",
    "workStatus": "Pending",
    "reason": "Waiting for vendor reply",
    "remarks": "",
    "date": "",
    "dueDate": ""
  }
]

Return ONLY a valid parseable JSON array. No markdown code blocks, no backticks, no explanatory text.`;

// ── Deduplication and Sanitization Helper (Poka-Yoke) ──────────────────────────
function cleanAndDeduplicateDraft(d: Record<string, any>, today: string): Record<string, string> {
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
    if (s.includes('comp') || s.includes('done')) d.workStatus = 'Completed';
    else if (s.includes('prog') || s.includes('work')) d.workStatus = 'InProgress';
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
  if (!d.date) {
    d.date = today;
  }

  // DRY Rule 1: Completed tasks do not have blockers/reasons
  if (d.workStatus === 'Completed') {
    d.reason = '';
  }

  const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  const descNorm = normalize(d.description);
  const titleNorm = normalize(d.title);
  const remarksNorm = normalize(d.remarks);
  const reasonNorm = normalize(d.reason);

  // Generic filler remarks to eliminate
  const genericRemarks = [
    'task completed', 'task has been completed', 'completed successfully', 'successfully completed',
    'done', 'work done', 'completed', 'finished', 'resolved', 'no remarks', 'n a', 'na', 'none',
    'task done', 'all done', 'handled', 'as per instructions', 'completed as planned'
  ];

  if (genericRemarks.includes(remarksNorm)) {
    d.remarks = '';
  }

  // DRY Rule 2: Remarks must NEVER duplicate Description or Title
  if (remarksNorm && descNorm) {
    if (remarksNorm === descNorm || descNorm.includes(remarksNorm) || remarksNorm.includes(descNorm)) {
      d.remarks = '';
    } else {
      // Overlap check: if >= 65% of words in remarks are already in description, clear remarks
      const descTokens = new Set(descNorm.split(' '));
      const remarkTokens = remarksNorm.split(' ').filter(t => t.length > 2);
      if (remarkTokens.length > 0) {
        const matches = remarkTokens.filter(t => descTokens.has(t)).length;
        if (matches / remarkTokens.length >= 0.65) {
          d.remarks = '';
        }
      }
    }
  }

  if (d.remarks && normalize(d.remarks) === titleNorm) {
    d.remarks = '';
  }

  // DRY Rule 3: Reason must not duplicate Description or Title
  if (reasonNorm && (reasonNorm === descNorm || reasonNorm === titleNorm)) {
    d.reason = '';
  }

  // DRY Rule 4: If Reason and Remarks contain the same information, clear Remarks
  if (d.reason && d.remarks && normalize(d.reason) === normalize(d.remarks)) {
    d.remarks = '';
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

    // Clean, validate, and deduplicate each draft according to DRY standards
    drafts = drafts.map(d => cleanAndDeduplicateDraft(d, today));

    res.json({ drafts });
  } catch (err) {
    next(err);
  }
}

