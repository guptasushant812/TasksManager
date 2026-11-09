'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useTaskContext } from '@/context/TaskContext';
import {
  Search,
  X,
  Calendar,
  CheckSquare,
  Sparkles,
  PhoneCall,
  Shield,
  ArrowRight,
  Lightbulb,
  FileSpreadsheet,
  Layers,
  HelpCircle,
  Keyboard,
  Clock,
  ExternalLink,
  Mail,
  Zap,
  Settings,
} from 'lucide-react';

interface HelpTopic {
  id: string;
  category: 'dashboard' | 'tasks' | 'ai' | 'followups' | 'reports';
  title: string;
  summary: string;
  steps: string[];
  tip: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  action: {
    label: string;
    href: string;
  };
  keywords: string[];
}

interface CategoryOption {
  id: 'all' | 'dashboard' | 'tasks' | 'ai' | 'followups' | 'reports';
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const CATEGORIES: CategoryOption[] = [
  { id: 'all', label: 'All Topics', icon: Layers },
  { id: 'dashboard', label: 'Dashboard & Time Scope', icon: Calendar },
  { id: 'tasks', label: 'Task Management', icon: CheckSquare },
  { id: 'ai', label: 'AI Quick-Add', icon: Sparkles },
  { id: 'followups', label: 'Follow-Ups & Escalations', icon: PhoneCall },
  { id: 'reports', label: 'Reports & Security', icon: Shield },
];

const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'cascading-calendar',
    category: 'dashboard',
    title: 'Cascading Calendar Navigation',
    summary: 'Drill down from Year to Month, 6-day Work Week (Monday to Saturday), or single days to focus your active deliverables.',
    steps: [
      'Choose a Year from the dropdown in the scope bar above your task table.',
      'Select any Month or Work Week tab to filter tasks to that operational cycle.',
      'Click a specific day date or choose "All Time" to view your complete backlog.',
    ],
    tip: 'Your active date scope synchronizes across the Dashboard, Tasks view, and Follow-Up workspace automatically.',
    icon: Calendar,
    action: {
      label: 'Open Dashboard',
      href: '/',
    },
    keywords: ['year', 'month', 'week', 'day', 'calendar', 'scope', 'dates', 'cascading', 'filter', 'all time'],
  },
  {
    id: 'metrics-and-filters',
    category: 'dashboard',
    title: 'Metrics & Attention Filters',
    summary: 'Monitor live counts across Total, In Progress, Pending, and Completed states with one-click attention cards.',
    steps: [
      'Check top summary counters for total volume and status distribution.',
      'Click the Overdue card to immediately isolate delayed follow-up touchpoints.',
      'Click the Escalated card to surface tasks requiring urgent managerial intervention.',
    ],
    tip: 'Click an active filter card a second time to clear it and restore your full period view.',
    icon: Zap,
    action: {
      label: 'View Metrics',
      href: '/',
    },
    keywords: ['summary', 'metrics', 'cards', 'counter', 'overdue', 'escalated', 'filters', 'attention'],
  },
  {
    id: 'creating-tasks',
    category: 'tasks',
    title: 'Creating Tasks & Checklists',
    summary: 'Add deliverables with target departments, contact persons, priority levels, and actionable subtask checklists.',
    steps: [
      'Click "+ New Task" in the top navigation bar to open the creation dialog.',
      'Enter the Title, Task Date, optional Due Date, and set Priority to High, Medium, or Low.',
      'Add checklist subtasks to break down complex multi-step jobs into checkable items.',
    ],
    tip: 'You can draft and save multiple tasks in a single modal session without closing the dialog.',
    icon: CheckSquare,
    action: {
      label: 'Create Tasks',
      href: '/tasks',
    },
    keywords: ['new task', 'create', 'priority', 'high', 'medium', 'low', 'department', 'given by', 'contact', 'subtasks', 'checklist'],
  },
  {
    id: 'status-and-notes',
    category: 'tasks',
    title: 'Status Sync & Reason Notes',
    summary: 'Transition tasks between Pending, In Progress, and Completed states while preserving context notes for each stage.',
    steps: [
      'Toggle a task status directly in the table or inside the task details dialog.',
      'Document obstacles under "Reason (Pending)" or active progress under "Reason (InProgress)".',
      'Finalize completed deliverables by recording sign-off notes under "Remarks (Completed)".',
    ],
    tip: 'Notes written for each status are preserved across switches so historical handover context is never lost.',
    icon: Clock,
    action: {
      label: 'Manage Tasks',
      href: '/tasks',
    },
    keywords: ['status', 'pending', 'inprogress', 'completed', 'reason', 'remarks', 'audit', 'notes', 'blockers'],
  },
  {
    id: 'ai-multilingual-parsing',
    category: 'ai',
    title: 'Voice & Multilingual AI Parsing',
    summary: 'Convert informal voice dictation or freeform notes into structured task records with intelligent field detection.',
    steps: [
      'Open "+ New Task" in the header and switch to the "AI Assistant" tab.',
      'Type or speak natural language notes in English, Hindi, Marathi, or Hinglish.',
      'Click "Extract Tasks" to auto-populate titles, dates, departments, and priority levels.',
    ],
    tip: 'Spoken dialect notes (e.g. mixed Hinglish or Marathi) are parsed and converted into clean, professional task drafts.',
    icon: Sparkles,
    action: {
      label: 'Try AI Assistant',
      href: '/tasks',
    },
    keywords: ['ai', 'voice', 'speech', 'marathi', 'hindi', 'hinglish', 'prompt', 'extract', 'dictate', 'natural language'],
  },
  {
    id: 'ai-draft-refinement',
    category: 'ai',
    title: 'Reviewing & Refining Drafts',
    summary: 'Inspect, edit, or regenerate individual AI task drafts before committing them to your live workbench.',
    steps: [
      'Review the extracted draft cards to verify deadlines, departments, and subtasks.',
      'Click "Improve This Task" on any draft card to provide targeted revision instructions.',
      'Click "Save All Tasks" to commit all approved drafts to your task register.',
    ],
    tip: 'Unsaved draft text and cards stay intact even if your browser tab is closed or reloaded.',
    icon: Sparkles,
    action: {
      label: 'Open Task Workspace',
      href: '/tasks',
    },
    keywords: ['ai draft', 'improve', 'regenerate', 'draft card', 'refine', 'autosave', 'save all'],
  },
  {
    id: 'logging-followups',
    category: 'followups',
    title: 'Logging Communications & Proofs',
    summary: 'Record phone calls, WhatsApp messages, emails, and meetings with next action dates and verification proofs.',
    steps: [
      'Click "⚡ Zap" on any task row or open the dedicated Follow-Up Workspace.',
      'Select the interaction channel: Phone Call, WhatsApp, Email, In-Person Meeting, or Internal Note.',
      'Record the contact name, conversation outcome, next follow-up date, and attach proofs.',
    ],
    tip: 'Upcoming follow-up dates appear color-coded in your timeline so scheduled callbacks are never missed.',
    icon: PhoneCall,
    action: {
      label: 'Open Follow-Ups',
      href: '/follow-ups',
    },
    keywords: ['followups', 'zap', 'calls', 'whatsapp', 'email', 'meetings', 'proofs', 'attachments', 'timeline', 'next date'],
  },
  {
    id: 'managerial-escalations',
    category: 'followups',
    title: 'Managerial Escalation Alerts',
    summary: 'Automated warnings flag stalled items and notify department heads when communication limits are reached.',
    steps: [
      'Set touchpoint thresholds in "Settings → Escalation" (e.g. notify after 3 follow-ups).',
      'When follow-up attempts hit this limit, an "Escalated" warning badge triggers automatically.',
      'Automated email notifications alert managers and department heads to resolve blockers.',
    ],
    tip: 'The Notification Bell in the top header displays a live counter whenever items enter escalated status.',
    icon: Zap,
    action: {
      label: 'Configure Escalation',
      href: '/settings?tab=escalation',
    },
    keywords: ['escalation', 'threshold', 'hod', 'dyhod', 'manager', 'alerts', 'notifications', 'email', 'touchpoints'],
  },
  {
    id: 'exports-and-registers',
    category: 'reports',
    title: 'Exporting Registers & Archives',
    summary: 'Generate formatted spreadsheets, printable registers, and media archives directly from your active scope.',
    steps: [
      'Filter your workspace by the desired operational period, department, or status.',
      'Click "Export" in the header and choose Excel (.xlsx), PDF Register, or ZIP bundle.',
      'Download color-coded registers featuring complete task descriptions and reason history.',
    ],
    tip: 'ZIP exports bundle your task register alongside all uploaded proof documents and images.',
    icon: FileSpreadsheet,
    action: {
      label: 'Export Records',
      href: '/tasks',
    },
    keywords: ['export', 'excel', 'xlsx', 'pdf', 'register', 'zip', 'archive', 'download', 'report'],
  },
  {
    id: 'sharing-and-security',
    category: 'reports',
    title: 'Public Status Links & Auto-Lock',
    summary: 'Share read-only project dashboards with stakeholders and protect your workspace with inactivity timeouts.',
    steps: [
      'Click "Share" in the header or visit Settings to generate a secure read-only portal link.',
      'Share the link with external clients or managers to view progress without login accounts.',
      'Configure a master passcode and set the auto-lock timer (5 to 60 minutes) in "Settings → Security".',
    ],
    tip: 'Lock your workstation immediately at any time by clicking your user profile avatar in the header.',
    icon: Shield,
    action: {
      label: 'Security Settings',
      href: '/settings?tab=security',
    },
    keywords: ['share', 'public link', 'status portal', 'token', 'security', 'master password', 'pin', 'lock', 'timeout', 'auto-lock'],
  },
];

