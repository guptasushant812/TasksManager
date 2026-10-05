'use client';
import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useTaskContext } from '@/context/TaskContext';
import { 
  Search, BookOpen, Sparkles, ShieldCheck, Clock, FileSpreadsheet, 
  LifeBuoy, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Plus, Zap, 
  AlertTriangle, RefreshCw, CheckCircle2, Copy, Check, ExternalLink, 
  Keyboard, X, Mail, MessageSquare, ArrowRight
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

const QUICK_CARDS = [
  {
    id: 'getting-started',
    title: 'Task Creation',
    desc: 'Manual task forms, rapid batch additions, and priority definitions.',
    icon: Plus,
    badge: 'Core',
  },
  {
    id: 'ai-drafts',
    title: 'AI Assistant',
    desc: 'Multilingual structuring (Marathi, Hinglish, English) and 1-click single card regeneration.',
    icon: Sparkles,
    badge: 'Smart',
  },
  {
    id: 'draft-safety',
    title: 'Draft Safety',
    desc: 'Continuous local browser backups, safe popup dismissals, and instant restoration.',
    icon: ShieldCheck,
    badge: 'Auto-Save',
  },
  {
    id: 'exports-followups',
    title: 'Exports & Follow-Ups',
    desc: 'Excel/PDF reporting, zero-task notices, communication logs, and escalation policies.',
    icon: FileSpreadsheet,
    badge: 'Reports',
  },
];

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
  const [openFaqs, setOpenFaqs] = useState<Set<string>>(new Set([FAQS[0]?.id || '']));
  const [copiedFaqId, setCopiedFaqId] = useState<string | null>(null);

  // Modals state
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Category navigation scroll state
  const categoryListRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const checkCategoryScroll = useCallback(() => {
    const el = categoryListRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  }, []);

  useEffect(() => {
    const el = categoryListRef.current;
    if (!el) return;
    checkCategoryScroll();
    el.addEventListener('scroll', checkCategoryScroll, { passive: true });
    window.addEventListener('resize', checkCategoryScroll);
    return () => {
      el.removeEventListener('scroll', checkCategoryScroll);
      window.removeEventListener('resize', checkCategoryScroll);
    };
  }, [checkCategoryScroll]);

  const handleScrollCategories = (direction: 'left' | 'right') => {
    const el = categoryListRef.current;
    if (!el) return;
    const offset = direction === 'left' ? -180 : 180;
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: offset, behavior: isReducedMotion ? 'auto' : 'smooth' });
  };

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    const el = categoryListRef.current;
    if (!el) return;
    const targetBtn = el.querySelector<HTMLElement>(`[data-cat-id="${catId}"]`);
    if (targetBtn) {
      const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      targetBtn.scrollIntoView({
        behavior: isReducedMotion ? 'auto' : 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  };

  // Keyboard shortcut listener (/ to focus search, Esc to clear)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || (e.ctrlKey && e.key.toLowerCase() === 'k')) && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (showShortcutsModal) setShowShortcutsModal(false);
        else if (showSupportModal) setShowSupportModal(false);
        else if (searchQuery) setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, showShortcutsModal, showSupportModal]);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: FAQS.length };
    for (const faq of FAQS) {
      counts[faq.category] = (counts[faq.category] || 0) + 1;
    }
    return counts;
  }, []);

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

  const toggleFaq = (id: string) => {
    setOpenFaqs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const areAllExpanded = filteredFaqs.length > 0 && filteredFaqs.every((f) => openFaqs.has(f.id));

  const toggleAllFaqs = () => {
    if (areAllExpanded) {
      setOpenFaqs(new Set());
    } else {
      setOpenFaqs(new Set(filteredFaqs.map((f) => f.id)));
    }
  };

  const copyFaqSnippet = (faq: FaqItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `Q: ${faq.q}\n\nWhat It Does:\n${faq.whatItDoes}\n\nWhen To Use It:\n${faq.whenToUse}\n\nExample:\n${faq.example}`;
    navigator.clipboard.writeText(text);
    setCopiedFaqId(faq.id);
    setTimeout(() => setCopiedFaqId(null), 2000);
  };

  const copySupportEmail = () => {
    navigator.clipboard.writeText('guptasushant812@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <div className="page-layout">
      <Header filters={filters} onTaskCreated={handleTaskCreated} />

      <main className="help-page-wrap" style={{ flex: 1, overflowY: 'auto' }}>
        {/* Hero Section */}
        <section className="help-hero">
          <div className="help-hero-badge">
            <Sparkles size={13} />
            <span>Help Center & Knowledge Base</span>
          </div>

          <h1 className="help-hero-title">
            How can we help your workflow?
          </h1>
          <p className="help-hero-desc">
            Master task creation, AI prompt structuring, draft safety auto-backups, status reasoning, and audit exports.
          </p>

          {/* Search Box with Fluid Input & Clear Button */}
          <div className="help-search-container">
            <Search className="help-search-icon" size={18} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search features, questions, or keywords (Press '/' to focus)…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="help-search-input"
              aria-label="Search documentation"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="help-search-clear"
                title="Clear search"
                aria-label="Clear search query"
              >
                <X size={12} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </section>

        <div className="help-content-wrap">
          {/* Quick Start Feature Cards (Intrinsic Grid) */}
          <section aria-label="Feature Quick Cards">
            <div className="help-quick-grid">
              {QUICK_CARDS.map((card) => {
                const Icon = card.icon;
                const isSelected = selectedCategory === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => handleSelectCategory(card.id)}
                    className="help-quick-card"
                    style={{
                      borderColor: isSelected ? 'var(--accent)' : undefined,
                      background: isSelected ? 'var(--bg-elevated)' : undefined,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <div className="help-quick-card-icon">
                        <Icon size={18} />
                      </div>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '2px 7px',
                        borderRadius: 9999,
                        background: 'var(--accent-subtle)',
                        color: 'var(--accent)',
                        border: '1px solid var(--accent)',
                        letterSpacing: '0.04em',
                      }}>
                        {card.badge}
                      </span>
                    </div>
                    <span className="help-quick-card-title">{card.title}</span>
                    <p className="help-quick-card-desc">{card.desc}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Categories Filter Tabs (with Edge Fade Masks & Chevrons) */}
          <section aria-label="Filter Documentation Categories">
            <div className="help-category-container">
              {canScrollLeft && (
                <button
                  type="button"
                  onClick={() => handleScrollCategories('left')}
                  className="help-category-chevron help-category-chevron-left"
                  aria-label="Scroll categories left"
                  title="Scroll left"
                >
                  <ChevronLeft size={16} />
                </button>
              )}

              <div
                className={`help-category-scroll-wrap ${canScrollLeft ? 'has-overflow-left' : ''} ${canScrollRight ? 'has-overflow-right' : ''}`}
              >
                <div
                  ref={categoryListRef}
                  className="help-category-list"
                  role="tablist"
                  aria-label="FAQ Categories"
                >
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = selectedCategory === cat.id;
                    const count = categoryCounts[cat.id] || 0;
                    return (
                      <button
                        key={cat.id}
                        data-cat-id={cat.id}
                        type="button"
                        onClick={() => handleSelectCategory(cat.id)}
                        className={`help-category-btn ${isActive ? 'active' : ''}`}
                        role="tab"
                        aria-selected={isActive}
                      >
                        <Icon size={15} style={{ color: isActive ? 'var(--accent)' : 'inherit' }} />
                        <span>{cat.label}</span>
                        <span className="help-category-count">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {canScrollRight && (
                <button
                  type="button"
                  onClick={() => handleScrollCategories('right')}
                  className="help-category-chevron help-category-chevron-right"
                  aria-label="Scroll categories right"
                  title="Scroll right"
                >
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </section>

          {/* FAQ Accordion Section */}
          <section aria-label="Frequently Asked Questions">
            <div className="help-faq-header">
              <h2 className="help-faq-title">
                <span>
                  {selectedCategory === 'all' 
                    ? 'All Frequently Asked Questions' 
                    : CATEGORIES.find(c => c.id === selectedCategory)?.label}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                  ({filteredFaqs.length} {filteredFaqs.length === 1 ? 'article' : 'articles'})
                </span>
              </h2>

              <div className="help-faq-actions">
                {filteredFaqs.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleAllFaqs}
                    className="help-toggle-all-btn"
                  >
                    {areAllExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    <span>{areAllExpanded ? 'Collapse All' : 'Expand All'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Zero State */}
            {filteredFaqs.length === 0 ? (
              <div className="card" style={{ padding: 40, textAlign: 'center', background: 'var(--bg-surface)' }}>
                <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: 0 }}>
                  No matching questions found for &quot;{searchQuery}&quot;.
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
              /* FAQ Accordion Cards with Container Query Adaptation */
              <div className="help-faq-list" style={{ marginTop: 16 }}>
                {filteredFaqs.map((faq) => {
                  const isOpen = openFaqs.has(faq.id);

                  return (
                    <article
                      key={faq.id}
                      className={`help-faq-card ${isOpen ? 'open' : ''}`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleFaq(faq.id)}
                        className="help-faq-trigger"
                        aria-expanded={isOpen}
                        aria-controls={`faq-body-${faq.id}`}
                      >
                        <div className="help-faq-question-wrap">
                          <span className="help-faq-q-text">{faq.q}</span>
                          {faq.badge && (
                            <span className="help-faq-badge">{faq.badge}</span>
                          )}
                        </div>

                        <div className="help-faq-icon-wrap" aria-hidden="true">
                          <ChevronDown size={16} />
                        </div>
                      </button>

                      {isOpen && (
                        <div id={`faq-body-${faq.id}`} className="help-faq-body animate-fade-in">
                          {/* Adaptive 2-Column Section on Wider Viewports */}
                          <div className="help-faq-sections-grid">
                            {/* What it does */}
                            <div className="help-faq-section-block">
                              <span className="help-faq-section-label">What It Does</span>
                              <div style={{ color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
                                {faq.whatItDoes}
                              </div>
                            </div>

                            {/* When to use it */}
                            <div className="help-faq-section-block">
                              <span className="help-faq-section-label" style={{ color: 'var(--inprogress)' }}>
                                When To Use It
                              </span>
                              <div style={{ color: 'var(--text-secondary)' }}>
                                {faq.whenToUse}
                              </div>
                            </div>
                          </div>

                          {/* Real-Life Example Callout Box */}
                          <div className="help-faq-example-box">
                            <div className="help-faq-example-label">
                              <CheckCircle2 size={13} />
                              <span>Real-Life Example</span>
                            </div>
                            <div style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                              {faq.example}
                            </div>
                          </div>

                          {/* Footer Actions: Copy Snippet */}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 6 }}>
                            <button
                              type="button"
                              onClick={(e) => copyFaqSnippet(faq, e)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: copiedFaqId === faq.id ? 'var(--completed)' : 'var(--text-muted)',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '4px 8px',
                                borderRadius: 4,
                              }}
                              title="Copy this answer snippet"
                            >
                              {copiedFaqId === faq.id ? (
                                <>
                                  <Check size={13} />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={13} />
                                  <span>Copy Snippet</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Support & Shortcuts Banner */}
          <section className="help-support-banner" aria-label="Support and Shortcuts">
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                Need more assistance or have suggestions?
              </h3>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 13, lineHeight: 1.5 }}>
                Our team is here to support you. Explore keyboard shortcuts or contact the developer directly.
              </p>
            </div>

            <div className="help-support-buttons">
              <button
                type="button"
                onClick={() => setShowShortcutsModal(true)}
                className="btn btn-ghost"
                style={{ fontSize: 12.5, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 7 }}
              >
                <Keyboard size={15} />
                <span>Shortcuts</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSupportModal(true)}
                className="btn btn-primary"
                style={{ fontSize: 12.5, padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 7 }}
              >
                <LifeBuoy size={15} />
                <span>Contact Support</span>
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Keyboard Shortcuts Dialog */}
      {showShortcutsModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(12px, 4vw, 24px)',
          }}
          onClick={() => setShowShortcutsModal(false)}
        >
          <div
            className="card animate-fade-in"
            style={{
              maxWidth: 480,
              width: '100%',
              padding: 'clamp(18px, 4vw, 24px)',
              background: 'var(--bg-surface)',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius-lg, 8px)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Keyboard size={18} style={{ color: 'var(--accent)' }} />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Keyboard Shortcuts
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { key: 'Ctrl + K or /', desc: 'Focus help search bar' },
                { key: 'Esc', desc: 'Close dialogs or clear active search' },
                { key: 'Tab / Shift + Tab', desc: 'Navigate through questions and buttons' },
                { key: 'Enter / Space', desc: 'Expand or collapse highlighted question' },
              ].map((shortcut, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm, 4px)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>{shortcut.desc}</span>
                  <span style={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: 12,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    padding: '2px 8px',
                    color: 'var(--accent)',
                  }}>
                    {shortcut.key}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 6 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowShortcutsModal(false)}
                style={{ fontSize: 13, padding: '8px 18px' }}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support & Feedback Dialog */}
      {showSupportModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(12px, 4vw, 24px)',
          }}
          onClick={() => setShowSupportModal(false)}
        >
          <div
            className="card animate-fade-in"
            style={{
              maxWidth: 480,
              width: '100%',
              padding: 'clamp(18px, 4vw, 24px)',
              background: 'var(--bg-surface)',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius-lg, 8px)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <LifeBuoy size={18} style={{ color: 'var(--accent)' }} />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Contact Support & Feedback
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Need personal assistance, discovered a bug, or have a feature idea for TasksManager? Reach out directly:
            </p>

            {/* Email contact card */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md, 6px)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <Mail size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Developer Contact</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                    guptasushant812@gmail.com
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={copySupportEmail}
                className="btn btn-ghost"
                style={{ fontSize: 11, padding: '6px 12px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5 }}
              >
                {copiedEmail ? <Check size={13} style={{ color: 'var(--completed)' }} /> : <Copy size={13} />}
                <span>{copiedEmail ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            {/* GitHub Issues link */}
            <a
              href="https://github.com/guptasushant812/TasksManager/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
              style={{
                padding: '10px 14px',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                textDecoration: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare size={16} />
                <span>Submit GitHub Issue / Feature Request</span>
              </div>
              <ExternalLink size={14} />
            </a>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 6 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowSupportModal(false)}
                style={{ fontSize: 13, padding: '8px 18px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
