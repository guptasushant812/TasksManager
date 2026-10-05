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
  Shield,
  Layers
} from 'lucide-react';

interface FaqItem {
  id: string;
  category: 'tasks' | 'ai' | 'followups' | 'security';
  q: string;
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
    title: 'Task Management',
    desc: 'Creation, priorities, checklist subtasks & lifecycle states.',
    icon: CheckSquare,
  },
  {
    id: 'ai',
    title: 'AI Task Assistant',
    desc: 'Gemini multilingual parsing, card regeneration & draft recovery.',
    icon: Sparkles,
  },
  {
    id: 'followups',
    title: 'Follow-ups & Escalation',
    desc: 'Communication logs, next dates & automated HOD alerts.',
    icon: Zap,
  },
  {
    id: 'security',
    title: 'Security & Exports',
    desc: 'Excel/PDF reports, master password & auto-lock timeouts.',
    icon: Shield,
  },
];

const FAQS: FaqItem[] = [
  {
    id: 'create-and-prioritize',
    category: 'tasks',
    q: 'How do I create, organize, and prioritize tasks?',
    answer: (
      <>
        <p>
          You can create tasks either by clicking <code>+ New Task</code> in the header to open the manual form, or by using the <strong>AI Assistant</strong> to generate them from raw notes.
        </p>
        <ul>
          <li><strong>Priorities:</strong> Assign <strong>High</strong> (critical path blockers), <strong>Medium</strong> (scheduled operations), or <strong>Low</strong> (routine tasks) to control visual urgency.</li>
          <li><strong>Due Dates:</strong> Assign calendar due dates and use the top date-picker or <em>Today&apos;s Focus</em> filter to isolate daily workloads.</li>
          <li><strong>Subtask Checklists:</strong> Add ordered subtasks inside the task editor to track itemized checklist progress directly from the card.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'lifecycle-notes',
    category: 'tasks',
    q: 'What is the difference between Description, Reason, and Remarks?',
    answer: (
      <>
        <p>
          TasksManager separates the core deliverable scope from operational progress notes to keep audit records clean:
        </p>
        <ul>
          <li><strong>Description:</strong> Defines the deliverable and scope created at the beginning.</li>
          <li><strong>Reason (Pending / In Progress):</strong> Explains operational blockers or delays (e.g. awaiting external vendor approval or IT resolution).</li>
          <li><strong>Remarks (Completed):</strong> The closing resolution notes or reference numbers recorded when completing the task.</li>
        </ul>
        <div className="faq-tip-box">
          <Info size={16} />
          <span>Every status change automatically logs the timestamp and reason into the task&apos;s immutable audit history.</span>
        </div>
      </>
    ),
  },
  {
    id: 'ai-assistant-features',
    category: 'ai',
    q: 'How does the AI Assistant work and what languages are supported?',
    answer: (
      <>
        <p>
          The AI Assistant uses Google Gemini to turn unformatted notes or meeting transcripts into structured task records:
        </p>
        <ul>
          <li><strong>Multilingual Understanding:</strong> It naturally interprets notes in <strong>English</strong>, <strong>Marathi</strong> (e.g. <em>&ldquo;HOD sir ni sangitla exam timetable tayar karaycha aahe&rdquo;</em>), and <strong>Hinglish</strong>, automatically standardizing them into clean English task fields.</li>
          <li><strong>Automated Extraction:</strong> Automatically sets concise titles, operational descriptions, extracted subtask checklists, and predicted priority levels.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'ai-single-card-regen',
    category: 'ai',
    q: 'Can I regenerate a single draft card without re-running the entire prompt?',
    answer: (
      <>
        <p>
          Yes. Multi-task draft management is built for granular control:
        </p>
        <ul>
          <li><strong>Single Card Regeneration:</strong> If one task card in a generated batch needs revision, click its individual refresh icon without discarding your other cards.</li>
          <li><strong>Draft Auto-Save:</strong> Uncommitted drafts are automatically preserved in local browser storage so you never lose progress if the modal closes.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'followups-logging',
    category: 'followups',
    q: 'What is the Follow-up (⚡ Zap) module and how do I log interactions?',
    answer: (
      <>
        <p>
          For tasks that depend on external parties or awaiting departmental feedback, use the follow-up timeline:
        </p>
        <ul>
          <li><strong>Log Interactions:</strong> Click <code>⚡ Zap</code> on any task card to log phone calls, WhatsApp messages, emails, or meetings, along with contact names and next follow-up dates.</li>
          <li><strong>Chronological Audit:</strong> All communication touchpoints are saved to an immutable timeline with timestamps and interaction outcomes.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'automatic-escalation',
    category: 'followups',
    q: 'How does the Automatic Escalation policy trigger and who gets notified?',
    answer: (
      <>
        <p>
          To prevent pending tasks from slipping through the cracks, TasksManager provides threshold-based automated escalation:
        </p>
        <ul>
          <li><strong>Configurable Threshold:</strong> Set a follow-up threshold in <code>Settings → Escalation</code> (e.g. 3 attempts). If a task exceeds this threshold without resolution, it triggers an <strong>Escalated</strong> warning flag.</li>
          <li><strong>Notification Routing:</strong> Escalations automatically dispatch email alerts to your configured Manager, HOD, and DyHOD addresses.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'exports-and-reports',
    category: 'security',
    q: 'How do I export task reports to Microsoft Excel or PDF?',
    answer: (
      <>
        <p>
          TasksManager provides corporate-grade export formats for reporting:
        </p>
        <ul>
          <li><strong>Excel (.xlsx):</strong> Exports formatted spreadsheets complete with color-coded status badges, delay reasons, completion remarks, and full audit timelines.</li>
          <li><strong>PDF Summary:</strong> Generates executive summary sheets displaying departmental completion statistics and structured task registers.</li>
          <li><strong>Zero-Task Safeguard:</strong> If your active date filter has 0 tasks, the system warns you before export to avoid generating blank documents.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'security-and-settings',
    category: 'security',
    q: 'How do Master Passwords, Inactivity Lock, and Themes work?',
    answer: (
      <>
        <p>
          All workspace controls are located in the <strong>Settings</strong> page:
        </p>
        <ul>
          <li><strong>Master Security Password:</strong> Guards sensitive operations and lets you lock the workspace when stepping away.</li>
          <li><strong>Auto-Lock Inactivity:</strong> Set an inactivity timeout (5m, 15m, 30m, 1hr) to automatically blur and lock the screen during periods of inactivity.</li>
          <li><strong>Public Share Links:</strong> Generate read-only links to share daily progress with stakeholders without granting editing rights.</li>
          <li><strong>Interface Themes:</strong> Switch between <strong>Cyberpunk</strong> (Dark &amp; Neon), <strong>Neo-Brutalist</strong> (Clean White), and <strong>Midnight Slate</strong> (Deep Blue).</li>
        </ul>
      </>
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

  // Keyboard shortcut: '/' focuses search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter FAQs based on active category card and search query
  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return FAQS.filter(item => {
      const matchesCategory = !activeCategory || item.category === activeCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return item.q.toLowerCase().includes(q) || (typeof item.answer === 'string' && item.answer.toLowerCase().includes(q));
    });
  }, [activeCategory, searchQuery]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      counts[cat.id] = FAQS.filter(f => f.category === cat.id).length;
    }
    return counts;
  }, []);

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const areAllOpen = useMemo(() => {
    if (filteredFaqs.length === 0) return false;
    return filteredFaqs.every(item => !!openItems[item.id]);
  }, [filteredFaqs, openItems]);

  const handleToggleAll = () => {
    const nextState = !areAllOpen;
    const updated: Record<string, boolean> = {};
    filteredFaqs.forEach(item => {
      updated[item.id] = nextState;
    });
    setOpenItems(prev => ({ ...prev, ...updated }));
  };

  const handleSelectCategory = (catId: string) => {
    if (activeCategory === catId) {
      setActiveCategory(null); // toggle off to show all
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

          {/* ── 1. Hero & Instant Search ── */}
          <header className="faq-hero">
            <span className="faq-hero-badge">
              <HelpCircle size={13} />
              Support &amp; Knowledge Hub
            </span>
            <h1 className="faq-hero-title">How can we help you today?</h1>
            <p className="faq-hero-subtitle">
              Find quick answers to common questions about task creation, AI workflows, follow-ups, and security.
            </p>

            {/* Search Input Bar */}
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

          {/* ── 2. Category Hub Grid (Inspired by Caesarstone & Airtable) ── */}
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

          {/* ── 3. Accordion List Section (Inspired by Microsoft & Nike) ── */}
          <section className="faq-list-section" ref={listRef} aria-label="Questions and Answers">
            <div className="faq-section-header">
              <div className="faq-section-title-wrap">
                <h2 className="faq-section-title">
                  {searchQuery 
                    ? `Results for "${searchQuery}"` 
                    : activeCategoryMeta 
                      ? activeCategoryMeta.title 
                      : 'Frequently Asked Questions'}
                </h2>
                <span className="faq-section-count">
                  ({filteredFaqs.length} {filteredFaqs.length === 1 ? 'question' : 'questions'})
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

            {/* Accordion Questions */}
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
                      >
                        <h3 className="faq-item-question">{faq.q}</h3>
                        <div className="faq-item-chevron-wrap">
                          <ChevronDown size={14} className="faq-item-chevron" />
                        </div>
                      </button>

                      {isOpen && (
                        <div className="faq-item-body">
                          {faq.answer}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="faq-empty-state">
                <Search size={24} className="text-muted" />
                <h3 className="faq-empty-title">No matching questions found</h3>
                <p className="faq-empty-desc">
                  We couldn&apos;t find anything matching &ldquo;{searchQuery}&rdquo;. Try another search term or reset category filters.
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

          {/* ── 4. Contact & Support Section (Inspired by Lucy & Yak, Wateraid) ── */}
          <footer className="faq-contact-card">
            <div className="faq-contact-text">
              <h3 className="faq-contact-title">Didn&apos;t find what you were looking for?</h3>
              <p className="faq-contact-desc">
                Our engineering team is ready to help with escalation policies, custom workflows, or account inquiries.
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
