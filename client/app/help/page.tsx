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
  CheckCircle2
} from 'lucide-react';

interface FaqItem {
  id: string;
  category: 'tasks' | 'ai' | 'followups' | 'security';
  q: string;
  answer: React.ReactNode;
}

const CATEGORIES = [
  { id: 'all', label: 'All Questions' },
  { id: 'tasks', label: 'Tasks & Workflow' },
  { id: 'ai', label: 'AI Assistant' },
  { id: 'followups', label: 'Follow-ups & Escalations' },
  { id: 'security', label: 'Security & Exports' },
] as const;

type FilterId = typeof CATEGORIES[number]['id'];

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
          <li><strong>Priorities:</strong> Assign <strong>High</strong> (urgent blockers), <strong>Medium</strong> (standard schedule), or <strong>Low</strong> (routine tasks) to control visual prominence.</li>
          <li><strong>Due Dates:</strong> Assign specific calendar dates and use the top date-picker or <em>Today&apos;s Focus</em> filter to view daily workloads.</li>
          <li><strong>Subtask Checklists:</strong> Add ordered subtasks inside the task editor to track itemized progress directly from the card.</li>
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
          TasksManager separates task scope from operational progress notes to keep audit records clean:
        </p>
        <ul>
          <li><strong>Description:</strong> Defines the deliverable and scope created at the beginning.</li>
          <li><strong>Reason (Pending / In Progress):</strong> Explains why a task is currently held up or delayed (e.g. pending vendor response or approval).</li>
          <li><strong>Remarks (Completed):</strong> The closing resolution notes or reference numbers recorded when completing the task.</li>
        </ul>
        <div className="faq-tip">
          <Info size={16} />
          <span>Every status change automatically logs the timestamp and reason into the task&apos;s audit history.</span>
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
          <li><strong>Single Card Regeneration:</strong> If one task card in a generated batch needs revision, click its individual refresh icon without re-running the entire prompt.</li>
          <li><strong>Draft Auto-Save:</strong> Uncommitted drafts are automatically preserved in local browser storage so you never lose progress if the modal closes.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'followups-and-escalations',
    category: 'followups',
    q: 'How do Follow-ups (⚡ Zap) and automatic escalations work?',
    answer: (
      <>
        <p>
          For tasks that depend on external parties or awaiting feedback, use the follow-up timeline:
        </p>
        <ul>
          <li><strong>Log Interactions:</strong> Click <code>⚡ Zap</code> on any task card to log phone calls, WhatsApp messages, emails, or meetings, along with contact names and next follow-up dates.</li>
          <li><strong>Automatic Escalation:</strong> Set a follow-up threshold in <code>Settings → Escalation</code> (e.g. 3 attempts). If a task exceeds this threshold without resolution, it triggers an <strong>Escalated</strong> warning flag.</li>
          <li><strong>Notification Routing:</strong> Escalations automatically dispatch email alerts to your configured Manager, HOD, and DyHOD addresses.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'exports-and-reports',
    category: 'security',
    q: 'How do I export task reports to Excel or PDF?',
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
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'create-and-prioritize': true,
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Filter FAQs based on category filter and search query
  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return FAQS.filter(item => {
      const matchesFilter = activeFilter === 'all' || item.category === activeFilter;
      if (!matchesFilter) return false;
      if (!q) return true;
      return item.q.toLowerCase().includes(q) || (typeof item.answer === 'string' && item.answer.toLowerCase().includes(q));
    });
  }, [activeFilter, searchQuery]);

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

  return (
    <div className="page-layout">
      <Header filters={filters} onTaskCreated={handleTaskCreated} />

      <main className="page-content" style={{ maxWidth: 860 }}>
        <div className="faq-wrapper">

          {/* Clean Focused Header */}
          <header className="faq-header">
            <span className="faq-badge">
              <HelpCircle size={13} />
              Help &amp; FAQ
            </span>
            <h1 className="faq-title">Frequently Asked Questions</h1>
            <p className="faq-subtitle">
              Quick, clear answers to help you navigate task creation, AI workflows, and system settings.
            </p>
          </header>

          {/* Minimalist Search Box */}
          <div className="faq-search-box">
            <Search size={16} className="faq-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search questions or keywords..."
              className="faq-search-input"
              aria-label="Search FAQ"
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

          {/* Category Filter Pills */}
          <nav className="faq-pills-bar" aria-label="FAQ Categories">
            {CATEGORIES.map(cat => {
              const isActive = activeFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveFilter(cat.id)}
                  className={`faq-pill-btn ${isActive ? 'active' : ''}`}
                >
                  {cat.label}
                </button>
              );
            })}
          </nav>

          {/* Meta & Toggle Bar */}
          <div className="faq-meta-bar">
            <span className="faq-meta-count">
              Showing {filteredFaqs.length} {filteredFaqs.length === 1 ? 'question' : 'questions'}
            </span>
            {filteredFaqs.length > 0 && (
              <button
                type="button"
                onClick={handleToggleAll}
                className="faq-toggle-all-btn"
              >
                {areAllOpen ? 'Collapse all' : 'Expand all'}
              </button>
            )}
          </div>

          {/* Clean Accordion List */}
          {filteredFaqs.length > 0 ? (
            <div className="faq-list">
              {filteredFaqs.map(faq => {
                const isOpen = !!openItems[faq.id];
                return (
                  <article 
                    key={faq.id} 
                    className={`faq-card ${isOpen ? 'open' : ''}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleItem(faq.id)}
                      className="faq-trigger"
                      aria-expanded={isOpen}
                    >
                      <h2 className="faq-question">{faq.q}</h2>
                      <div className="faq-chevron-wrap">
                        <ChevronDown size={15} className="faq-chevron" />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="faq-body">
                        {faq.answer}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="faq-empty">
              <Search size={24} className="text-muted" />
              <h3 className="faq-empty-title">No matching questions found</h3>
              <p className="faq-empty-desc">
                We couldn&apos;t find anything matching &ldquo;{searchQuery}&rdquo;. Try another search term or clear filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
                className="faq-empty-btn"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Sleek Support Card */}
          <aside className="faq-support-card">
            <div className="faq-support-text">
              <h3 className="faq-support-title">Still have questions?</h3>
              <p className="faq-support-desc">
                Can&apos;t find what you&apos;re looking for? Reach out to our team or report an issue.
              </p>
            </div>
            <div className="faq-support-links">
              <a 
                href="mailto:support@tasksmanager.local" 
                className="faq-support-btn"
              >
                <Mail size={13} />
                <span>Email Support</span>
              </a>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="faq-support-btn"
              >
                <ExternalLink size={13} />
                <span>GitHub</span>
              </a>
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}
