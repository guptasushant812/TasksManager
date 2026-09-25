'use client';
import { useState } from 'react';
import { TaskFilters } from '@/types/task';
import ManualTaskForm from './ManualTaskForm';
import AiInputForm from './AiInputForm';
import { PenLine, Sparkles, X, ArrowLeft } from 'lucide-react';

interface NewTaskModalProps {
  defaultFilters: TaskFilters;
  onClose: () => void;
  onSaved: () => void;
}

type Mode = null | 'manual' | 'ai';

export default function NewTaskModal({ defaultFilters, onClose, onSaved }: NewTaskModalProps) {
  const [mode, setMode] = useState<Mode>(null);

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box animate-slide-up" style={{ maxWidth: mode ? 700 : 500, padding: 0 }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', background: 'var(--bg-elevated)' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              {mode === null && 'Create New Task'}
              {mode === 'manual' && <><PenLine style={{ width: 16, height: 16 }} /> Manual Entry</>}
              {mode === 'ai' && <><Sparkles style={{ width: 16, height: 16, color: 'var(--accent)' }} /> AI Assisant</>}
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
                  border: '1px solid var(--border)', background: 'var(--bg-surface)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--text-muted)';
                  e.currentTarget.style.background = 'var(--bg-elevated)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'var(--bg-surface)';
                }}
              >
                <div style={{ background: 'var(--bg-elevated)', padding: 12, borderRadius: '50%', color: 'var(--text-primary)' }}>
                  <PenLine style={{ width: 24, height: 24 }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Standard Form</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
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
                  border: '1px solid var(--border)', background: 'var(--bg-surface)',
                  transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.background = 'var(--accent-subtle)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'var(--bg-surface)';
                }}
              >
                <div style={{ background: 'var(--accent-subtle)', padding: 12, borderRadius: '50%', color: 'var(--accent)' }}>
                  <Sparkles style={{ width: 24, height: 24 }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>AI Assistant</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
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
