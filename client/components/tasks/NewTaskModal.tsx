'use client';
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { TaskFilters } from '@/types/task';
import ManualTaskForm from './ManualTaskForm';
import AiInputForm from './AiInputForm';
import { PenLine, Sparkles, X, ArrowLeft, AlertTriangle } from 'lucide-react';
import { fetchAiDraftState } from '@/lib/aiDraftService';

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
  const [mounted, setMounted] = useState(false);
  const [isManualDirty, setIsManualDirty] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<'close' | 'back' | null>(null);

  const handleCloseModal = useCallback(() => {
    if (mode === 'manual' && isManualDirty) {
      setPendingAction('close');
      setShowDiscardConfirm(true);
      return;
    }
    onClose();
  }, [mode, isManualDirty, onClose]);

  const handleBackToSelection = useCallback(() => {
    if (mode === 'manual' && isManualDirty) {
      setPendingAction('back');
      setShowDiscardConfirm(true);
      return;
    }
    setMode(null);
  }, [mode, isManualDirty]);

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDiscardConfirm) {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleCloseModal, showDiscardConfirm]);

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false);
    const action = pendingAction;
    setPendingAction(null);
    setIsManualDirty(false);
    if (action === 'close') {
      onClose();
    } else {
      setMode(null);
    }
  };

  useEffect(() => {
    try {
      localStorage.removeItem('tasksmanager_ai_draft_state_v1');
    } catch {}

    fetchAiDraftState().then((res) => {
      const serverDraft = res?.draft;
      if (serverDraft && (serverDraft.rawText?.trim() || (Array.isArray(serverDraft.drafts) && serverDraft.drafts.length > 0))) {
        if (Array.isArray(serverDraft.drafts) && serverDraft.drafts.length > 0) {
          setHasAiDraft(true);
          setDraftCount(serverDraft.drafts.length);
        } else {
          setHasAiDraft(true);
          setDraftCount(null);
        }
      } else {
        setHasAiDraft(false);
        setDraftCount(null);
      }
    });
  }, [mode]);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div className="modal-overlay">
      <div 
        className="modal-box new-task-modal-box animate-slide-up" 
        style={{ 
          width: '100%',
          maxWidth: mode ? 820 : 540, 
          margin: 'auto 0',
          marginInline: 0,
        }}
      >

        <div className="new-task-modal-header">
          {mode === null ? (
            <div>
              <h2 className="new-task-modal-title">Create New Task</h2>
              <p className="new-task-modal-subtitle">
                How do you want to create this task?
              </p>
            </div>
          ) : (
            <div className="new-task-modal-header-inline">
              <button
                type="button"
                onClick={handleBackToSelection}
                className="new-task-back-btn"
                title="Back to selection"
                aria-label="Back to selection"
              >
                <ArrowLeft style={{ width: 14, height: 14 }} />
                <span>Back</span>
              </button>
              <div className="new-task-modal-header-divider" />
              <h2 className="new-task-modal-title">
                {mode === 'manual' && <><PenLine style={{ width: 16, height: 16 }} /> Manual Entry</>}
                {mode === 'ai' && <><Sparkles style={{ width: 16, height: 16, color: 'var(--accent)' }} /> AI Assistant</>}
              </h2>
            </div>
          )}

          <button
            onClick={handleCloseModal}
            className="new-task-close-btn"
            title="Close modal"
            aria-label="Close modal"
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div 
          style={{ 
            flex: 1, 
            minHeight: 0, 
            display: 'flex', 
            flexDirection: 'column', 
            overflow: mode ? 'hidden' : 'auto', 
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >

          {mode === null && (
            <div className="new-task-selection-wrapper animate-fade-in">
              <div className="new-task-selection-grid">
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

          {mode === 'manual' && (
            <div className="animate-fade-in" style={{ height: '100%', minHeight: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
              <ManualTaskForm
                defaultFilters={defaultFilters}
                onSaved={onSaved}
                onCancel={handleBackToSelection}
                onDirtyChange={setIsManualDirty}
              />
            </div>
          )}

          {mode === 'ai' && (
            <div className="animate-fade-in" style={{ height: '100%', minHeight: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
              <AiInputForm
                onSaved={onSaved}
                onCancel={onClose}
                onSwitchToManual={() => setMode('manual')}
              />
            </div>
          )}
        </div>
      </div>

      {showDiscardConfirm && (
        <div
          className="app-dialog-overlay"
          style={{ zIndex: 1200 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="app-dialog-box animate-slide-up"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="new-task-discard-title"
            aria-describedby="new-task-discard-desc"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 420 }}
          >
            <div className="app-dialog-accent-bar app-dialog-accent-danger" />

            <div className="app-dialog-header">
              <div className="app-dialog-header-left">
                <div className="app-dialog-icon-wrap app-dialog-icon-danger">
                  <AlertTriangle style={{ width: 22, height: 22 }} />
                </div>
                <div>
                  <div className="app-dialog-eyebrow app-dialog-eyebrow-danger">
                    Warning
                  </div>
                  <h3 id="new-task-discard-title" className="app-dialog-title">
                    Discard unsaved changes?
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDiscardConfirm(false);
                  setPendingAction(null);
                }}
                className="app-dialog-close-btn"
                aria-label="Close"
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="app-dialog-body">
              <p id="new-task-discard-desc" className="app-dialog-desc" style={{ marginBottom: 0 }}>
                You have unsaved changes. Are you sure you want to close without saving?
              </p>
            </div>

            <div className="app-dialog-footer">
              <button
                type="button"
                className="app-dialog-btn-cancel"
                onClick={() => {
                  setShowDiscardConfirm(false);
                  setPendingAction(null);
                }}
              >
                Keep Editing
              </button>
              <button
                type="button"
                className="app-dialog-btn-action app-dialog-btn-danger"
                onClick={handleConfirmDiscard}
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
