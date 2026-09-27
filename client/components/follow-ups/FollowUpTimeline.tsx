'use client';
import { useState } from 'react';
import { FollowUp } from '@/types/followUp';
import FollowUpEntry from './FollowUpEntry';

interface FollowUpTimelineProps {
  followUps: FollowUp[];
  loading: boolean;
  onEdit: (followUp: FollowUp) => void;
  onDelete: (followUp: FollowUp) => void;
  onRefresh: (includeDeleted?: boolean) => void;
}

export default function FollowUpTimeline({ followUps, loading, onEdit, onDelete, onRefresh }: FollowUpTimelineProps) {
  const [showDeleted, setShowDeleted] = useState(false);

  const visibleFollowUps = showDeleted
    ? followUps
    : followUps.filter((fu) => !fu.isDeleted);

  const activeCount = followUps.filter((fu) => !fu.isDeleted).length;
  const deletedCount = followUps.filter((fu) => fu.isDeleted).length;

  function handleToggleDeleted() {
    const next = !showDeleted;
    setShowDeleted(next);
    onRefresh(next);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', flexDirection: 'column', gap: 16 }}>
        <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading timeline…</span>
      </div>
    );
  }

  if (visibleFollowUps.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border)' }}>
        <p style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No follow-ups recorded yet</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Use the button above to start tracking communication.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          History ({activeCount})
        </span>
        {deletedCount > 0 && (
          <button
            onClick={handleToggleDeleted}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, color: 'var(--text-secondary)',
              transition: 'color 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            {showDeleted ? 'Hide deleted' : `Show deleted (${deletedCount})`}
          </button>
        )}
      </div>

      <div className="fu-timeline">
        {(() => {
          let totalActive = visibleFollowUps.filter(fu => !fu.isDeleted).length;
          // Pre-calculate display numbers so they are strictly sequential for active items.
          // Since visibleFollowUps is sorted newest-first, the newest gets the highest number.
          const annotated = visibleFollowUps.map(fu => {
            let displayNumber = fu.followUpNumber; // default fallback
            if (!fu.isDeleted) {
              displayNumber = totalActive--;
            }
            return { ...fu, displayNumber };
          });

          return annotated.map((fu, idx) => (
            <FollowUpEntry
              key={fu._id}
              followUp={fu}
              isLast={idx === annotated.length - 1}
              displayNumber={fu.displayNumber}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ));
        })()}
      </div>
    </div>
  );
}
