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


  if (visibleFollowUps.length === 0) {
    if (loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 120, width: '100%', borderRadius: 'var(--radius-lg)', opacity: 1 - i * 0.2 }} />
          ))}
        </div>
      );
    }
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border)' }}>
        <p style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No follow-ups recorded yet</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Use the button above to start tracking communication.</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {loading && (
        <div className="loading-bar" style={{ borderRadius: 4, top: -8 }}>
          <div className="loading-bar-inner" />
        </div>
      )}
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
          // Strictly sort newest-first: highest followUpNumber first (#2, then #1)
          const sorted = [...visibleFollowUps].sort((a, b) => {
            if ((b.followUpNumber || 0) !== (a.followUpNumber || 0)) {
              return (b.followUpNumber || 0) - (a.followUpNumber || 0);
            }
            const timeA = new Date(a.followUpDate || a.createdAt || 0).getTime();
            const timeB = new Date(b.followUpDate || b.createdAt || 0).getTime();
            return timeB - timeA;
          });

          return sorted.map((fu, idx) => (
            <FollowUpEntry
              key={fu._id}
              followUp={fu}
              isLast={idx === sorted.length - 1}
              displayNumber={fu.followUpNumber}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ));
        })()}
      </div>
    </div>
  );
}
