'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useTaskContext } from '@/context/TaskContext';
import { 
  Search, 
  Plus, 
  Sparkles, 
  Zap, 
  FileSpreadsheet, 
  Shield, 
  Sliders, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Mail, 
  ExternalLink, 
  BookOpen, 
  Info,
  CheckCircle2,
  Lock,
  Clock,
  Layers
} from 'lucide-react';

interface FaqItem {
  id: string;
  category: 'tasks' | 'ai-assistant' | 'followups' | 'reports' | 'security' | 'settings-system';
  q: string;
  answer: React.ReactNode;
}

const CATEGORIES = [
  { id: 'all', label: 'All Topics', icon: BookOpen },
  { id: 'tasks', label: 'Task Creation & Lifecycle', icon: Plus },
  { id: 'ai-assistant', label: 'AI Task Assistant', icon: Sparkles },
  { id: 'followups', label: 'Follow-ups & Escalations', icon: Zap },
  { id: 'reports', label: 'Reports & Exports', icon: FileSpreadsheet },
  { id: 'security', label: 'Security & Auto-Lock', icon: Shield },
  { id: 'settings-system', label: 'Settings & Interface', icon: Sliders },
] as const;

type CategoryId = typeof CATEGORIES[number]['id'];

const FAQS: FaqItem[] = [
  // ── 1. Task Creation & Lifecycle ──────────────────────────────────────────
  {
    id: 'task-creation-workflow',
    category: 'tasks',
    q: 'How do I create and prioritize tasks?',
    answer: (
      <>
        <p>
          Tasks can be created either manually via the structured form or generated in batches using the AI Assistant:
        </p>
        <ol>
          <li>Click the <code>+ New Task</code> button in the top navigation header.</li>
          <li>Choose <strong>Manual Form</strong> to specify title, priority, category, due date, and subtasks.</li>
          <li>
            Select a priority level based on urgency:
            <ul>
              <li><strong>High:</strong> Critical path items that require immediate resolution and daily monitoring.</li>
              <li><strong>Medium:</strong> Standard operational tasks scheduled for completion within the cycle.</li>
              <li><strong>Low:</strong> Routine or backlog items with flexible turnaround times.</li>
            </ul>
          </li>
          <li>Click <strong>Save Task</strong> to commit the entry to your active schedule.</li>
        </ol>
      </>
    ),
  },
  {
    id: 'description-vs-reason-vs-remarks',
    category: 'tasks',
    q: 'What is the distinction between Description, Reason, and Remarks?',
    answer: (
      <>
        <p>
          TasksManager maintains a strict data lifecycle to preserve operational clarity across team handoffs:
        </p>
        <ul>
          <li>
            <strong>Description:</strong> The task scope and primary deliverable. Defined at creation and specifies <em>what</em> must be accomplished.
          </li>
          <li>
            <strong>Reason (Pending / In-Progress):</strong> Explains operational blockers, pending external approvals, or bottlenecks. Required when transitioning tasks out of active progress so team members understand delays.
          </li>
          <li>
            <strong>Remarks (Completed):</strong> The closing documentation entered when marking a task complete. Documents final deliverables, document reference numbers, or resolution notes.
          </li>
        </ul>
        <div className="help-tip-callout">
          <Info size={16} />
          <span>
            <strong>Audit Preservation:</strong> Changing a task's status automatically logs the timestamp, reason, and transition history in the task's audit ledger.
          </span>
        </div>
      </>
    ),
  },
  {
    id: 'subtasks-and-checklists',
    category: 'tasks',
    q: 'How do subtasks and itemized checklists work?',
    answer: (
      <>
        <p>
          Large deliverables can be broken down into ordered subtasks inside the task editor:
        </p>
        <ul>
          <li>Type individual checklist items in the subtasks section and press <code>Enter</code> to append.</li>
          <li>Toggle checkboxes directly from the task card to record incremental progress.</li>
          <li>The card displays a visual progress indicator showing completed versus total subtasks (e.g. <code>3/5 done</code>).</li>
        </ul>
      </>
    ),
  },
  {
    id: 'date-filters-and-focus',
    category: 'tasks',
    q: 'How do I filter tasks by date or view historical records?',
    answer: (
      <>
        <p>
          The top navigation bar contains date controls tailored for high-velocity review:
        </p>
        <ul>
          <li>
            <strong>Date Picker:</strong> Select any calendar date to inspect scheduled deliverables for that specific day.
          </li>
          <li>
            <strong>Today's Focus:</strong> One-click preset to instantly return to today's active task register.
          </li>
          <li>
            <strong>Status Filters:</strong> Narrow views by <em>All</em>, <em>Pending</em>, <em>In Progress</em>, or <em>Completed</em> without modifying date parameters.
          </li>
        </ul>
      </>
    ),
  },

  // ── 2. AI Task Assistant ──────────────────────────────────────────────────
  {
    id: 'ai-prompt-parsing',
    category: 'ai-assistant',
    q: 'How does the AI Assistant parse natural language into structured tasks?',
    answer: (
      <>
        <p>
          The AI Task Assistant uses Google Gemini to transform unstructured paragraphs, meeting notes, or bullet points into production-ready task records:
        </p>
        <ul>
          <li>Click <code>+ New Task</code> and select the <strong>AI Assistant</strong> tab.</li>
          <li>Paste or type conversational meeting notes, action items, or departmental directives.</li>
          <li>The model automatically extracts and maps:
            <ul>
              <li>Concise, action-oriented <strong>Titles</strong></li>
              <li>Operational <strong>Descriptions</strong> and extracted <strong>Subtask</strong> lists</li>
              <li>Estimated <strong>Priority</strong> (High, Medium, Low) based on context</li>
              <li>Departmental <strong>Categories</strong> and targeted <strong>Due Dates</strong></li>
            </ul>
          </li>
          <li>Review the generated card drafts before saving to ensure full alignment.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'ai-multilingual-support',
    category: 'ai-assistant',
    q: 'Does the AI Assistant support Marathi, Hinglish, and regional phrasing?',
    answer: (
      <>
        <p>
          Yes. The AI pipeline is trained on multilingual phrasing common in Indian enterprise and academic environments:
        </p>
        <ul>
          <li><strong>Marathi:</strong> Prompts like <em>"HOD sir ni sangitla exam timetable tayar karaycha aahe, subtasks batch count ani room allocation"</em> are recognized accurately.</li>
          <li><strong>Hinglish:</strong> Mixed English and Hindi instructions are parsed without requiring formal grammar.</li>
          <li><strong>Standardized Output:</strong> Regardless of prompt language, the resulting task titles and descriptions are standardized into clean, professional English task objects.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'ai-single-card-regeneration',
    category: 'ai-assistant',
    q: 'Can I regenerate a single draft card without re-running the entire batch?',
    answer: (
      <>
        <p>
          Yes. In multi-task AI generation sessions:
        </p>
        <ul>
          <li>Each generated draft card displays an individual <strong>Regenerate</strong> icon button.</li>
          <li>Clicking regenerate refines only that single item while keeping your edits to other cards intact.</li>
          <li>You can also click <code>+ Add Another Task</code> to manually insert a blank card alongside AI-generated drafts.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'ai-draft-safety-and-recovery',
    category: 'ai-assistant',
    q: 'Are uncommitted drafts protected against accidental closure or page refresh?',
    answer: (
      <>
        <p>
          Yes. Unsaved drafts are continuously cached in local browser storage:
        </p>
        <ul>
          <li>If you close the modal inadvertently or your browser tab reloads, opening the AI Assistant restores your prompt and active draft cards.</li>
          <li>Once you click <strong>Save All Tasks</strong>, the draft cache is cleared cleanly.</li>
        </ul>
      </>
    ),
  },

  // ── 3. Follow-ups & Escalations ───────────────────────────────────────────
  {
    id: 'follow-up-zap-logging',
    category: 'followups',
    q: 'What is the Follow-up (⚡ Zap) module and how do I log interactions?',
    answer: (
      <>
        <p>
          The Follow-up module provides an audit trail for tasks dependent on external stakeholders, vendors, or departmental approvals:
        </p>
        <ol>
          <li>Click the <code>⚡ Zap</code> button on any active task card to open its follow-up timeline.</li>
          <li>Select the communication channel: <strong>Phone Call</strong>, <strong>Email</strong>, <strong>WhatsApp</strong>, or <strong>In-Person Meeting</strong>.</li>
          <li>Enter the contact person's name and a summary of what was discussed.</li>
          <li>Set a <strong>Next Follow-up Date</strong> to track future check-ins.</li>
          <li>Save the entry to record the interaction on the immutable timeline.</li>
        </ol>
      </>
    ),
  },
  {
    id: 'automatic-escalation-policy',
    category: 'followups',
    q: 'How does the Automatic Escalation policy trigger and who is notified?',
    answer: (
      <>
        <p>
          To prevent pending tasks from stagnating, TasksManager provides threshold-based automated escalation:
        </p>
        <ul>
          <li>
            <strong>Threshold Trigger:</strong> Configure the threshold in <code>Settings → Escalation</code> (e.g. 3 follow-ups). Once a task logs that number of unsuccessful follow-ups without being marked Completed, an <strong>Escalated</strong> warning flag is activated.
          </li>
          <li>
            <strong>Configurable Recipients:</strong> Alerts are routed directly to designated email addresses for:
            <ul>
              <li>Reporting Manager</li>
              <li>Head of Department (HOD)</li>
              <li>Deputy Head of Department (DyHOD)</li>
              <li>Optional CC department addresses</li>
            </ul>
          </li>
          <li>
            <strong>Visual Warning:</strong> Escalated tasks display a prominent red border indicator and warning icon across the dashboard.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'editing-follow-up-history',
    category: 'followups',
    q: 'Can I edit or delete individual follow-up timeline entries?',
    answer: (
      <>
        <p>
          Yes. While chronological order is maintained:
        </p>
        <ul>
          <li>You can edit notes on any logged entry if details were mistyped.</li>
          <li>Erroneous logs can be deleted. The system maintains an internal audit mark ensuring timeline integrity is preserved.</li>
        </ul>
      </>
    ),
  },

  // ── 4. Reports & Exports ──────────────────────────────────────────────────
  {
    id: 'excel-export-formatting',
    category: 'reports',
    q: 'How do I export tasks to Microsoft Excel (.xlsx)?',
    answer: (
      <>
        <p>
          TasksManager exports structured spreadsheets configured for corporate reporting:
        </p>
        <ul>
          <li>Click the <strong>Export Excel</strong> option in the main toolbar or export dropdown.</li>
          <li>The generated <code>.xlsx</code> workbook contains:
            <ul>
              <li>Formatted table headers with column auto-fit</li>
              <li>Color-coded Priority (High, Medium, Low) and Status badges</li>
              <li>Full Descriptions, Reasons for delay, and Completion Remarks</li>
              <li>Follow-up counts and timestamped audit metadata</li>
            </ul>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'pdf-summary-exports',
    category: 'reports',
    q: 'How do I generate formal PDF summary reports?',
    answer: (
      <>
        <p>
          PDF exports are formatted for executive and departmental review:
        </p>
        <ul>
          <li>Select <strong>Export PDF</strong> from the export menu.</li>
          <li>The report generates a clean layout featuring:
            <ul>
              <li>Department header with report generation date</li>
              <li>Executive metrics breakdown (Total, Completed, Pending, In-Progress, Escalated)</li>
              <li>Tabular task register with priority indicators and notes</li>
            </ul>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'zero-tasks-warning',
    category: 'reports',
    q: 'Why does the system display a "Zero Tasks Found" notice on export?',
    answer: (
      <>
        <p>
          If your current date filter or search query returns 0 scheduled items, TasksManager warns you before generating an empty document. This prevents blank PDF and Excel files from being sent to managers. Simply select a date containing task records to proceed.
        </p>
      </>
    ),
  },

  // ── 5. Security & Auto-Lock ───────────────────────────────────────────────
  {
    id: 'master-security-password',
    category: 'security',
    q: 'How do I set up or modify the Master Security Password?',
    answer: (
      <>
        <p>
          The Master Password protects critical workspace configurations and security lock states:
        </p>
        <ol>
          <li>Navigate to <code>Settings → Security</code>.</li>
          <li>Enter your current password to authorize changes.</li>
          <li>Specify and confirm your new Master Password (minimum 6 characters recommended).</li>
          <li>Click <strong>Update Password</strong>. A confirmation modal will appear to prevent accidental changes.</li>
        </ol>
      </>
    ),
  },
  {
    id: 'inactivity-auto-lock',
    category: 'security',
    q: 'How does the Inactivity Auto-Lock feature operate?',
    answer: (
      <>
        <p>
          Auto-lock safeguards your task records when stepping away from your workstation:
        </p>
        <ul>
          <li>Go to <code>Settings → Security → Auto-Lock Inactivity Timeout</code>.</li>
          <li>Choose an inactivity threshold: <strong>5 minutes</strong>, <strong>15 minutes</strong>, <strong>30 minutes</strong>, <strong>1 hour</strong>, or <strong>Disabled</strong>.</li>
          <li>If no keyboard or pointer movement is registered within that duration, the screen blurs and locks automatically.</li>
          <li>Enter your Master Password to resume your active session.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'public-view-links',
    category: 'security',
    q: 'How do Public Share Links work and is my private data safe?',
    answer: (
      <>
        <p>
          Public links provide read-only views for external coordinators or client updates:
        </p>
        <ul>
          <li>Public links expose strictly read-only views of selected dates without edit controls.</li>
          <li>External viewers cannot alter statuses, edit follow-up notes, view Master Passwords, or access administrative settings.</li>
        </ul>
      </>
    ),
  },

  // ── 6. Settings & Interface ───────────────────────────────────────────────
  {
    id: 'interface-themes',
    category: 'settings-system',
    q: 'How do I toggle themes (Cyberpunk, Neo-Brutalist, Midnight Slate)?',
    answer: (
      <>
        <p>
          TasksManager provides three curated visual design systems:
        </p>
        <ul>
          <li><strong>Cyberpunk (Dark & Neon):</strong> Deep void background with high-contrast electric green and neon accents.</li>
          <li><strong>Neo-Brutalist (Clean White):</strong> Minimalist white surface with crisp solid borders and purple highlights.</li>
          <li><strong>Midnight Slate (Deep Blue):</strong> Oceanic navy slate with calm sky blue highlights and subtle borders.</li>
        </ul>
        <p>
          To change themes, visit <code>Settings → General → Interface Theme</code>, select your preferred theme preview, and click <strong>Save & Apply</strong>.
        </p>
      </>
    ),
  },
  {
    id: 'keyboard-shortcuts',
    category: 'settings-system',
    q: 'What keyboard shortcuts are available for power users?',
    answer: (
      <>
        <p>
          High-frequency shortcuts supported across TasksManager:
        </p>
        <ul>
          <li><code>/</code> or <code>Ctrl + K</code>: Instant focus on search input.</li>
          <li><code>Alt + N</code>: Open the New Task creation modal.</li>
          <li><code>Esc</code>: Dismiss active modals, drawers, or search inputs.</li>
          <li><code>Tab</code> / <code>Shift + Tab</code>: Accessible navigation across category filters and form fields.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'tablet-and-mobile-layout',
    category: 'settings-system',
    q: 'Is TasksManager optimized for touch devices and tablets?',
    answer: (
      <>
        <p>
          Yes. The application strictly follows the <code>MediaQueryPrompt.md</code> architecture:
        </p>
        <ul>
          <li><strong>Mobile & Tablet (&lt;1024px):</strong> Navigation tabs and categories convert into horizontal swipeable carousels with smooth edge fade masks and scroll chevrons.</li>
          <li><strong>Touch Target Sizing:</strong> All buttons and interactive triggers scale to a minimum of 44px on coarse pointer devices.</li>
          <li><strong>Desktop (&ge;1024px):</strong> Automatically organizes into a high-density two-column layout with sticky navigation.</li>
        </ul>
      </>
    ),
  },
];

export default function HelpPage() {
  const { filters, handleTaskCreated } = useTaskContext();
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'task-creation-workflow': true,
    'description-vs-reason-vs-remarks': true,
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Keyboard shortcut: '/' or 'Ctrl+K' focuses search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check scroll boundary on category list for touch devices
  const checkScroll = useCallback(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  }, []);

  useEffect(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, activeCategory]);

  const handleScrollNav = (direction: 'left' | 'right') => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const offset = direction === 'left' ? -160 : 160;
    el.scrollBy({ left: offset, behavior: 'smooth' });
  };

  // Filter FAQs based on active category and search query
  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return FAQS.filter(item => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return item.q.toLowerCase().includes(q) || (typeof item.answer === 'string' && item.answer.toLowerCase().includes(q));
    });
  }, [activeCategory, searchQuery]);

  // Compute counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: FAQS.length };
    for (const cat of CATEGORIES) {
      if (cat.id !== 'all') {
        counts[cat.id] = FAQS.filter(f => f.category === cat.id).length;
      }
    }
    return counts;
  }, []);

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const areAllExpanded = useMemo(() => {
    if (filteredFaqs.length === 0) return false;
    return filteredFaqs.every(item => !!openItems[item.id]);
  }, [filteredFaqs, openItems]);

  const handleToggleAll = () => {
    if (areAllExpanded) {
      const next: Record<string, boolean> = {};
      filteredFaqs.forEach(item => {
        next[item.id] = false;
      });
      setOpenItems(prev => ({ ...prev, ...next }));
    } else {
      const next: Record<string, boolean> = {};
      filteredFaqs.forEach(item => {
        next[item.id] = true;
      });
      setOpenItems(prev => ({ ...prev, ...next }));
    }
  };

  const handleSelectCategory = (catId: CategoryId) => {
    setActiveCategory(catId);
    // Smooth scroll the category into view on mobile
    const el = categoryScrollRef.current;
    if (el) {
      const btn = el.querySelector<HTMLElement>(`[data-category-id="${catId}"]`);
      if (btn) {
        btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  };

  const activeCategoryMeta = CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0];

  return (
    <div className="page-layout">
      <Header filters={filters} onTaskCreated={handleTaskCreated} />

      <main className="page-content" style={{ maxWidth: 1100 }}>
        <div className="help-layout">

          {/* ── Left Sticky Navigation / Mobile Scroll Bar ── */}
          <aside className="help-nav" aria-label="Knowledge Base Navigation">
            <div className="help-nav-header">
              <h1 className="help-nav-title">
                <BookOpen size={22} className="text-accent" />
                Knowledge Base
              </h1>
              <p className="help-nav-subtitle">
                Operational guides and technical workflows for TasksManager.
              </p>
            </div>

            {/* Category Filter Pills / List */}
            <div 
              className={`help-nav-scroll-wrap ${canScrollLeft ? 'has-overflow-left' : ''} ${canScrollRight ? 'has-overflow-right' : ''}`}
            >
              <div 
                ref={categoryScrollRef}
                className="help-category-list" 
                role="tablist"
              >
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  const count = categoryCounts[cat.id] || 0;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      data-category-id={cat.id}
                      onClick={() => handleSelectCategory(cat.id)}
                      className={`help-nav-btn ${isActive ? 'active' : ''}`}
                    >
                      <div className="help-nav-btn-content">
                        <Icon size={16} className="help-nav-btn-icon" />
                        <span>{cat.label}</span>
                      </div>
                      <span className="help-nav-badge">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desktop Sidebar Info Card */}
            <div className="help-sidebar-card">
              <h3 className="help-sidebar-card-title">Documentation v2.4</h3>
              <p className="help-sidebar-card-text">
                Current build incorporates multilingual Gemini parsing, threshold escalation routing, and enterprise data exports.
              </p>
              <a 
                href="mailto:support@tasksmanager.local" 
                className="help-sidebar-card-link"
              >
                <Mail size={13} />
                <span>Contact Engineering</span>
              </a>
            </div>
          </aside>

          {/* ── Right Content Area ── */}
          <section className="help-content" aria-label="Frequently Asked Questions">

            {/* Search Input Bar */}
            <div className="help-search-box">
              <Search size={16} className="help-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search topics, shortcuts, lifecycle rules..."
                className="help-search-input"
                aria-label="Search Documentation"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="help-search-clear"
                  title="Clear search"
                >
                  <X size={12} />
                  <span>Clear</span>
                </button>
              ) : (
                <div className="help-search-shortcut" title="Press / or Ctrl+K to search">
                  <span>/</span>
                </div>
              )}
            </div>

            {/* Active Category Header & Bulk Controls */}
            <div className="help-section-header">
              <div className="help-section-title-wrap">
                <h2 className="help-section-title">
                  {searchQuery ? `Search Results for "${searchQuery}"` : activeCategoryMeta.label}
                </h2>
                <span className="help-section-count">
                  ({filteredFaqs.length} {filteredFaqs.length === 1 ? 'article' : 'articles'})
                </span>
              </div>

              {filteredFaqs.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleAll}
                  className="help-expand-all-btn"
                >
                  {areAllExpanded ? 'Collapse All' : 'Expand All'}
                </button>
              )}
            </div>

            {/* Accordion List */}
            {filteredFaqs.length > 0 ? (
              <div className="help-faq-list" role="region" aria-label="FAQ Accordion">
                {filteredFaqs.map(faq => {
                  const isOpen = !!openItems[faq.id];

                  return (
                    <article 
                      key={faq.id} 
                      className={`help-item ${isOpen ? 'open' : ''}`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleItem(faq.id)}
                        className="help-item-trigger"
                        aria-expanded={isOpen}
                        aria-controls={`faq-answer-${faq.id}`}
                      >
                        <h3 className="help-item-q">{faq.q}</h3>
                        <ChevronDown 
                          size={18} 
                          className="help-item-chevron" 
                        />
                      </button>

                      {isOpen && (
                        <div 
                          id={`faq-answer-${faq.id}`}
                          className="help-item-body"
                        >
                          {faq.answer}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              /* Empty State */
              <div className="help-empty-state">
                <Search size={28} className="text-muted" />
                <h3 className="help-empty-title">No matching articles found</h3>
                <p className="help-empty-desc">
                  We could not find any topics matching &ldquo;{searchQuery}&rdquo;. Try using broader keywords or reset your filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                  }}
                  className="help-empty-reset-btn"
                >
                  Reset Search & Filters
                </button>
              </div>
            )}

            {/* Clean Professional Footer Banner */}
            <footer className="help-footer-card">
              <div className="help-footer-info">
                <h4 className="help-footer-title">Need additional technical assistance?</h4>
                <p className="help-footer-sub">
                  Our engineering team is available for escalation configuration and custom module inquiries.
                </p>
              </div>
              <div className="help-footer-actions">
                <a 
                  href="mailto:support@tasksmanager.local" 
                  className="help-footer-btn"
                >
                  <Mail size={13} />
                  <span>Email Support</span>
                </a>
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="help-footer-btn"
                >
                  <ExternalLink size={13} />
                  <span>GitHub Issues</span>
                </a>
              </div>
            </footer>

          </section>
        </div>
      </main>
    </div>
  );
}
