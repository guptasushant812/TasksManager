'use client';
import { FollowUp } from '@/types/followUp';
import { formatDate } from '@/lib/dates';
import MethodBadge from './MethodBadge';
import { Pencil, Trash2, Paperclip } from 'lucide-react';

interface FollowUpEntryProps {
  followUp: FollowUp;
  isLast: boolean;
  displayNumber?: number;
  onEdit: (followUp: FollowUp) => void;
  onDelete: (followUp: FollowUp) => void;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function FollowUpEntry({ followUp, isLast, displayNumber, onEdit, onDelete }: FollowUpEntryProps) {
  const isDeleted = followUp.isDeleted;
  const numToDisplay = displayNumber ?? followUp.followUpNumber;

  return (
    <div className={`fu-entry ${isDeleted ? 'fu-entry-deleted' : ''}`}>
      <div className="fu-entry-connector">
        <div className={`fu-entry-dot ${isDeleted ? 'fu-dot-deleted' : ''}`} />
        {!isLast && <div className="fu-entry-line" />}
      </div>

      <div className="fu-entry-content">
        {/* Header */}
        <div className="fu-entry-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="fu-entry-number">#{numToDisplay}</span>
            <span className="fu-entry-date">
              {formatDate(followUp.followUpDate)} · {formatTime(followUp.followUpDate)}
            </span>
            <MethodBadge method={followUp.method} methodOther={followUp.methodOther} />
          </div>

          {!isDeleted && (
            <div className="fu-entry-actions">
              <button
                title="Edit"
                onClick={() => onEdit(followUp)}
                className="fu-action-btn"
              >
                <Pencil style={{ width: 12, height: 12 }} />
              </button>
              <button
                title="Delete"
                onClick={() => onDelete(followUp)}
                className="fu-action-btn fu-action-btn-danger"
              >
                <Trash2 style={{ width: 12, height: 12 }} />
              </button>
            </div>
          )}
        </div>

        {/* Deleted banner */}
        {isDeleted && (
          <div className="fu-deleted-banner">
            <span>Deleted</span>
            {followUp.deletedReason && (
              <span style={{ fontWeight: 400, color: 'inherit' }}> — {followUp.deletedReason}</span>
            )}
          </div>
        )}

        <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Contact */}
          {followUp.contactPerson && (
            <div className="fu-field">
              <span className="fu-field-label">To</span>
              <span className="fu-field-value">{followUp.contactPerson}</span>
            </div>
          )}

          {/* Communicated */}
          <div className="fu-field">
            <span className="fu-field-label">Communicated</span>
            <p className="fu-field-value" style={{ color: 'var(--text-primary)' }}>{followUp.communicated}</p>
          </div>

          {/* Response */}
          {followUp.responseReceived && (
            <div className="fu-field">
              <span className="fu-field-label">Response</span>
              <p className="fu-field-value fu-response">{followUp.responseReceived}</p>
            </div>
          )}

          {/* Additional details hidden by default but shown cleanly */}
          {followUp.notes && (
            <div className="fu-field">
              <span className="fu-field-label">Notes</span>
              <p className="fu-field-value">{followUp.notes}</p>
            </div>
          )}

          {/* Attachments */}
          {followUp.attachments && followUp.attachments.length > 0 && (
            <div className="fu-field">
              <span className="fu-field-label">Attachments</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                {followUp.attachments.map((att: any, index: number) => {
                  const url = att?.url || '';
                  
                  return (
                    <a
                      key={att?.public_id || index.toString()}
                      href={url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="fu-attachment-link"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px', background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                        textDecoration: 'none', color: 'var(--text-secondary)',
                        transition: 'all 0.15s', fontSize: 13
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                      <Paperclip style={{ width: 14, height: 14 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {att?.filename || 'File'}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Next Action */}
          {followUp.nextAction && (
            <div className="fu-field">
              <span className="fu-field-label">Next Action</span>
              <p className="fu-field-value">{followUp.nextAction}</p>
            </div>
          )}

          {/* Next Follow-Up Date */}
          {followUp.nextFollowUpDate && (
            <div className="fu-next-date">
              Next follow-up: <strong style={{ color: 'var(--text-secondary)' }}>{formatDate(followUp.nextFollowUpDate)}</strong>
              {new Date(followUp.nextFollowUpDate) < new Date() && !isDeleted && (
                <span className="fu-overdue-tag">Overdue</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
