'use client';
import { useState } from 'react';
import Header from '@/components/layout/Header';
import { useTaskContext } from '@/context/TaskContext';
import { Search, BookOpen, MessageSquare, AlertTriangle, Settings, ChevronDown, ChevronRight, LifeBuoy } from 'lucide-react';

const CATEGORIES = [
  { icon: BookOpen, title: 'Tasks', desc: 'Create, assign, and track tasks.' },
  { icon: MessageSquare, title: 'Follow-Ups', desc: 'Log and track communication updates.' },
  { icon: AlertTriangle, title: 'Escalations', desc: 'Understand automated alert thresholds.' },
  { icon: Settings, title: 'Settings', desc: 'Manage workspace preferences.' },
];

const FAQS = [
  {
    q: 'How does the "Structure with AI" feature work?',
    a: 'You can write your tasks in natural language (even mix Hindi/English). Just provide the details in sentences like: "I completed the server update. Assigned by Amit. Follow up with Rahul. High priority. Done today." The AI will automatically extract the Title, Description, Given By, Contact Person, Priority, Status, and Date for you!'
  },
  {
    q: 'Why are some fields like "Given By" or "Contact Person" empty after using AI?',
    a: 'The AI can only fill fields if you mention them in your sentence! To get them to auto-fill, make sure to say "Assigned by [Name]" and "Follow up with [Name]" in your AI input box.'
  },
  {
    q: 'How do I create a new task manually?',
    a: 'Click the "+ New Task" button in the top navigation bar. Fill in the title, priority, and other details, then save.'
  },
  {
    q: 'What happens when a task reaches the escalation threshold?',
    a: 'A high-priority warning banner appears on the task when enabled in Settings, highlighting it for immediate attention.'
  },
  {
    q: 'Can I export my tasks?',
    a: 'Yes. On the Tasks page, click the "Export" button in the toolbar and choose CSV or Excel format.'
  }
];

export default function HelpCenterPage() {
  const { filters, handleTaskCreated } = useTaskContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header filters={filters} onTaskCreated={handleTaskCreated} />

      <main style={{ flex: 1, overflowY: 'auto' }}>

        {/* Hero */}
        <section style={{
          padding: 'clamp(32px, 5vw, 48px) clamp(16px, 4vw, 32px) clamp(36px, 6vw, 56px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 8 }}>
            How can we help?
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28, maxWidth: 460, lineHeight: 1.5 }}>
            Search our knowledge base or browse the categories below.
          </p>

          <div style={{ position: 'relative', width: '100%', maxWidth: 480 }}>
            <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', width: 16, height: 16 }} />
            <input
              type="text"
              placeholder="Search for answers…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{
                paddingLeft: 40,
                fontSize: 14,
                borderRadius: 'var(--radius-lg)',
                height: 42,
              }}
            />
          </div>
        </section>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 clamp(12px, 3vw, 32px)' }}>

          {/* Categories */}
          <section style={{ marginTop: 32, marginBottom: 40 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
              {CATEGORIES.map((cat, i) => {
                const Icon = cat.icon;
                return (
                  <div key={i} className="card" style={{
                    padding: 20,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                    e.currentTarget.style.background = 'var(--bg-elevated)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.background = 'var(--bg-surface)';
                  }}
                  >
                    <div style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', padding: 8, borderRadius: 'var(--radius-md)', display: 'inline-flex', marginBottom: 12 }}>
                      <Icon style={{ width: 18, height: 18 }} />
                    </div>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{cat.title}</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>{cat.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* FAQ */}
          <section style={{ marginBottom: 64, marginTop: 40 }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, textAlign: 'center', letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 40 }}>Frequently asked questions</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 800, margin: '0 auto' }}>
              {FAQS.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={i} style={{
                    background: 'var(--bg-surface)',
                    border: '4px solid var(--border)',
                    boxShadow: '4px 4px 0px 0px var(--border)',
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                  }}>
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '20px 24px', background: 'var(--bg-surface)', border: 'none',
                        cursor: 'pointer', textAlign: 'left',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <span style={{ fontSize: 18, fontWeight: 800 }}>{faq.q}</span>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        border: '4px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isOpen ? 'var(--accent)' : 'var(--bg-surface)',
                        color: isOpen ? '#fff' : 'var(--text-primary)',
                        flexShrink: 0,
                        transition: 'background 0.2s'
                      }}>
                        {isOpen ? (
                          <span style={{ fontSize: 24, lineHeight: 1, fontWeight: 900, marginTop: -2 }}>-</span>
                        ) : (
                          <span style={{ fontSize: 24, lineHeight: 1, fontWeight: 900, marginTop: -2 }}>+</span>
                        )}
                      </div>
                    </button>

                    <div style={{
                      maxHeight: isOpen ? 500 : 0,
                      opacity: isOpen ? 1 : 0,
                      background: 'rgba(0,0,0,0.03)',
                      transition: 'all 0.3s ease-out',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        padding: '0px 24px 24px 24px',
                        color: 'var(--text-muted)',
                        fontSize: 16,
                        lineHeight: 1.6,
                        fontWeight: 600,
                      }}>
                        {faq.a}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Contact */}
          <section className="card" style={{
            padding: '28px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
            marginBottom: 40,
          }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>Need more help?</h2>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 13 }}>Our support team is available 24/7.</p>
            </div>
            <button className="btn btn-primary" style={{ fontSize: 13, padding: '8px 16px' }}>
              <LifeBuoy style={{ width: 14, height: 14 }} />
              Contact Support
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
