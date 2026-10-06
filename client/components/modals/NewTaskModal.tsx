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
      <div 
        className="modal-box new-task-modal-box animate-slide-up" 
        style={{ 
          maxWidth: mode ? 820 : 540, 
        }}
      >

        {/* Header */}
        <div className="new-task-modal-header">
          <div>
            <h2 className="new-task-modal-title">
              {mode === null && 'Create New Task'}
              {mode === 'manual' && <><PenLine style={{ width: 16, height: 16 }} /> Manual Entry</>}
              {mode === 'ai' && <><Sparkles style={{ width: 16, height: 16, color: 'var(--accent)' }} /> AI Assistant</>}
            </h2>
            {mode === null && (
              <p className="new-task-modal-subtitle">
                How do you want to create this task?
              </p>
            )}
            {mode !== null && (
              <button
                type="button"
                onClick={() => setMode(null)}
                className="new-task-back-btn"
              >
                <ArrowLeft style={{ width: 13, height: 13 }} />
                <span>Back to selection</span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="new-task-close-btn"
            aria-label="Close modal"
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Content Area */}
        <div 
          style={{ 
            flex: 1, 
            minHeight: 0, 
            display: 'flex', 
            flexDirection: 'column', 
            overflow: mode ? 'hidden' : 'auto', 
          }}
        >

          {/* Mode selection */}
          {mode === null && (
            <div className="new-task-selection-wrapper animate-fade-in">
              <div className="new-task-selection-grid">
                {/* Manual */}
                <button
                  type="button"
                  onClick={() => setMode('manual')}
                  className="new-task-card new-task-card-manual"
                >
                  <div className="new-task-card-icon-wrap manual">
                    <PenLine className="new-task-card-icon" />
                  </div>
                  <div className="new-task-card-content">
                    <div className="new-task-card-top">
                      <span className="new-task-card-title">Manual Form</span>
                      <span className="new-task-card-chip manual">Standard</span>
                    </div>
                    <p className="new-task-card-desc">
                      Fill in task details yourself with full field controls.
                    </p>
                  </div>
                </button>

                {/* AI */}
                <button
                  type="button"
                  onClick={() => setMode('ai')}
                  className="new-task-card new-task-card-ai"
                >
                  <div className="new-task-card-icon-wrap ai">
                    <Sparkles className="new-task-card-icon" />
                  </div>
                  <div className="new-task-card-content">
                    <div className="new-task-card-top">
                      <span className="new-task-card-title">AI Assistant</span>
                      {hasAiDraft ? (
                        <span className="new-task-card-chip ai-saved">
                          <Sparkles className="new-task-chip-sparkle" />
                          {draftCount ? `${draftCount} Draft${draftCount !== 1 ? 's' : ''}` : 'Draft Saved'}
                        </span>
                      ) : (
                        <span className="new-task-card-chip ai">Smart</span>
                      )}
                    </div>
                    <p className="new-task-card-desc">
                      Type notes in plain language. AI organizes the fields.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Forms */}
          {mode === 'manual' && (
            <div className="animate-fade-in" style={{ height: '100%', minHeight: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <ManualTaskForm defaultFilters={defaultFilters} onSaved={onSaved} onCancel={() => setMode(null)} />
            </div>
          )}

          {mode === 'ai' && (
            <div className="animate-fade-in" style={{ height: '100%', minHeight: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <AiInputForm onSaved={onSaved} onCancel={() => setMode(null)} onSwitchToManual={() => setMode('manual')} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
