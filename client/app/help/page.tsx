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
    whatItDoes: 'Opens the manual task form where you can enter the title, description, priority, date, and status notes directly.',
    whenToUse: 'When you are creating a single task with known details.',
    example: 'Click "+ New Task" → "Manual Form", fill in the fields, and click "Save Task".'
  },
  {
    id: 'add-multiple-tasks',
    category: 'getting-started',
    q: 'Can I create multiple tasks at the same time?',
    whatItDoes: 'Yes. Type multiple numbered tasks into the AI Assistant or click "+ Add Another Task" inside the draft editor.',
    whenToUse: 'When you have several tasks to record at once after a meeting or at the end of the day.',
    example: 'In the AI Assistant, enter:\n1. Check attendance records\n2. Call IT support for router repair. Pending\n3. Send semester report to HOD\nAll 3 tasks are generated and saved together.'
  },
  {
    id: 'add-manual-to-ai-draft',
    category: 'getting-started',
    q: 'Can I add a manual task into an AI draft list?',
    whatItDoes: 'Clicking "+ Add Another Task" inserts a blank card directly into your generated list.',
    whenToUse: 'When AI created your main tasks, but you want to add an extra task without re-running the AI.',
    example: 'AI generated 4 tasks. You remember one more item. Click "+ Add Another Task", type "Sign gate pass", and save all 5 tasks together.'
  },

  // ── 2. AI Task Assistant & Drafts ──────────────────────────────────────────
  {
    id: 'ai-multilingual-support',
    category: 'ai-drafts',
    badge: 'Multilingual',
    q: 'How does AI task structuring work, and what languages are supported?',
    whatItDoes: 'Converts unstructured notes into organized task records. It understands English, Marathi, and Hinglish, and organizes everything into clean English fields.',
    whenToUse: 'When you want to type notes quickly without filling individual dropdowns and fields.',
    example: 'You enter: "HOD sir ni sangitla exam timetable tayar karaycha aahe. Subtasks: a) batch count b) room allocation. Aaj submit kela."\nThe AI creates a task titled "Prepare Exam Timetable", notes "HOD Sir", lists subtasks, sets status to "Completed", and dates it today.'
  },
  {
    id: 'single-task-regen',
    category: 'ai-drafts',
    badge: 'Fast',
    q: 'How does single-task regeneration work?',
    whatItDoes: 'Clicking "Regenerate" on a card refines only that task, leaving your other drafts untouched. You can also give an optional instruction (e.g. "Make title shorter").',
    whenToUse: 'When most drafts look good, and you only want to tweak one specific task.',
    example: 'Tasks 1, 3, and 4 look good, but Task 2 is too wordy. Click "Regenerate" on Task 2, enter "Make title shorter", and refresh.'
  },
  {
    id: 'ai-token-cost',
    category: 'ai-drafts',
    q: 'Does editing fields or saving tasks use AI again?',
    whatItDoes: 'No. Editing text fields, changing dropdowns, or clicking "Save Tasks" works locally in your browser and database with no extra AI calls.',
    whenToUse: 'Whenever you want to adjust priority, tweak a date, or fix a typo directly.',
    example: 'Change priority from "Medium" to "High" in the dropdown. The change happens instantly without any network call.'
  },

  // ── 3. Draft Safety & Recovery ─────────────────────────────────────────────
  {
    id: 'draft-auto-recovery',
    category: 'draft-safety',
    badge: 'Auto-Save',
    q: 'What happens if I accidentally close the popup or refresh?',
    whatItDoes: 'Your input text and generated drafts save automatically to your browser storage. If you close the window or refresh, nothing is lost.',
    whenToUse: 'When you get interrupted or accidentally close the window while reviewing tasks.',
    example: 'You generate 5 tasks and accidentally close the tab. Reopen the app, click "+ New Task", and your drafts are restored.'
  },
  {
    id: 'close-keep-draft',
    category: 'draft-safety',
    q: 'Can I close the AI window to check other tasks without losing my draft?',
    whatItDoes: 'Yes. Click "Close" or the "X" button. Your draft remains saved until you save or discard it.',
    whenToUse: 'When you want to look at the main task table to verify something before saving.',
    example: 'You want to check if a task was already added yesterday. Close the modal, check the list, and reopen "+ New Task" to continue.'
  },
  {
    id: 'discard-draft-safety',
    category: 'draft-safety',
    q: 'What does "Discard" do?',
    whatItDoes: 'Clears the saved draft and resets the form. A confirmation step prevents accidental loss.',
    whenToUse: 'When you want to scrap the draft batch and start fresh.',
    example: 'You no longer need the drafts you generated. Click "Discard", confirm the prompt, and the draft clears.'
  },

  // ── 4. Task Lifecycle: Description, Reasons & Remarks ──────────────────────
  {
    id: 'desc-vs-reason-vs-remarks',
    category: 'lifecycle-notes',
    q: 'What is the difference between Description, Status Reason, and Remarks?',
    whatItDoes: 'Keeps task records clean and organized:\n• Description: What the task is about and what needs to be done.\n• Reason (Pending / In Progress): Why the task is delayed or what is currently being worked on.\n• Remarks (Completed): Final outcome or delivery details.',
    whenToUse: 'Keep task requirements in Description, delay obstacles in Reason, and accomplishments in Remarks.',
    example: '• Description: "Repair floor Wi-Fi router."\n• Reason (Pending): "Waiting for replacement cable from vendor."\n• Remarks (Completed): "Cable replaced and tested on all workstations."'
  },
  {
    id: 'status-delay-comparison',
    category: 'lifecycle-notes',
    badge: 'History',
    q: 'What is the "Status History & Notes" section?',
    whatItDoes: 'Preserves your notes across each stage of a task ([Pending], [InProgress], and [Completed]) instead of overwriting them when status changes.',
    whenToUse: 'When a task moved through multiple stages and you want a clear record of what happened at each step.',
    example: 'A task was Pending on Monday ("Technician unavailable"), In Progress on Tuesday ("Wiring in progress"), and Completed on Wednesday ("Tested and signed off"). All three notes remain saved.'
  },

  // ── 5. Follow-ups, Escalations & Exports ───────────────────────────────────
  {
    id: 'quick-followup-zap',
    category: 'exports-followups',
    q: 'How does quick follow-up work?',
    whatItDoes: 'Clicking the Zap (⚡) icon on any task opens a panel to log communication, contact person, follow-up dates, and file attachments.',
    whenToUse: 'When you speak with a colleague or vendor about an active task and want to log the update quickly.',
    example: 'You call IT support about a router. Click ⚡ on that task, enter "Spoke with technician Rajesh, visiting at 2:30 PM", set next follow-up date, and save.'
  },
  {
    id: 'export-zero-defect',
    category: 'exports-followups',
    q: 'How does exporting work, and what is the zero-task notice?',
    whatItDoes: 'Generates Excel and PDF reports with status summaries and lifecycle notes. If you export a date with 0 tasks, the app lets you know so you don\'t create empty files.',
    whenToUse: 'When sharing daily work summaries or progress reports with your team or supervisor.',
    example: 'Click "Export", choose "Excel", and download. The file includes status totals and full task details.'
  },
  {
    id: 'escalations-overview',
    category: 'exports-followups',
    q: 'What triggers an escalation warning?',
    whatItDoes: 'Highlights overdue or high-priority tasks that have remained incomplete beyond your configured threshold.',
    whenToUse: 'To spot bottlenecks before deadlines pass.',
    example: 'A high-priority task stays pending for 3 days past the threshold. It flags an alert and lets you send an escalation email to management.'
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
            <Sparkles style={{ width: 14, height: 14 }} /> Help & Guides
          </div>

          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 8 }}>
            How can we help you?
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 28, maxWidth: 540, lineHeight: 1.5 }}>
            Learn how to create tasks, use AI structuring, save drafts, track status notes, and export reports.
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

