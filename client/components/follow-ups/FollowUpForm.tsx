'use client';
import { useState, useEffect } from 'react';
import { FollowUp, FollowUpFormData, FollowUpMethod, FOLLOW_UP_METHODS } from '@/types/followUp';
import { toIsoDate } from '@/lib/dates';
import { X, Paperclip, ChevronDown, ChevronUp, Save, Edit3 } from 'lucide-react';

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

  // Ensure state is perfectly synced if editingFollowUp changes while form is open
  // (or during local dev Fast Refresh)
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
    if (!data.communicated.trim()) errs.communicated = 'What you communicated is required';
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

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }} style={{ zIndex: 100 }}>
      <div className="modal-box animate-slide-up" style={{ padding: 0, width: '100%', maxWidth: 520 }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
            {isEditing ? `Edit Follow-Up #${editingFollowUp.followUpNumber}` : 'New Follow-Up'}
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 4 }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '20px 24px', maxHeight: 'calc(95vh - 130px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Row 1: Date/Time + Method */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label" htmlFor="fu-date">Date & Time</label>
              <input
                id="fu-date"
                className="input"
                type="datetime-local"
                value={data.followUpDate}
                onChange={(e) => handleChange('followUpDate', e.target.value)}
                onClick={(e) => 'showPicker' in e.currentTarget && (e.currentTarget as any).showPicker()}
                style={{ borderColor: errors.followUpDate ? 'var(--high)' : undefined }}
              />
              {errors.followUpDate && <span style={{ fontSize: 11, color: 'var(--high)', display: 'block', marginTop: 4 }}>{errors.followUpDate}</span>}
            </div>
            <div>
              <label className="label" htmlFor="fu-method">Method</label>
              <select
                id="fu-method"
                className="input"
                value={data.method}
                onChange={(e) => handleChange('method', e.target.value as FollowUpMethod)}
              >
                {FOLLOW_UP_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Method Other */}
          {data.method === 'Other' && (
            <div className="animate-fade-in">
              <label className="label" htmlFor="fu-method-other">Specify Method</label>
              <input
                id="fu-method-other"
                className="input"
                type="text"
                placeholder="e.g., Slack, Letter, etc."
                value={data.methodOther}
                onChange={(e) => handleChange('methodOther', e.target.value)}
              />
            </div>
          )}

          {/* Contact Person */}
          <div>
            <label className="label" htmlFor="fu-contact">Person Contacted</label>
            <input
              id="fu-contact"
              className="input"
              type="text"
              placeholder="Who was contacted"
              value={data.contactPerson}
              onChange={(e) => handleChange('contactPerson', e.target.value)}
            />
          </div>

          {/* Communicated */}
          <div>
            <label className="label" htmlFor="fu-communicated">What I Communicated <span style={{ color: 'var(--high)' }}>*</span></label>
            <textarea
              id="fu-communicated"
              className="input"
              placeholder="What did you say or write?"
              value={data.communicated}
              onChange={(e) => handleChange('communicated', e.target.value)}
              rows={2}
              style={{ borderColor: errors.communicated ? 'var(--high)' : undefined }}
            />
            {errors.communicated && <span style={{ fontSize: 11, color: 'var(--high)', display: 'block', marginTop: 4 }}>{errors.communicated}</span>}
          </div>

          {/* Response Received */}
          <div>
            <label className="label" htmlFor="fu-response">Response Received</label>
            <textarea
              id="fu-response"
              className="input"
              placeholder='What was the response?'
              value={data.responseReceived}
              onChange={(e) => handleChange('responseReceived', e.target.value)}
              rows={1}
            />
          </div>

          {/* File Attachments */}
          <div>
            <label className="label">Attachments (Max 5)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {/* Existing Attachments */}
              {existingAttachments.map((att: any, i) => {
                const url = att?.url || '';
                const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
                const fileUrl = url;

                return (
                  <div key={att?._id || i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', fontSize: 12
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                      {isImage && fileUrl ? (
                        <div style={{ width: 32, height: 32, borderRadius: 4, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)' }}>
                          <img src={fileUrl} alt={att?.filename || 'Attachment'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ) : (
                        <Paperclip style={{ width: 14, height: 14, color: 'var(--text-muted)' }} />
                      )}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att?.filename || 'File'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {fileUrl && (
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 11 }}>View</a>
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); removeExistingFile(i); }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                      >
                        <X style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* New Files */}
              {files.map((file, i) => {
                const isImage = file.type.startsWith('image/');
                if (isImage && !(file as any).previewUrl) {
                  (file as any).previewUrl = URL.createObjectURL(file);
                }
                const previewUrl = (file as any).previewUrl;
                
                return (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px dashed var(--accent)',
                    borderRadius: 'var(--radius-md)', fontSize: 12
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                      {previewUrl ? (
                        <div style={{ width: 32, height: 32, borderRadius: 4, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)' }}>
                          <img src={previewUrl} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ) : (
                        <Paperclip style={{ width: 14, height: 14, color: 'var(--text-muted)' }} />
                      )}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name} (New)</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); removeFile(i); }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                    >
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                );
              })}

              {/* Add File Button */}
              {(existingAttachments.length + files.length) < 5 && (
                <label style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)',
                  background: 'transparent', transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <Paperclip style={{ width: 14, height: 14 }} />
                  <span>Add File</span>
                  <input
                    type="file"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>
            {errors.files && <span style={{ fontSize: 11, color: 'var(--high)', display: 'block', marginTop: 4 }}>{errors.files}</span>}
          </div>

          {/* Show more toggle */}
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
            }}
          >
            {showMore ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
            {showMore ? 'Show less' : 'Show more options'}
          </button>

          {showMore && (
            <div className="animate-slide-down" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Notes */}
              <div>
                <label className="label" htmlFor="fu-notes">Notes</label>
                <textarea
                  id="fu-notes"
                  className="input"
                  placeholder="Any additional observations or context"
                  value={data.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={2}
                />
              </div>

              {/* Next Action + Next Follow-Up Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label" htmlFor="fu-next-action">Next Action</label>
                  <input
                    id="fu-next-action"
                    className="input"
                    type="text"
                    placeholder="What should happen next"
                    value={data.nextAction}
                    onChange={(e) => handleChange('nextAction', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="fu-next-date">Next Follow-Up Date</label>
                  <input
                    id="fu-next-date"
                    className="input"
                    type="date"
                    value={data.nextFollowUpDate}
                    onChange={(e) => handleChange('nextFollowUpDate', e.target.value)}
                    onClick={(e) => 'showPicker' in e.currentTarget && (e.currentTarget as any).showPicker()}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {errors.submit && (
            <div style={{ padding: '10px 14px', background: 'var(--high-bg)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--high)' }}>
              {errors.submit}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
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
    </div>
  );
}