const WORKFLOW_STEPS = [
  {
    step: '1',
    title: 'Set Period',
    desc: 'Select Year, Month, 6-day Work Week, or Day on the scope bar.',
  },
  {
    step: '2',
    title: 'Capture Tasks',
    desc: 'Add deliverables manually or dictate via Multilingual AI.',
  },
  {
    step: '3',
    title: 'Track & Follow Up',
    desc: 'Check off subtasks, update status reasons, and log call proofs.',
  },
  {
    step: '4',
    title: 'Report & Share',
    desc: 'Download Excel/PDF registers or generate read-only public links.',
  },
];

const KEYBOARD_SHORTCUTS = [
  { key: '/', desc: 'Jump to search bar' },
  { key: 'Esc', desc: 'Clear search or dismiss dialog' },
  { key: '+ New Task', desc: 'Open task creation modal' },
  { key: 'Space', desc: 'Check or uncheck subtask item' },
];

export default function HelpPage() {
  const { filters, handleTaskCreated } = useTaskContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryOption['id']>('all');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchQueryRef = useRef(searchQuery);
  searchQueryRef.current = searchQuery;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      const isInput = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

      if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (searchQueryRef.current) {
          setSearchQuery('');
        } else {
          setActiveCategory('all');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredTopics = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return HELP_TOPICS.filter((topic) => {
      const matchesCategory = activeCategory === 'all' || topic.category === activeCategory;
      if (!matchesCategory) return false;

      if (!q) return true;

      const inTitle = topic.title.toLowerCase().includes(q);
      const inSummary = topic.summary.toLowerCase().includes(q);
      const inKeywords = topic.keywords.some((k) => k.toLowerCase().includes(q));
      const inSteps = topic.steps.some((s) => s.toLowerCase().includes(q));
      const inTip = topic.tip.toLowerCase().includes(q);

      return inTitle || inSummary || inKeywords || inSteps || inTip;
    });
  }, [activeCategory, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: HELP_TOPICS.length };
    for (const topic of HELP_TOPICS) {
      counts[topic.category] = (counts[topic.category] || 0) + 1;
    }
    return counts;
  }, []);

  return (
    <div className="page-layout">
      <Header filters={filters} onTaskCreated={handleTaskCreated} />

      <main className="page-content">
        <div className="help-hub-wrap">
          <header className="help-hero">
            <div className="help-hero-badge">
              <HelpCircle size={13} />
              <span>User Documentation &amp; Guide</span>
            </div>
            <h1 className="help-hero-title">How to use TasksManager</h1>
            <p className="help-hero-subtitle">
              Clear, step-by-step guidance for time navigation, task workflows, multilingual AI quick-add, follow-ups, and reports.
            </p>

            <div className="help-search-box">
              <Search size={16} className="help-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search features (e.g. AI quick-add, follow-up, excel, status reasons...)"
                className="help-search-input"
                aria-label="Search help topics"
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
                <span className="help-search-shortcut" title="Press / to search">
                  /
                </span>
              )}
            </div>
          </header>

          <section className="help-workflow-section" aria-label="Quick Start Workflow">
            <div className="help-workflow-header">
              <span className="help-section-eyebrow">Quick-Start Overview</span>
              <h2 className="help-workflow-title">The TasksManager Daily Workflow</h2>
            </div>
            <div className="help-workflow-grid">
              {WORKFLOW_STEPS.map((item) => (
                <div key={item.step} className="help-workflow-card">
                  <div className="help-workflow-step-badge">{item.step}</div>
                  <div className="help-workflow-card-body">
                    <h3 className="help-workflow-card-title">{item.title}</h3>
                    <p className="help-workflow-card-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="help-topics-section" aria-label="Browse Topics">
            <div className="help-category-bar">
              <div className="help-category-pills" role="tablist">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  const count = categoryCounts[cat.id] || 0;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`help-category-pill ${isActive ? 'active' : ''}`}
                    >
                      <Icon size={14} />
                      <span>{cat.label}</span>
                      <span className="help-category-pill-count">{count}</span>
                    </button>
                  );
                })}
              </div>

              {searchQuery && (
                <div className="help-search-results-label">
                  Showing {filteredTopics.length} result{filteredTopics.length === 1 ? '' : 's'} for &ldquo;{searchQuery}&rdquo;
                </div>
              )}
            </div>

            {filteredTopics.length > 0 ? (
              <div className="help-cards-grid">
                {filteredTopics.map((topic) => {
                  const TopicIcon = topic.icon;
                  const categoryMeta = CATEGORIES.find((c) => c.id === topic.category);

                  return (
                    <article key={topic.id} className="help-guide-card">
                      <div className="help-guide-header">
                        <div className="help-guide-title-row">
                          <div className="help-guide-icon-box">
                            <TopicIcon size={16} />
                          </div>
                          <span className="help-guide-category-badge">
                            {categoryMeta?.label.split(' ')[0] || 'Guide'}
                          </span>
                        </div>
                        <h3 className="help-guide-title">{topic.title}</h3>
                        <p className="help-guide-summary">{topic.summary}</p>
                      </div>

                      <div className="help-guide-steps-wrap">
                        <span className="help-guide-steps-heading">How to use it:</span>
                        <ol className="help-guide-steps-list">
                          {topic.steps.map((step, idx) => (
                            <li key={idx} className="help-guide-step-item">
                              <span className="help-guide-step-number">{idx + 1}</span>
                              <span className="help-guide-step-text">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div className="help-guide-tip-box">
                        <Lightbulb size={14} className="help-guide-tip-icon" />
                        <span className="help-guide-tip-text">
                          <strong>Pro Tip:</strong> {topic.tip}
                        </span>
                      </div>

                      <div className="help-guide-footer">
                        <Link href={topic.action.href} className="help-guide-action-link">
                          <span>{topic.action.label}</span>
                          <ArrowRight size={13} />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="help-empty-state">
                <Search size={26} className="help-empty-icon" />
                <h3 className="help-empty-title">No matching guides found</h3>
                <p className="help-empty-desc">
                  No topics matched &ldquo;{searchQuery}&rdquo;. Try another term or reset your search.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                  }}
                  className="help-empty-reset-btn"
                >
                  Reset Search &amp; Filters
                </button>
              </div>
            )}
          </section>

          <section className="help-utilities-grid" aria-label="Reference and Support">
            <div className="help-utility-card">
              <div className="help-utility-header">
                <Keyboard size={16} className="help-utility-icon" />
                <h3 className="help-utility-title">Keyboard Shortcuts</h3>
              </div>
              <p className="help-utility-desc">
                Quick actions to accelerate your daily workflow across the workbench.
              </p>
              <div className="help-shortcuts-list">
                {KEYBOARD_SHORTCUTS.map((item) => (
                  <div key={item.key} className="help-shortcut-row">
                    <kbd className="help-shortcut-key">{item.key}</kbd>
                    <span className="help-shortcut-desc">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="help-utility-card">
              <div className="help-utility-header">
                <Shield size={16} className="help-utility-icon" />
                <h3 className="help-utility-title">Security &amp; Privacy</h3>
              </div>
              <p className="help-utility-desc">
                Your workspace credentials, master passcode, and data exports remain securely under your control.
              </p>
              <div className="help-security-points">
                <div className="help-security-item">
                  <span className="help-security-bullet" />
                  <span>Public links provide strictly read-only visibility without write permissions.</span>
                </div>
                <div className="help-security-item">
                  <span className="help-security-bullet" />
                  <span>Auto-lock protects unattended workstations after inactive intervals.</span>
                </div>
                <div className="help-security-item">
                  <span className="help-security-bullet" />
                  <span>Session access can be engaged instantly via your user profile avatar.</span>
                </div>
              </div>
            </div>
          </section>

          <footer className="help-support-footer">
            <div className="help-support-text">
              <h3 className="help-support-title">Need additional guidance?</h3>
              <p className="help-support-desc">
                Have questions regarding team escalation thresholds, report formats, or workflow setup?
              </p>
            </div>
            <div className="help-support-actions">
              <a
                href="mailto:support@tasksmanager.local"
                className="help-support-btn"
              >
                <Mail size={14} />
                <span>Email Support</span>
              </a>
              <Link href="/settings" className="help-support-btn">
                <Settings size={14} />
                <span>Workbench Settings</span>
              </Link>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
