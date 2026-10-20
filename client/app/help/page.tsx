'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useTaskContext } from '@/context/TaskContext';
import { 
  Search, 
  ChevronDown, 
  X, 
  Mail, 
  ExternalLink, 
  HelpCircle,
  Info,
  CheckSquare,
  Sparkles,
  Zap,
  Shield
} from 'lucide-react';

interface FaqItem {
  id: string;
  category: 'tasks' | 'ai' | 'followups' | 'security';
  q: string;
  keywords?: string[];
  answer: React.ReactNode;
}

interface CategoryCard {
  id: 'tasks' | 'ai' | 'followups' | 'security';
  title: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const CATEGORIES: CategoryCard[] = [
  {
    id: 'tasks',
    title: 'Task Lifecycle',
    desc: 'Creation, priorities, status & bidirectional reasons.',
    icon: CheckSquare,
  },
  {
    id: 'ai',
    title: 'AI Prompt Engine',
    desc: 'Multilingual parsing, regeneration & auto-recovery.',
    icon: Sparkles,
  },
  {
    id: 'followups',
    title: 'Follow-ups & Alerts',
    desc: 'Interaction logs, next steps & HOD escalations.',
    icon: Zap,
  },
  {
    id: 'security',
    title: 'Security & Reports',
    desc: 'Excel/PDF exports, master password & themes.',
    icon: Shield,
  },
];

const FAQS: FaqItem[] = [
  {
    id: 'create-and-prioritize',
    category: 'tasks',
    q: 'How do I create and prioritize tasks?',
    keywords: ['create', 'new task', 'priority', 'high', 'medium', 'low', 'manual', 'due date'],
    answer: (
      <>
        <ul>
          <li>Click <code>+ New Task</code> in the header to add tasks manually or generate them with AI.</li>
          <li>Set priority to <strong>High</strong> (urgent blockers), <strong>Medium</strong> (standard deliverables), or <strong>Low</strong> (routine maintenance).</li>
          <li>Assign <strong>Task Date</strong>, optional <strong>Due Date</strong>, <strong>Given By</strong> department, and <strong>Contact Person</strong>.</li>
        </ul>
        <div className="faq-tip-box">
          <Info size={14} />
          <span>You can draft and save multiple tasks simultaneously in a single modal session.</span>
        </div>
      </>
    ),
  },
  {
    id: 'status-and-reasons',
    category: 'tasks',
    q: 'How does Work Status connect to Reason and Remarks tabs?',
    keywords: ['work status', 'reason', 'remarks', 'inprogress', 'pending', 'completed', 'bidirectional', 'tabs'],
    answer: (
      <>
        <ul>
          <li>Tasks support three active states: <strong>Pending</strong>, <strong>InProgress</strong>, and <strong>Completed</strong>.</li>
          <li>Clicking directly on <code>Reason (InProgress)</code>, <code>Reason (Pending)</code>, or <code>Reason (Completed)</code> automatically updates the <strong>Work Status</strong> field and moves the <strong>Current</strong> badge.</li>
          <li>Changing the <strong>Work Status</strong> dropdown automatically highlights the corresponding reason tab and opens the notes editor.</li>
          <li>Notes previously entered for each status are preserved across switches so context is never lost.</li>
        </ul>
        <div className="faq-tip-box">
          <Info size={14} />
          <span>Status updates and their accompanying reasons sync with the audit history upon saving.</span>
        </div>
      </>
    ),
  },
  {
    id: 'lifecycle-notes',
    category: 'tasks',
    q: 'What is the difference between Description, Reason, and Remarks?',
    keywords: ['description', 'reason', 'remarks', 'blockers', 'scope', 'wrap-up'],
    answer: (
      <ul>
        <li><strong>Description:</strong> The task scope, specifications, instructions, or deliverables.</li>
        <li><strong>Reason for Pending:</strong> Explains delays, external dependencies, or waiting periods.</li>
        <li><strong>Reason for InProgress:</strong> Active progress notes, current blockers, or sprint focus.</li>
        <li><strong>Remarks for Completed:</strong> Final delivery links, resolution notes, and closure summary.</li>
      </ul>
    ),
  },
  {
    id: 'subtasks-checklists',
    category: 'tasks',
    q: 'How do Subtasks and Checklists work?',
    keywords: ['subtasks', 'checklist', 'checkbox', 'progress', 'steps'],
    answer: (
      <ul>
        <li>Add granular action items directly to tasks to break down multi-step work.</li>
        <li>Check off items in real-time from the task table or modal dialog.</li>
        <li>Track completion with live indicator badges (e.g., <code>2/4 Subtasks</code>) displayed directly in the table.</li>
      </ul>
    ),
  },
  {
    id: 'date-filters-and-dues',
    category: 'tasks',
    q: 'How do Task Dates, Due Dates, and Date Filters work?',
    keywords: ['date', 'filter', 'due date', 'overdue', 'calendar', 'today'],
    answer: (
      <ul>
        <li><strong>Task Date:</strong> When the task was scheduled or assigned. Use the date bar in the header to switch between days.</li>
        <li><strong>Due Date:</strong> The hard deadline for completion. Tasks nearing or passing this date show warning highlights.</li>
        <li>Use <strong>Reset Filters</strong> at any time to return to today&apos;s active tasks.</li>
      </ul>
    ),
  },
  {
    id: 'ai-assistant-languages',
    category: 'ai',
    q: 'What languages and input formats does the AI Assistant understand?',
    keywords: ['ai', 'languages', 'marathi', 'hinglish', 'english', 'voice', 'speech', 'prompt'],
    answer: (
      <>
        <ul>
          <li>Type or paste natural language notes in <strong>English</strong>, <strong>Marathi</strong>, or <strong>Hinglish</strong>.</li>
          <li>Examples like <em>&ldquo;Aaj 3 PM la client meeting ahe and audit report finalize karaychi ahe&rdquo;</em> are automatically parsed.</li>
          <li>The AI engine extracts clean English titles, organized descriptions, suggested priorities, and target dates.</li>
        </ul>
        <div className="faq-tip-box">
          <Info size={14} />
          <span>Voice dictation is supported—speak in Hinglish or Marathi and convert notes to structured cards.</span>
        </div>
      </>
    ),
  },
  {
    id: 'ai-single-card-regen',
    category: 'ai',
    q: 'Can I customize or regenerate individual AI task drafts?',
    keywords: ['improve', 'regenerate', 'single card', 'ai draft', 'prompt instruction'],
    answer: (
      <ul>
        <li>Click <strong>Improve This Task</strong> on any individual AI draft card.</li>
        <li>Supply targeted instructions (e.g., <em>&ldquo;Set priority to High and split into 3 subtasks&rdquo;</em>).</li>
        <li>Only the selected task is updated, leaving all your other drafts untouched.</li>
      </ul>
    ),
  },
  {
    id: 'ai-draft-recovery',
    category: 'ai',
    q: 'How does AI draft auto-recovery and background sync work?',
    keywords: ['recovery', 'autosave', 'draft', 'sync', 'mongodb', 'offline'],
    answer: (
      <ul>
        <li>AI input text and uncommitted task drafts are continuously synchronized to MongoDB in the background.</li>
        <li>If your browser tab closes or reloads, reopening the AI modal immediately restores your in-progress work.</li>
        <li>Click <strong>Discard</strong> when you want to clear cached drafts and start fresh.</li>
      </ul>
    ),
  },
  {
    id: 'ai-models-and-byok',
    category: 'ai',
    q: 'Can I bring my own API key (BYOK) or switch AI models?',
    keywords: ['byok', 'api key', 'gemini', 'openai', 'models', 'rate limit'],
    answer: (
      <>
        <ul>
          <li>Switch between models like <strong>Gemini 2.5 Flash</strong>, <strong>Gemini 1.5 Pro</strong>, or OpenAI from the model selector.</li>
          <li>Provide your own API key under AI settings for dedicated quotas and higher concurrency.</li>
          <li>Custom API keys are stored locally in your browser session and never sent to third-party trackers.</li>
        </ul>
        <div className="faq-tip-box">
          <Info size={14} />
          <span>If rate limits are hit, a countdown banner alerts you when standard quotas reset.</span>
        </div>
      </>
    ),
  },
  {
    id: 'followups-logging',
    category: 'followups',
    q: 'How do Follow-ups (⚡ Zap) work?',
    keywords: ['followups', 'zap', 'log', 'call', 'whatsapp', 'email', 'meeting'],
    answer: (
      <ul>
        <li>Click <code>⚡ Zap</code> on any task row or navigate to the <strong>Follow-ups</strong> workspace.</li>
        <li>Log interaction channels: <strong>Phone Call</strong>, <strong>WhatsApp</strong>, <strong>Email</strong>, <strong>In-Person Meeting</strong>, or <strong>Internal Note</strong>.</li>
        <li>Record contact name, conversation outcome, and set the next follow-up schedule date.</li>
      </ul>
    ),
  },
  {
    id: 'automatic-escalation',
    category: 'followups',
    q: 'How do automatic HOD & Management escalations trigger?',
    keywords: ['escalation', 'hod', 'dyhod', 'manager', 'alerts', 'threshold'],
    answer: (
      <>
        <ul>
          <li>Configure an attempt threshold in <code>Settings → Escalation</code> (e.g., 3 follow-ups).</li>
          <li>When follow-up attempts reach this limit, an <strong>Escalated</strong> warning flag triggers on the task.</li>
          <li>Automated email alerts are dispatched to the configured <strong>Manager</strong>, <strong>HOD</strong>, and <strong>DyHOD</strong> email addresses.</li>
        </ul>
        <div className="faq-tip-box">
          <Info size={14} />
          <span>Escalation policies ensure overdue critical tasks receive management visibility before deadlines pass.</span>
        </div>
      </>
    ),
  },
  {
    id: 'followup-workspace',
    category: 'followups',
    q: 'Where can I track overdue or pending follow-ups?',
    keywords: ['workspace', 'timeline', 'overdue', 'pending follow-ups'],
    answer: (
      <ul>
        <li>Open <strong>Follow-ups</strong> in the sidebar to view the consolidated interaction timeline.</li>
        <li>Filter by upcoming, completed, or overdue follow-up dates.</li>
        <li>Quickly resolve or reschedule next contact dates directly from the timeline cards.</li>
      </ul>
    ),
  },
  {
    id: 'exports-and-reports',
    category: 'security',
    q: 'How do I export tasks to Excel (.xlsx) or PDF?',
    keywords: ['export', 'excel', 'xlsx', 'pdf', 'report', 'summary'],
    answer: (
      <ul>
        <li>Click <strong>Export</strong> in the header to download <strong>Excel (.xlsx)</strong> spreadsheets or formatted <strong>PDF</strong> documents.</li>
        <li>Export files include color-coded priority indicators, complete descriptions, and distinct reason columns.</li>
        <li>A date-validation check warns if the selected filter contains zero tasks to prevent empty downloads.</li>
      </ul>
    ),
  },
  {
    id: 'master-password',
    category: 'security',
    q: 'How does Master Password protection work?',
    keywords: ['master password', 'pin', 'lock', 'security', 'unlock'],
    answer: (
      <ul>
        <li>Set a master password in <code>Settings → Security</code> to guard sensitive operations and workspace access.</li>
        <li>When locked, task cards and follow-up data remain shielded until the password or PIN is verified.</li>
        <li>Session locks can also be engaged manually via the user profile menu.</li>
      </ul>
    ),
  },
  {
    id: 'auto-lock-and-themes',
    category: 'security',
    q: 'How do Auto-Lock timers, Themes, and Shortcuts work?',
    keywords: ['auto-lock', 'inactivity', 'themes', 'dark mode', 'cyberpunk', 'shortcuts', 'keyboard'],
    answer: (
      <ul>
        <li><strong>Auto-Lock:</strong> Automatically locks the workspace after 5 minutes to 1 hour of inactivity.</li>
        <li><strong>Themes:</strong> Choose between <strong>Cyberpunk (Dark Tech)</strong>, <strong>Neo-Brutalist (Light)</strong>, or <strong>Slate Blue</strong> in Settings.</li>
        <li><strong>Keyboard Shortcuts:</strong> Press <kbd>/</kbd> to jump straight to search, and <kbd>Esc</kbd> to clear filters or close modals.</li>
      </ul>
    ),
  },
];

export default function HelpPage() {
  const { filters, handleTaskCreated } = useTaskContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'create-and-prioritize': true,
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const searchQueryRef = useRef(searchQuery);
  searchQueryRef.current = searchQuery;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (searchQueryRef.current) {
          setSearchQuery('');
        } else {
          setOpenItems({});
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return FAQS.filter(item => {
      const matchesCategory = !activeCategory || item.category === activeCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      const inTitle = item.q.toLowerCase().includes(q);
      const inKeywords = item.keywords?.some(k => k.toLowerCase().includes(q));
      return inTitle || inKeywords;
    });
  }, [activeCategory, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      counts[cat.id] = FAQS.filter(f => f.category === cat.id).length;
    }
    return counts;
  }, []);

  const toggleItem = (id: string) => {
    setOpenItems(prev => (prev[id] ? {} : { [id]: true }));
  };

  const areAllOpen = useMemo(() => {
    if (filteredFaqs.length === 0) return false;
    return filteredFaqs.every(item => !!openItems[item.id]);
  }, [filteredFaqs, openItems]);

  const handleToggleAll = () => {
    const nextState = !areAllOpen;
    if (!nextState) {
      setOpenItems({});
    } else {
      const updated: Record<string, boolean> = {};
      filteredFaqs.forEach(item => {
        updated[item.id] = true;
      });
      setOpenItems(updated);
    }
  };

  const handleSelectCategory = (catId: string) => {
    if (activeCategory === catId) {
      setActiveCategory(null);
    } else {
      setActiveCategory(catId);
    }
  };

  const activeCategoryMeta = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div className="page-layout">
      <Header filters={filters} onTaskCreated={handleTaskCreated} />

      <main className="page-content" style={{ maxWidth: 940 }}>
        <div className="faq-hub-wrap">
          <header className="faq-hero">
            <span className="faq-hero-badge">
              <HelpCircle size={13} />
              Help &amp; FAQ
            </span>
            <h1 className="faq-hero-title">Frequently Asked Questions</h1>
            <p className="faq-hero-subtitle">
              Quick answers about task workflows, AI features, follow-ups, and security.
            </p>

            <div className="faq-search-wrapper">
              <Search size={16} className="faq-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by keyword (e.g. AI, follow-up, excel, password...)"
                className="faq-search-input"
                aria-label="Search FAQs"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="faq-search-clear"
                  title="Clear search"
                >
                  <X size={12} />
                  <span>Clear</span>
                </button>
              ) : (
                <div className="faq-search-shortcut" title="Press / to search">
                  <span>/</span>
                </div>
              )}
            </div>
          </header>

          <section className="faq-grid-section" aria-label="Browse by Category">
            <div className="faq-grid-header">
              <h2 className="faq-grid-title">Browse by Category</h2>
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className={`faq-all-pill-btn ${activeCategory === null ? 'active' : ''}`}
              >
                All Topics ({FAQS.length})
              </button>
            </div>

            <div className="faq-category-grid">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                const count = categoryCounts[cat.id] || 0;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`faq-category-card ${isActive ? 'active' : ''}`}
                    aria-pressed={isActive}
                  >
                    <div className="faq-category-card-top">
                      <div className="faq-category-icon-box">
                        <Icon size={16} />
                      </div>
                      <span className="faq-category-count">{count}</span>
                    </div>
                    <h3 className="faq-category-card-title">{cat.title}</h3>
                    <p className="faq-category-card-desc">{cat.desc}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="faq-list-section" ref={listRef} aria-label="Questions and Answers">
            <div className="faq-section-header">
              <div className="faq-section-title-wrap">
                <h2 className="faq-section-title">
                  {searchQuery 
                    ? `Results for "${searchQuery}"` 
                    : activeCategoryMeta 
                      ? activeCategoryMeta.title 
                      : 'Common Questions'}
                </h2>
                <span className="faq-section-count">
                  ({filteredFaqs.length} {filteredFaqs.length === 1 ? 'item' : 'items'})
                </span>
              </div>

              {filteredFaqs.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleAll}
                  className="faq-expand-btn"
                >
                  {areAllOpen ? 'Collapse all' : 'Expand all'}
                </button>
              )}
            </div>

            {filteredFaqs.length > 0 ? (
              <div className="faq-accordion-list" role="region">
                {filteredFaqs.map(faq => {
                  const isOpen = !!openItems[faq.id];
                  return (
                    <article 
                      key={faq.id} 
                      className={`faq-item-card ${isOpen ? 'open' : ''}`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleItem(faq.id)}
                        className="faq-item-trigger"
                        aria-expanded={isOpen}
                        aria-controls={`faq-answer-${faq.id}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                          <span className="faq-item-tag">{CATEGORIES.find(c => c.id === faq.category)?.title.split(' ')[0]}</span>
                          <h3 className="faq-item-question">{faq.q}</h3>
                        </div>
                        <div className="faq-item-chevron-wrap">
                          <ChevronDown size={14} className="faq-item-chevron" />
                        </div>
                      </button>

                      <div
                        id={`faq-answer-${faq.id}`}
                        className="faq-item-collapse"
                        role="region"
                        aria-hidden={!isOpen}
                      >
                        <div className="faq-item-collapse-inner">
                          <div className="faq-item-body">
                            {faq.answer}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="faq-empty-state">
                <Search size={24} className="text-muted" />
                <h3 className="faq-empty-title">No matching questions found</h3>
                <p className="faq-empty-desc">
                  We couldn&apos;t find anything matching &ldquo;{searchQuery}&rdquo;. Try another search term or reset filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory(null);
                  }}
                  className="faq-empty-btn"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </section>

          <footer className="faq-contact-card">
            <div className="faq-contact-text">
              <h3 className="faq-contact-title">Still have questions?</h3>
              <p className="faq-contact-desc">
                Our support team is here to help with escalation policies, custom workflows, or account inquiries.
              </p>
            </div>
            <div className="faq-contact-actions">
              <a 
                href="mailto:support@tasksmanager.local" 
                className="faq-contact-btn"
              >
                <Mail size={13} />
                <span>Email Support</span>
              </a>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="faq-contact-btn"
              >
                <ExternalLink size={13} />
                <span>GitHub Issues</span>
              </a>
            </div>
          </footer>

        </div>
      </main>
    </div>
  );
}
