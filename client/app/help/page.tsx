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
    desc: 'Create tasks, set priorities & subtasks.',
    icon: CheckSquare,
  },
  {
    id: 'ai',
    title: 'AI Task Assistant',
    desc: 'Marathi, Hinglish & English prompt parsing.',
    icon: Sparkles,
  },
  {
    id: 'followups',
    title: 'Follow-ups & Escalation',
    desc: 'Log contacts & automated HOD alerts.',
    icon: Zap,
  },
  {
    id: 'security',
    title: 'Security & Exports',
    desc: 'Excel/PDF reports, auto-lock & themes.',
    icon: Shield,
  },
];

const FAQS: FaqItem[] = [
  {
    id: 'create-and-prioritize',
    category: 'tasks',
    q: 'How do I create and prioritize tasks?',
    answer: (
      <ul>
        <li>Click <code>+ New Task</code> to create manually or generate with AI.</li>
        <li>Set priority to <strong>High</strong> (urgent), <strong>Medium</strong> (normal), or <strong>Low</strong> (routine).</li>
        <li>Add due dates and subtasks to track progress step-by-step.</li>
      </ul>
    ),
  },
  {
    id: 'lifecycle-notes',
    category: 'tasks',
    q: 'What is Description, Reason, and Remarks?',
    answer: (
      <>
        <ul>
          <li><strong>Description:</strong> What needs to be done (task scope).</li>
          <li><strong>Reason:</strong> Why a task is delayed or pending (blockers).</li>
          <li><strong>Remarks:</strong> Wrap-up notes added when marked completed.</li>
        </ul>
        <div className="faq-tip-box">
          <Info size={14} />
          <span>Status changes are saved to the audit log automatically.</span>
        </div>
      </>
    ),
  },
  {
    id: 'ai-assistant-features',
    category: 'ai',
    q: 'What languages does the AI Assistant understand?',
    answer: (
      <ul>
        <li>Type or paste notes in <strong>English</strong>, <strong>Marathi</strong>, or <strong>Hinglish</strong>.</li>
        <li>Gemini AI converts them into clean English task cards with priorities, subtasks, and dates.</li>
      </ul>
    ),
  },
  {
    id: 'ai-single-card-regen',
    category: 'ai',
    q: 'Can I edit or regenerate individual AI cards?',
    answer: (
      <ul>
        <li>Click the 🔄 refresh icon on any single card to regenerate it.</li>
        <li>Unsaved drafts are auto-saved in your browser so you never lose work.</li>
      </ul>
    ),
  },
  {
    id: 'followups-logging',
    category: 'followups',
    q: 'How do Follow-ups (⚡ Zap) work?',
    answer: (
      <ul>
        <li>Click <code>⚡ Zap</code> on any task to log calls, WhatsApp messages, emails, or meetings.</li>
        <li>Save contact names, notes, and next follow-up dates to keep an audit trail.</li>
      </ul>
    ),
  },
  {
    id: 'automatic-escalation',
    category: 'followups',
    q: 'How do automatic escalations work?',
    answer: (
      <ul>
        <li>Set a threshold in <code>Settings → Escalation</code> (e.g. 3 attempts).</li>
        <li>If a task exceeds this limit, an <strong>Escalated</strong> warning flag triggers.</li>
        <li>Automated email alerts are sent to your Manager, HOD, and DyHOD.</li>
      </ul>
    ),
  },
  {
    id: 'exports-and-reports',
    category: 'security',
    q: 'How do I export to Excel or PDF?',
    answer: (
      <ul>
        <li>Click <strong>Export</strong> to download styled <strong>Excel (.xlsx)</strong> or <strong>PDF</strong> summaries.</li>
        <li>If no tasks exist for the chosen date, a quick warning prevents blank files.</li>
      </ul>
    ),
  },
  {
    id: 'security-and-settings',
    category: 'security',
    q: 'How do Security, Auto-Lock, and Themes work?',
    answer: (
      <ul>
        <li><strong>Master Password:</strong> Protects sensitive actions and workspace unlock.</li>
        <li><strong>Auto-Lock:</strong> Locks the screen after 5m to 1hr of inactivity.</li>
        <li><strong>Themes:</strong> Choose Cyberpunk (Dark), Neo-Brutalist (White), or Slate (Blue) in <code>Settings</code>.</li>
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
    setOpenItems(prev => {
      // If the clicked accordion is already open, close it
      if (prev[id]) {
        return {};
      }
      // If opening a new accordion, automatically close any previously open accordion
      return { [id]: true };
    });
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
              Help &amp; FAQ
            </span>
            <h1 className="faq-hero-title">Frequently Asked Questions</h1>
            <p className="faq-hero-subtitle">
              Quick answers about task workflows, AI features, follow-ups, and security.
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

          {/* ── 2. Category Hub Grid ── */}
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

          {/* ── 3. Accordion List Section ── */}
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
                        aria-controls={`faq-answer-${faq.id}`}
                      >
                        <h3 className="faq-item-question">{faq.q}</h3>
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

          {/* ── 4. Contact & Support Section ── */}
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
