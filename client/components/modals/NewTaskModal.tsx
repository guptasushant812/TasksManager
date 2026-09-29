'use client';
import { useState, useEffect } from 'react';
import { TaskFilters } from '@/types/task';
import ManualTaskForm from './ManualTaskForm';
import AiInputForm from './AiInputForm';
import { PenLine, Sparkles, X, ArrowLeft } from 'lucide-react';

const STORAGE_KEY = 'tasksmanager_ai_draft_state_v1';

interface NewTaskModalProps {
  defaultFilters: TaskFilters;
  onClose: () => void;
  onSaved: () => void;
}

type Mode = null | 'manual' | 'ai';

export default function NewTaskModal({ defaultFilters, onClose, onSaved }: NewTaskModalProps) {
  const [mode, setMode] = useState<Mode>(null);
  const [hasAiDraft, setHasAiDraft] = useState(false);
  const [draftCount, setDraftCount] = useState<number | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed) {
          if (Array.isArray(parsed.drafts) && parsed.drafts.length > 0) {
            setHasAiDraft(true);
            setDraftCount(parsed.drafts.length);
          } else if (typeof parsed.rawText === 'string' && parsed.rawText.trim().length > 0) {
            setHasAiDraft(true);
            setDraftCount(null);
          } else {
            setHasAiDraft(false);
            setDraftCount(null);
          }
        }
      } else {
        setHasAiDraft(false);
        setDraftCount(null);
      }
    } catch {
      setHasAiDraft(false);
      setDraftCount(null);
    }
  }, [mode]);

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box animate-slide-up" style={{ maxWidth: mode ? 700 : 500, padding: 0 }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: 'var(--border-width-layout) solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', background: 'var(--bg-elevated)' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              {mode === null && 'Create New Task'}
              {mode === 'manual' && <><PenLine style={{ width: 16, height: 16 }} /> Manual Entry</>}
              {mode === 'ai' && <><Sparkles style={{ width: 16, height: 16, color: 'var(--accent)' }} /> AI Assistant</>}
            </h2>
            {mode === null && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                How do you want to create this task?
              </p>
            )}
            {mode !== null && (
              <button
                onClick={() => setMode(null)}
                style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4, transition: 'color 0.1s' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                <ArrowLeft style={{ width: 12, height: 12 }} /> Back to selection
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', display: 'flex', padding: 4
            }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Content Area */}
        <div style={{ padding: '24px', maxHeight: 'calc(85vh - 70px)', overflowY: 'auto' }}>
          
          {/* Mode selection */}
          {mode === null && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="animate-fade-in">
              {/* Manual */}
              <button
                onClick={() => setMode('manual')}
                className="card"
                style={{
                  padding: '32px 24px', cursor: 'pointer', textAlign: 'center',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
                  border: 'var(--border-width-layout) solid var(--border)', background: 'var(--bg-surface)',
                  boxShadow: 'var(--box-shadow-brutalist)',
                  transition: 'all 0.1s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-hover)';
                  e.currentTarget.style.transform = 'translate(-2px, -2px)';
                  e.currentTarget.style.boxShadow = '6px 6px 0px 0px var(--border)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-surface)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'var(--box-shadow-brutalist)';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translate(4px, 4px)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translate(-2px, -2px)';
                  e.currentTarget.style.boxShadow = '6px 6px 0px 0px var(--border)';
                }}
              >
                <div style={{ background: 'var(--text-primary)', padding: 12, borderRadius: 0, border: 'var(--border-width-layout) solid var(--border)', color: 'var(--bg-base)' }}>
                  <PenLine style={{ width: 32, height: 32 }} />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8, textTransform: 'uppercase' }}>Standard Form</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Fill out all fields manually with complete control.
                  </div>
                </div>
              </button>

              {/* AI */}
              <button
                onClick={() => setMode('ai')}
                className="card"
                style={{
                  padding: '32px 24px', cursor: 'pointer', textAlign: 'center',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
                  border: '4px solid var(--accent)', background: 'var(--bg-surface)',
                  boxShadow: '4px 4px 0px 0px var(--accent)',
                  transition: 'all 0.1s ease', position: 'relative', overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent-subtle)';
                  e.currentTarget.style.transform = 'translate(-2px, -2px)';
                  e.currentTarget.style.boxShadow = '6px 6px 0px 0px var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-surface)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '4px 4px 0px 0px var(--accent)';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translate(4px, 4px)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translate(-2px, -2px)';
                  e.currentTarget.style.boxShadow = '6px 6px 0px 0px var(--accent)';
                }}
              >
                {hasAiDraft && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: 'var(--accent)', color: '#fff',
                    fontSize: 10, fontWeight: 800, padding: '3px 8px',
                    borderRadius: 9999, textTransform: 'uppercase', letterSpacing: '0.05em',
                    display: 'flex', alignItems: 'center', gap: 4,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    <Sparkles style={{ width: 10, height: 10 }} />
                    {draftCount ? `${draftCount} Draft${draftCount !== 1 ? 's' : ''}` : 'Draft Saved'}
                  </div>
                )}
                <div style={{ background: 'var(--accent)', padding: 12, borderRadius: 0, border: 'var(--border-width-layout) solid var(--border)', color: '#fff' }}>
                  <Sparkles style={{ width: 32, height: 32 }} />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8, textTransform: 'uppercase' }}>AI Assistant</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Write in plain English. We'll extract the details for you.
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Forms */}
          {mode === 'manual' && (
            <div className="animate-fade-in">
              <ManualTaskForm defaultFilters={defaultFilters} onSaved={onSaved} onCancel={() => setMode(null)} />
            </div>
          )}

          {mode === 'ai' && (
            <div className="animate-fade-in">
              <AiInputForm onSaved={onSaved} onCancel={() => setMode(null)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
