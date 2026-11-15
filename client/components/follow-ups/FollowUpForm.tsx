'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FollowUp, FollowUpFormData, FollowUpMethod, FOLLOW_UP_METHODS } from '@/types/followUp';
import { toIsoDate } from '@/lib/dates';
import { X, Paperclip, ChevronDown, ChevronUp, Save, Edit3, Volume2, Video } from 'lucide-react';
import AutoResizeTextarea from '@/components/ui/AutoResizeTextarea';

interface FollowUpFormProps {
  defaultContactPerson: string;
  editingFollowUp?: FollowUp | null;
  onSave: (data: FollowUpFormData, files: File[], removedAttachmentIds: string[]) => Promise<void>;
  onCancel: () => void;
}

function nowDateTimeLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function FollowUpForm({ defaultContactPerson, editingFollowUp, onSave, onCancel }: FollowUpFormProps) {
  const isEditing = !!editingFollowUp;

  const [data, setData] = useState<FollowUpFormData>({
    followUpDate: editingFollowUp
      ? new Date(editingFollowUp.followUpDate).toISOString().slice(0, 16)
      : nowDateTimeLocal(),
    method: editingFollowUp?.method || 'Phone',
    methodOther: editingFollowUp?.methodOther || '',
    contactPerson: editingFollowUp?.contactPerson || defaultContactPerson || '',
    communicated: editingFollowUp?.communicated || '',
    responseReceived: editingFollowUp?.responseReceived || '',
    notes: editingFollowUp?.notes || '',
    nextAction: editingFollowUp?.nextAction || '',
    nextFollowUpDate: editingFollowUp?.nextFollowUpDate
      ? toIsoDate(editingFollowUp.nextFollowUpDate)
      : '',
  });

  const [showMore, setShowMore] = useState(
    isEditing && (!!data.notes || !!data.nextAction || !!data.nextFollowUpDate)
  );
  const [existingAttachments, setExistingAttachments] = useState(editingFollowUp?.attachments || []);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and close on Escape
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel]);

  // Resync state when editing target changes
  useEffect(() => {
    setExistingAttachments(editingFollowUp?.attachments || []);
    setRemovedAttachmentIds([]);
  }, [editingFollowUp]);

  function handleChange(field: keyof FollowUpFormData, value: string) {
    setData((d) => ({ ...d, [field]: value }));
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (existingAttachments.length + files.length + newFiles.length > 5) {
        setErrors((errs) => ({ ...errs, files: 'Maximum 5 files allowed' }));
        return;
      }
      setFiles((prev) => [...prev, ...newFiles]);
      if (errors.files) setErrors((errs) => { const n = { ...errs }; delete n.files; return n; });
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function removeExistingFile(index: number) {
    const attToRemove = existingAttachments[index];
    setRemovedAttachmentIds(prev => [...prev, attToRemove._id]);
    setExistingAttachments(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    const errs: Record<string, string> = {};
    if (!data.communicated.trim()) errs.communicated = 'Communication notes are required';
    if (!data.followUpDate) errs.followUpDate = 'Date & time is required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      await onSave(data, files, removedAttachmentIds);
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  }

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="modal-overlay fu-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="fu-modal-title"
    >
      <div className="modal-box fu-modal-box animate-slide-up">
        <div className="fu-modal-header">
          <div id="fu-modal-title" className="fu-modal-title">
            {isEditing ? `Edit Follow-Up #${editingFollowUp.followUpNumber}` : 'New Follow-Up'}
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="fu-modal-close-btn"
            aria-label="Close modal"
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div className="fu-modal-body">
          <div className="fu-modal-grid">
            <div className="fu-field-group">
              <label className="label" htmlFor="fu-date">Date & Time</label>
              <input
                id="fu-date"
                className="input fu-input"
                type="datetime-local"
                value={data.followUpDate}
                onChange={(e) => handleChange('followUpDate', e.target.value)}
                onClick={(e) => 'showPicker' in e.currentTarget && (e.currentTarget as any).showPicker()}
                style={{ borderColor: errors.followUpDate ? 'var(--high)' : undefined }}
              />
              {errors.followUpDate && <span className="fu-error-text">{errors.followUpDate}</span>}
            </div>
            <div className="fu-field-group">
              <label className="label" htmlFor="fu-method">Method</label>
              <select
                id="fu-method"
                className="input fu-input"
                value={data.method}
                onChange={(e) => handleChange('method', e.target.value as FollowUpMethod)}
              >
                {FOLLOW_UP_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {data.method === 'Other' && (
            <div className="animate-fade-in fu-field-group">
              <label className="label" htmlFor="fu-method-other">Specify Method</label>
              <input
                id="fu-method-other"
                className="input fu-input"
                type="text"
                placeholder="e.g., Slack, Letter, etc."
                value={data.methodOther}
                onChange={(e) => handleChange('methodOther', e.target.value)}
              />
            </div>
          )}

          <div className="fu-field-group">
            <label className="label" htmlFor="fu-contact">Person Contacted</label>
            <input
              id="fu-contact"
              className="input fu-input"
              type="text"
              placeholder="Who was contacted"
              value={data.contactPerson}
              onChange={(e) => handleChange('contactPerson', e.target.value)}
            />
          </div>

          <div className="fu-field-group">
            <label className="label" htmlFor="fu-communicated">
              What I Communicated <span style={{ color: 'var(--high)' }}>*</span>
            </label>
            <AutoResizeTextarea
              id="fu-communicated"
              className="fu-textarea"
              placeholder="What did you say or write?"
              value={data.communicated}
              onChange={(e) => handleChange('communicated', e.target.value)}
              minHeight={56}
              maxHeight={200}
              allowManualResize={true}
              style={{ borderColor: errors.communicated ? 'var(--high)' : undefined }}
            />
            {errors.communicated && <span className="fu-error-text">{errors.communicated}</span>}
          </div>

          <div className="fu-field-group">
            <label className="label" htmlFor="fu-response">Response Received</label>
            <AutoResizeTextarea
              id="fu-response"
              className="fu-textarea"
              placeholder="What was the response?"
              value={data.responseReceived}
              onChange={(e) => handleChange('responseReceived', e.target.value)}
              minHeight={50}
              maxHeight={180}
              allowManualResize={true}
            />
          </div>

          <div className="fu-field-group">
            <label className="label">Attachments (Max 5)</label>
            <div className="fu-attachments-list">
              {existingAttachments.map((att: any, i) => {
                const filename = att?.filename || att?.originalName || 'File';
                const url = att?.url || (att?._id ? `/api/f/${att._id}/${encodeURIComponent(filename)}` : '#');
                const isImage = /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(filename) || /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(url);
                const isVideo = /\.(mp4|mov|webm|avi|mkv|3gp|m4v|wmv)$/i.test(filename) || /\.(mp4|mov|webm|avi|mkv|3gp|m4v|wmv)$/i.test(url);
                const isAudio = /\.(mp3|wav|ogg|m4a|aac|flac|wma)$/i.test(filename) || /\.(mp3|wav|ogg|m4a|aac|flac|wma)$/i.test(url);

                return (
                  <div key={att?.public_id || att?._id || i} className="fu-attachment-pill">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="fu-attachment-link">
                      {isImage && url !== '#' ? (
                        <div className="fu-attachment-thumb">
                          <img src={url} alt={filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ) : isVideo ? (
                        <Video style={{ width: 14, height: 14, color: 'var(--accent)', flexShrink: 0 }} />
                      ) : isAudio ? (
                        <Volume2 style={{ width: 14, height: 14, color: 'var(--accent)', flexShrink: 0 }} />
                      ) : (
                        <Paperclip style={{ width: 14, height: 14, flexShrink: 0 }} />
                      )}
                      <span className="fu-attachment-filename">{filename}</span>
                    </a>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); removeExistingFile(i); }}
                      className="fu-attachment-remove-btn"
                      title="Remove"
                      aria-label={`Remove ${filename}`}
                    >
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                );
              })}

              {files.map((file, i) => {
                const isImage = file.type.startsWith('image/');
                const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|avi|mkv|3gp|m4v|wmv)$/i.test(file.name);
                const isAudio = file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac|wma)$/i.test(file.name);
                if (isImage && !(file as any).previewUrl) {
                  (file as any).previewUrl = URL.createObjectURL(file);
                }
                const previewUrl = (file as any).previewUrl;

                return (
                  <div key={i} className="fu-attachment-pill fu-attachment-pill-new">
                    {previewUrl ? (
                      <div className="fu-attachment-thumb">
                        <img src={previewUrl} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : isVideo ? (
                      <Video style={{ width: 14, height: 14, color: 'var(--accent)', flexShrink: 0 }} />
                    ) : isAudio ? (
                      <Volume2 style={{ width: 14, height: 14, color: 'var(--accent)', flexShrink: 0 }} />
                    ) : (
                      <Paperclip style={{ width: 14, height: 14, flexShrink: 0 }} />
                    )}
                    <span className="fu-attachment-filename">{file.name}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); removeFile(i); }}
                      className="fu-attachment-remove-btn"
                      title="Remove"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                );
              })}

              {(existingAttachments.length + files.length) < 5 && (
                <label className="fu-add-file-btn">
                  <Paperclip style={{ width: 14, height: 14, flexShrink: 0 }} />
                  <span>Add File</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>
            {errors.files && <span className="fu-error-text">{errors.files}</span>}
          </div>

          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="fu-show-more-btn"
          >
            {showMore ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
            {showMore ? 'Show less' : 'Show more options'}
          </button>

          {showMore && (
            <div className="animate-slide-down fu-more-options">
              <div className="fu-field-group">
                <label className="label" htmlFor="fu-notes">Notes</label>
                <textarea
                  id="fu-notes"
                  className="input fu-input fu-notes-textarea"
                  placeholder="Any additional observations or context"
                  value={data.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={2}
                />
              </div>

              <div className="fu-modal-grid">
                <div className="fu-field-group">
                  <label className="label" htmlFor="fu-next-action">Next Action</label>
                  <input
                    id="fu-next-action"
                    className="input fu-input"
                    type="text"
                    placeholder="What should happen next"
                    value={data.nextAction}
                    onChange={(e) => handleChange('nextAction', e.target.value)}
                  />
                </div>
                <div className="fu-field-group">
                  <label className="label" htmlFor="fu-next-date">Next Follow-Up Date</label>
                  <input
                    id="fu-next-date"
                    className="input fu-input"
                    type="date"
                    value={data.nextFollowUpDate}
                    onChange={(e) => handleChange('nextFollowUpDate', e.target.value)}
                    onClick={(e) => 'showPicker' in e.currentTarget && (e.currentTarget as any).showPicker()}
                  />
                </div>
              </div>
            </div>
          )}

          {errors.submit && (
            <div className="fu-submit-error">
              {errors.submit}
            </div>
          )}
        </div>

        <div className="fu-modal-footer">
          <button type="button" className="btn btn-ghost fu-modal-btn" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary fu-modal-btn fu-modal-btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <><div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> Saving…</>
            ) : isEditing ? (
              <><Edit3 style={{ width: 14, height: 14 }} /> Update</>
            ) : (
              <><Save style={{ width: 14, height: 14 }} /> Save</>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

