'use client';
import { useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { useTaskContext } from '@/context/TaskContext';
import { 
  Search, BookOpen, Sparkles, ShieldCheck, Clock, FileSpreadsheet, 
  LifeBuoy, ChevronDown, Plus, Zap, AlertTriangle, RefreshCw, CheckCircle2
} from 'lucide-react';

interface FaqItem {
  id: string;
  category: 'getting-started' | 'ai-drafts' | 'draft-safety' | 'lifecycle-notes' | 'exports-followups';
  q: string;
  whatItDoes: string;
  whenToUse: string;
  example: string;
  badge?: string;
}

const CATEGORIES = [
  { id: 'all', label: 'All Questions', icon: BookOpen },
  { id: 'getting-started', label: 'Task Creation', icon: Plus },
  { id: 'ai-drafts', label: 'AI Assistant', icon: Sparkles },
  { id: 'draft-safety', label: 'Draft Safety', icon: ShieldCheck },
  { id: 'lifecycle-notes', label: 'Lifecycle & Notes', icon: Clock },
  { id: 'exports-followups', label: 'Exports & Follow-Ups', icon: FileSpreadsheet },
] as const;

const FAQS: FaqItem[] = [
  // ── 1. Getting Started & Task Creation ─────────────────────────────────────
  {
    id: 'create-task-manual',
    category: 'getting-started',
    q: 'How do I create a task manually?',
    whatItDoes: 'Opens the Standard Form where you can directly fill in the title, description, priority, dates, assignees, and initial status notes with complete control.',
    whenToUse: 'When you are creating a single task with known specific parameters and prefer direct form input.',
    example: 'You need to log "Submit ISO Audit documentation" assigned by Sachin Sir with High priority and a due date of 15th October. Click "+ New Task" → "Standard Form", fill in the fields, and click "Save Task".'
  },
  {
    id: 'add-multiple-tasks',
    category: 'getting-started',
    q: 'Can I create multiple tasks at the same time without reopening the form?',
    whatItDoes: 'Yes. You can either type multiple numbered tasks into the AI Assistant or use the "+ Add Another Task to Draft" button inside the draft editor to add more task cards.',
    whenToUse: 'At the end of your workday or after a staff meeting when you have 3 to 10 tasks to record at once.',
    example: 'You have 3 tasks from your morning meeting. Open AI Assistant and enter:\n1. Check departmental attendance records.\n2. Call IT support for floor Wi-Fi router repair. Pending.\n3. Send semester report to HOD.\nAll 3 tasks are generated and saved together in one click.'
  },
  {
    id: 'add-manual-to-ai-draft',
    category: 'getting-started',
    q: 'Can I add a manual task into an AI-generated draft list?',
    whatItDoes: 'The "+ Add Another Task to Draft" button adds a blank, editable task card directly into your current list of generated drafts.',
    whenToUse: 'When the AI has extracted your main tasks, but you remember an additional task and want to type it in directly without re-running the AI.',
    example: 'AI generated 4 tasks from your email. You remember you also promised to sign a gate pass. Instead of re-running AI, click "+ Add Another Task to Draft", type "Sign gate pass", and save all 5 tasks together.'
  },

  // ── 2. AI Task Assistant & Drafts ──────────────────────────────────────────
  {
    id: 'ai-multilingual-support',
    category: 'ai-drafts',
    badge: 'Multilingual',
    q: 'How does AI Task Structuring work, and what languages are supported?',
    whatItDoes: 'Converts unstructured text, WhatsApp messages, or rough bullet points into complete task records. It natively understands English, Marathi (मराठी), Marathi in English format (Roman Marathi like "kam kela", "baki aahe"), and Hinglish, automatically translating everything into clean, professional English.',
    whenToUse: 'When you want to type or paste rough spoken-style notes quickly without manually selecting dates, priorities, and dropdowns.',
    example: 'You enter: "HOD sir ni sangitla exam timetable tayar karaycha aahe. Subtasks: a) batch count b) room allocation. Aaj submit kela."\nThe AI creates a task titled "Prepare Exam Timetable", assigns Given By as "HOD Sir", lists sub-tasks as bullet points, sets Status to "Completed", and marks date as today.'
  },
  {
    id: 'single-task-regen',
    category: 'ai-drafts',
    badge: 'Token Optimized',
    q: 'How does Single-Task Regeneration work, and why should I use it?',
    whatItDoes: 'Clicking "Regenerate Task" on a specific card sends only that single task to the AI for refinement, leaving all other drafts completely untouched. You can also provide an optional instruction (e.g. "Make title shorter" or "Set reason as waiting for Dean signature").',
    whenToUse: 'When 4 out of 5 generated tasks are already perfect, and you only want to improve or rephrase Task 2 without wasting AI tokens or losing your manual edits on other tasks.',
    example: 'Task 1, 3, and 4 look great, but Task 2 has a title that is too lengthy. Click "Regenerate Task" on Task 2, enter "Shorten title to 4 words", and click "Improve This Task". Only Task 2 refreshes.'
  },
  {
    id: 'ai-token-cost',
    category: 'ai-drafts',
    q: 'Will editing fields or saving tasks consume AI tokens again?',
    whatItDoes: 'No. Editing text fields, changing dropdowns, adding manual tasks, or clicking "Save Tasks" runs entirely on your local browser and database with zero AI calls.',
    whenToUse: 'Whenever you want to adjust a priority, tweak a date, or fix a typo directly in the draft card.',
    example: 'The AI inferred "Medium" priority for a task, but you know it is urgent. Simply select "High" from the priority dropdown. The change happens instantly without any network call or token consumption.'
  },

  // ── 3. Draft Safety & Recovery ─────────────────────────────────────────────
  {
    id: 'draft-auto-recovery',
    category: 'draft-safety',
    badge: 'Auto-Save',
    q: 'What happens if I accidentally close the popup or refresh the page?',
    whatItDoes: 'Your raw input text and generated drafts are automatically saved to your browser’s local storage in real-time. If you close the window, navigate away, or refresh, nothing is lost.',
    whenToUse: 'When you get interrupted by a phone call, click outside the modal by mistake, or experience a browser crash while reviewing drafts.',
    example: 'You generate 5 tasks and are reviewing Task 3 when you accidentally close the browser tab. Reopen the app, click "+ New Task", and you will see a badge saying "5 Drafts Saved". Click "AI Assistant" and all your tasks are instantly restored.'
  },
  {
    id: 'close-keep-draft',
    category: 'draft-safety',
    q: 'How do I safely close the AI window to check other tasks without losing my draft?',
    whatItDoes: 'Click the "Close (Keep Draft)" button or the "X" icon. The modal closes, but your entire draft is preserved in local storage.',
    whenToUse: 'When you are reviewing generated tasks and need to check a past entry in your main task table before clicking Save.',
    example: 'While reviewing a draft for "Send lab inventory report", you want to verify if you already logged it yesterday. Click "Close (Keep Draft)", search your main task list, confirm it was not logged, and reopen "+ New Task" to save the draft.'
  },
  {
    id: 'discard-draft-safety',
    category: 'draft-safety',
    q: 'What does "Discard Draft" do, and can I do it accidentally?',
    whatItDoes: 'Permanently removes the saved draft and resets the form to blank. A confirmation dialog prevents accidental clicks by requiring you to confirm before discarding.',
    whenToUse: 'Only when you have decided not to proceed with the current batch of tasks and want a completely fresh, blank form.',
    example: 'You pasted draft notes for a cancelled project. Click "Discard Draft", click confirm in the warning prompt, and your local draft storage is cleared.'
  },

  // ── 4. Task Lifecycle: Description, Reasons & Remarks ──────────────────────
  {
    id: 'desc-vs-reason-vs-remarks',
    category: 'lifecycle-notes',
    q: 'What is the difference between Description, Status Reason, and Remarks?',
    whatItDoes: 'Keeps task records clean and non-repetitive by giving each field a distinct purpose:\n• Description: What the task is about and what specific actions need to be performed.\n• Reason (Pending / InProgress): Explains why the task is delayed, waiting, or ongoing (e.g. blockers, waiting for parts).\n• Remarks (Completed): Documents the final outcome or deliverable (e.g. "Uploaded to college portal", "Dispatch #402").',
    whenToUse: 'Always keep task requirements in Description, delay obstacles in Reason, and accomplishments in Remarks.',
    example: '• Description: "Repair departmental floor Wi-Fi router."\n• Reason (Pending): "Waiting for replacement cable delivery from vendor."\n• Remarks (Completed): "Cable replaced, internet verified on all 28 departmental workstations."'
  },
  {
    id: 'status-delay-comparison',
    category: 'lifecycle-notes',
    badge: 'Comparison Strip',
    q: 'What is the "Status Delay Comparison & Notes" strip?',
    whatItDoes: 'Preserves your notes across every stage of a task’s lifecycle ([Pending] in Magenta, [InProgress] in Electric Cyan/Blue, and [Completed] in Green) instead of overwriting them when status changes.',
    whenToUse: 'When a task moved from Pending to In Progress to Completed over several days and you need a clear timeline of why delays happened at each stage.',
    example: 'A task was Pending on Monday ("Technician unavailable"), In Progress on Tuesday ("Wiring in progress"), and Completed on Wednesday ("Tested and signed off"). All three entries appear in the comparison strip and in Excel/PDF exports.'
  },

  // ── 5. Follow-ups, Escalations & Exports ───────────────────────────────────
  {
    id: 'quick-followup-zap',
    category: 'exports-followups',
    q: 'How does the Quick Follow-Up feature work?',
    whatItDoes: 'Clicking the Zap (⚡) icon on any task opens a rapid logging panel to record communication logs, contact person notes, follow-up dates, and file attachments.',
    whenToUse: 'Whenever you speak to a vendor, colleague, or supervisor about an active task and need to log the update in seconds.',
    example: 'You call IT support regarding the pending router. Click ⚡ on the router task row, enter "Spoke with technician Rajesh, promised to visit by 2:30 PM", set next follow-up date for tomorrow, and save.'
  },
  {
    id: 'export-zero-defect',
    category: 'exports-followups',
    badge: 'Poka-Yoke Validation',
    q: 'How does task exporting work, and what is the zero-task alert?',
    whatItDoes: 'Generates professional Excel and PDF reports with colored status summary counts (Completed, In Progress, Pending), dynamic filenames, and full lifecycle notes. If you select a date with 0 tasks, a validation modal alerts you and prevents generating blank files.',
    whenToUse: 'When submitting your daily work report to your supervisor, HOD, or management at the end of the day.',
    example: 'At 5:00 PM, click "Export" on the Tasks page, choose "Excel", and download your report. The sheet includes your name, date, summary count badges, and task details ready for submission.'
  },
  {
    id: 'escalations-overview',
    category: 'exports-followups',
    q: 'What triggers an Escalation warning?',
    whatItDoes: 'Automatically highlights overdue or high-priority tasks that have remained incomplete beyond the workspace threshold days configured in Settings.',
    whenToUse: 'During morning reviews to spot critical bottlenecks before they impact departmental deadlines.',
    example: 'An urgent university compliance document marked "High" priority has remained Pending for 3 days past the threshold. It automatically displays a high-priority warning banner and appears in the Escalations view.'
  }
];

export default function HelpCenterPage() {
  const { filters, handleTaskCreated } = useTaskContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openFaq, setOpenFaq] = useState<string | null>(FAQS[0]?.id || null);

  // Filter FAQs based on active category and live search query
  const filteredFaqs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return FAQS.filter((faq) => {
      const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!q) return true;

      return (
        faq.q.toLowerCase().includes(q) ||
        faq.whatItDoes.toLowerCase().includes(q) ||
        faq.whenToUse.toLowerCase().includes(q) ||
        faq.example.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header filters={filters} onTaskCreated={handleTaskCreated} />

      <main style={{ flex: 1, overflowY: 'auto' }}>
        {/* Hero Section */}
        <section style={{
          padding: 'clamp(32px, 5vw, 48px) clamp(16px, 4vw, 32px) clamp(32px, 5vw, 44px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-base) 100%)'
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 9999,
            background: 'var(--accent-subtle)', color: 'var(--accent)',
            fontSize: 12, fontWeight: 700, marginBottom: 12, letterSpacing: '0.04em', textTransform: 'uppercase'
          }}>
            <Sparkles style={{ width: 14, height: 14 }} /> Product Guide & Knowledge Base
          </div>

          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 8 }}>
            How can we help you?
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 28, maxWidth: 540, lineHeight: 1.5 }}>
            Learn how to create tasks, use multilingual AI structuring, preserve drafts, track status delays, and export reports.
          </p>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%', maxWidth: 560 }}>
            <Search style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', width: 18, height: 18 }} />
            <input
              type="text"
              placeholder="Search features, questions, or keywords (e.g., drafts, Marathi, remarks, regenerate)…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{
                paddingLeft: 46,
                fontSize: 14,
                borderRadius: 'var(--radius-lg)',
                height: 46,
                boxShadow: 'var(--box-shadow-brutalist-sm)'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12,
                  cursor: 'pointer', fontWeight: 600
                }}
              >
                Clear
              </button>
            )}
          </div>
        </section>

        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 clamp(16px, 3vw, 32px)' }}>
          {/* Categories Filter Tabs */}
          <section style={{ marginTop: 28, marginBottom: 32 }}>
            <div style={{
              display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6,
              scrollbarWidth: 'none'
            }}>
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.id);
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-full)',
                      border: isActive ? '1px solid var(--accent)' : '1px solid var(--border)',
                      background: isActive ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontSize: 13,
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon style={{ width: 15, height: 15, color: isActive ? 'var(--accent)' : 'inherit' }} />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* FAQ Accordion List */}
          <section style={{ marginBottom: 64 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {selectedCategory === 'all' 
                  ? 'All Frequently Asked Questions' 
                  : CATEGORIES.find(c => c.id === selectedCategory)?.label}
              </h2>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                {filteredFaqs.length} {filteredFaqs.length === 1 ? 'result' : 'results'}
              </span>
            </div>

            {filteredFaqs.length === 0 ? (
              <div className="card" style={{ padding: 40, textAlign: 'center', background: 'var(--bg-surface)' }}>
                <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: 0 }}>
                  No matching questions found for "{searchQuery}".
                </p>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                  style={{ marginTop: 12, fontSize: 13 }}
                >
                  Reset search & view all
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {filteredFaqs.map((faq) => {
                  const isOpen = openFaq === faq.id;

                  return (
                    <div
                      key={faq.id}
                      className="card"
                      style={{
                        padding: 0,
                        overflow: 'hidden',
                        border: isOpen ? '1px solid var(--accent)' : '1px solid var(--border)',
                        transition: 'border 0.15s ease'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '18px 20px',
                          background: isOpen ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          gap: 16,
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                            {faq.q}
                          </span>
                          {faq.badge && (
                            <span style={{
                              fontSize: 10, fontWeight: 800,
                              background: 'var(--accent-subtle)', color: 'var(--accent)',
                              border: '1px solid var(--accent)', padding: '2px 8px',
                              borderRadius: 9999, textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0
                            }}>
                              {faq.badge}
                            </span>
                          )}
                        </div>

                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          border: '1px solid var(--border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isOpen ? 'var(--accent)' : 'var(--bg-elevated)',
                          color: isOpen ? '#000' : 'var(--text-muted)',
                          flexShrink: 0,
                          transition: 'all 0.15s ease'
                        }}>
                          <ChevronDown style={{ width: 16, height: 16, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
                        </div>
                      </button>

                      {isOpen && (
                        <div style={{
                          padding: '16px 20px 22px 20px',
                          background: 'var(--bg-surface)',
                          borderTop: '1px solid var(--border-subtle)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 14,
                          fontSize: 13,
                          lineHeight: 1.6
                        }}>
                          {/* What it does */}
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 4 }}>
                              What It Does
                            </div>
                            <div style={{ color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
                              {faq.whatItDoes}
                            </div>
                          </div>

                          {/* When to use it */}
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--inprogress)', letterSpacing: '0.05em', marginBottom: 4 }}>
                              When To Use It
                            </div>
                            <div style={{ color: 'var(--text-secondary)' }}>
                              {faq.whenToUse}
                            </div>
                          </div>

                          {/* Real-life example callout */}
                          <div style={{
                            padding: '12px 14px',
                            background: 'var(--bg-elevated)',
                            borderLeft: '3px solid var(--completed)',
                            borderRadius: '0 var(--radius-sm) var(--radius-sm) 0'
                          }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--completed)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <CheckCircle2 style={{ width: 13, height: 13 }} /> Real-Life Example
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontStyle: 'normal', whiteSpace: 'pre-line' }}>
                              {faq.example}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Support Banner */}
          <section className="card" style={{
            padding: '24px 28px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
            marginBottom: 48, background: 'var(--bg-surface)'
          }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>Still have questions?</h3>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 13 }}>
                Can't find what you're looking for? Reach out for support or feedback on workflow improvements.
              </p>
            </div>
            <button className="btn btn-primary" style={{ fontSize: 13, padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <LifeBuoy style={{ width: 15, height: 15 }} />
              Contact Support
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}

