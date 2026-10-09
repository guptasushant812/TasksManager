'use client';
import { useState } from 'react';
import { RecipientItem } from '@/types/escalation';
import {
  Plus,
  Mail,
  Edit2,
  X,
  AlignLeft,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import AutoResizeTextarea from '@/components/ui/AutoResizeTextarea';

export type RecipientCategory = 'TO' | 'CC' | 'BCC';

const TO_PRESET_TAGS = ['Manager', 'HOD', 'Dy.HOD', 'Client', 'Principal', 'Admin'];
const CC_PRESET_TAGS = ['Team', 'Admin', 'Support', 'Client', 'Manager', 'Auditor'];
const BCC_PRESET_TAGS = ['Archive', 'Admin', 'Audit', 'Security', 'Management'];

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function getTagBadgeStyle(tag: string) {
  const lower = tag.toLowerCase();
  if (lower.includes('manager')) {
    return {
      bg: 'rgba(234, 179, 8, 0.12)',
      color: '#eab308',
      border: 'rgba(234, 179, 8, 0.3)',
    };
  }
  if (lower === 'hod' || (lower.includes('hod') && !lower.includes('dy') && !lower.includes('deputy'))) {
    return {
      bg: 'rgba(139, 92, 246, 0.14)',
      color: '#a78bfa',
      border: 'rgba(139, 92, 246, 0.3)',
    };
  }
  if (lower.includes('dy') || lower.includes('deputy')) {
    return {
      bg: 'rgba(37, 99, 235, 0.14)',
      color: '#60a5fa',
      border: 'rgba(37, 99, 235, 0.3)',
    };
  }
  if (lower.includes('client')) {
    return {
      bg: 'rgba(34, 197, 94, 0.12)',
      color: '#4ade80',
      border: 'rgba(34, 197, 94, 0.3)',
    };
  }
  return {
    bg: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    border: 'var(--border-subtle)',
  };
}

interface EscalationRecipientsManagerProps {
  toRecipients: RecipientItem[];
  setToRecipients: React.Dispatch<React.SetStateAction<RecipientItem[]>>;
  ccRecipients: RecipientItem[];
  setCcRecipients: React.Dispatch<React.SetStateAction<RecipientItem[]>>;
  bccRecipients: RecipientItem[];
  setBccRecipients: React.Dispatch<React.SetStateAction<RecipientItem[]>>;
  disabled?: boolean;
}

export default function EscalationRecipientsManager({
  toRecipients,
  setToRecipients,
  ccRecipients,
  setCcRecipients,
  bccRecipients,
  setBccRecipients,
  disabled = false,
}: EscalationRecipientsManagerProps) {
  // Sub-modal state for Add / Edit email
  const [modalCategory, setModalCategory] = useState<RecipientCategory | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [subEmail, setSubEmail] = useState('');
  const [subTag, setSubTag] = useState('');
  const [subError, setSubError] = useState('');

  // Multi-line paste state
  const [pasteCategory, setPasteCategory] = useState<RecipientCategory | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [pasteTag, setPasteTag] = useState('');
  const [pasteError, setPasteError] = useState('');

  const [activeTooltip, setActiveTooltip] = useState<{
    id: string;
    tag: string;
    email: string;
  } | null>(null);

  const handleOpenAdd = (category: RecipientCategory) => {
    if (disabled) return;
    setModalCategory(category);
    setEditingIndex(null);
    setSubEmail('');
    setSubTag(category === 'TO' ? 'Manager' : category === 'CC' ? 'Team' : 'Admin');
    setSubError('');
  };

  const handleOpenEdit = (category: RecipientCategory, index: number) => {
    if (disabled) return;
    const list = category === 'TO' ? toRecipients : category === 'CC' ? ccRecipients : bccRecipients;
    const item = list[index];
    if (!item) return;
    setModalCategory(category);
    setEditingIndex(index);
    setSubEmail(item.email);
    setSubTag(item.tag);
    setSubError('');
  };

  const handleSaveSubRecipient = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    if (!subEmail.trim()) {
      setSubError('Please enter an email address.');
      return;
    }
    if (!isValidEmail(subEmail)) {
      setSubError('Please enter a valid email address (e.g. name@company.com).');
      return;
    }
    if (!subTag.trim()) {
      setSubError('Please provide a tag/role for this email.');
      return;
    }

    const newItem: RecipientItem = {
      email: subEmail.trim(),
      tag: subTag.trim(),
    };

    if (modalCategory === 'TO') {
      setToRecipients((prev) =>
        editingIndex !== null ? prev.map((it, idx) => (idx === editingIndex ? newItem : it)) : [...prev, newItem]
      );
    } else if (modalCategory === 'CC') {
      setCcRecipients((prev) =>
        editingIndex !== null ? prev.map((it, idx) => (idx === editingIndex ? newItem : it)) : [...prev, newItem]
      );
    } else if (modalCategory === 'BCC') {
      setBccRecipients((prev) =>
        editingIndex !== null ? prev.map((it, idx) => (idx === editingIndex ? newItem : it)) : [...prev, newItem]
      );
    }

    setModalCategory(null);
    setEditingIndex(null);
    setSubEmail('');
    setSubTag('');
  };

  const handleRemoveRecipient = (category: RecipientCategory, index: number) => {
    if (disabled) return;
    if (category === 'TO') {
      setToRecipients((prev) => prev.filter((_, i) => i !== index));
    } else if (category === 'CC') {
      setCcRecipients((prev) => prev.filter((_, i) => i !== index));
    } else if (category === 'BCC') {
      setBccRecipients((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleApplyPaste = (category: RecipientCategory) => {
    setPasteError('');
    if (!pasteText.trim()) {
      setPasteError('Please enter or paste at least one email address.');
      return;
    }

    const lines = pasteText
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const validItems: RecipientItem[] = [];
    const invalidList: string[] = [];
    const defaultTag = pasteTag.trim() || (category === 'TO' ? 'Manager' : category === 'CC' ? 'CC' : 'BCC');

    for (const email of lines) {
      if (isValidEmail(email)) {
        validItems.push({ email, tag: defaultTag });
      } else {
        invalidList.push(email);
      }
    }

    if (invalidList.length > 0) {
      setPasteError(`Invalid email address format: ${invalidList.slice(0, 3).join(', ')}`);
      return;
    }

    if (validItems.length === 0) {
      setPasteError('No valid email addresses found.');
      return;
    }

    if (category === 'TO') {
      setToRecipients((prev) => [...prev, ...validItems]);
    } else if (category === 'CC') {
      setCcRecipients((prev) => [...prev, ...validItems]);
    } else if (category === 'BCC') {
      setBccRecipients((prev) => [...prev, ...validItems]);
    }

    setPasteCategory(null);
    setPasteText('');
    setPasteTag('');
  };

  const renderSection = (
    category: RecipientCategory,
    title: string,
    badgeText: string,
    isRequired: boolean,
    recipients: RecipientItem[]
  ) => {
    const isPasteOpen = pasteCategory === category;

    return (
      <div
        style={{
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-elevated)',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
              {title}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: isRequired ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-surface)',
                color: isRequired ? 'var(--high)' : 'var(--text-muted)',
                border: isRequired ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid var(--border-subtle)',
              }}
            >
              {badgeText}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={disabled}
              onClick={() => {
                if (isPasteOpen) {
                  setPasteCategory(null);
                } else {
                  setPasteCategory(category);
                  setPasteTag(category === 'TO' ? 'Manager' : category === 'CC' ? 'CC' : 'BCC');
                  setPasteText('');
                  setPasteError('');
                }
              }}
              style={{
                padding: '4px 8px',
                fontSize: 11,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                color: isPasteOpen ? 'var(--accent)' : 'var(--text-secondary)',
              }}
              title="Paste multiple emails or type multi-line list"
            >
              <AlignLeft style={{ width: 12, height: 12 }} />
              {isPasteOpen ? 'Hide Multi-Line' : 'Multi-Line Paste'}
              {isPasteOpen ? <ChevronUp style={{ width: 11, height: 11 }} /> : <ChevronDown style={{ width: 11, height: 11 }} />}
            </button>

            <button
              type="button"
              className="btn btn-primary"
              disabled={disabled}
              onClick={() => handleOpenAdd(category)}
              style={{
                padding: '5px 10px',
                fontSize: 11,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Plus style={{ width: 13, height: 13, strokeWidth: 2.5 }} />
              Add Email
            </button>
          </div>
        </div>

        {isPasteOpen && (
          <div
            className="animate-slide-up"
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Paste or type multiple emails (one per line or separated by commas):
              </span>
              <button
                type="button"
                onClick={() => setPasteCategory(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
              >
                <X style={{ width: 13, height: 13 }} />
              </button>
            </div>

            <AutoResizeTextarea
              placeholder={`e.g.\nhod.dept@example.com\nmanager@example.com\ndyhod@example.com`}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              minHeight={72}
              maxHeight={220}
              allowManualResize={true}
              style={{ fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre' }}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Assign Tag:</span>
                <input
                  type="text"
                  className="input"
                  value={pasteTag}
                  onChange={(e) => setPasteTag(e.target.value)}
                  placeholder="e.g. Member, HOD"
                  style={{ width: 130, padding: '4px 8px', fontSize: 11 }}
                />
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleApplyPaste(category)}
                style={{ padding: '5px 12px', fontSize: 12 }}
              >
                Import All
              </button>
            </div>

            {pasteError && (
              <span style={{ fontSize: 11, color: 'var(--high)', fontWeight: 600 }}>
                {pasteError}
              </span>
            )}
          </div>
        )}

        <div style={{ minHeight: 38 }}>
          {recipients.length === 0 ? (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px dashed var(--border-subtle)',
                background: 'var(--bg-surface)',
                color: 'var(--text-muted)',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Info style={{ width: 13, height: 13, flexShrink: 0 }} />
              <span>
                {isRequired
                  ? 'No recipients in TO yet. Click "+ Add Email" to add Manager, HOD, or Dy.HOD.'
                  : `No ${category} recipients added (optional).`}
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {recipients.map((item, idx) => {
                const badgeStyle = getTagBadgeStyle(item.tag);
                const tagId = `${category}-${idx}-${item.email}`;

                return (
                  <div
                    key={tagId}
                    style={{ position: 'relative', display: 'inline-flex' }}
                    onMouseEnter={() =>
                      setActiveTooltip({ id: tagId, tag: item.tag, email: item.email })
                    }
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-md)',
                        background: badgeStyle.bg,
                        color: badgeStyle.color,
                        border: `1px solid ${badgeStyle.border}`,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: disabled ? 'default' : 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      title={`${item.tag}: ${item.email}`}
                      onClick={() => !disabled && handleOpenEdit(category, idx)}
                    >
                      <span style={{ letterSpacing: '0.02em' }}>{item.tag}</span>

                      {!disabled && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(category, idx);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: badgeStyle.color,
                            cursor: 'pointer',
                            display: 'flex',
                            padding: 2,
                            opacity: 0.7,
                          }}
                          title="Edit email"
                        >
                          <Edit2 style={{ width: 11, height: 11 }} />
                        </button>
                      )}

                      {!disabled && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveRecipient(category, idx);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: badgeStyle.color,
                            cursor: 'pointer',
                            display: 'flex',
                            padding: 2,
                            opacity: 0.7,
                          }}
                          title="Remove recipient"
                        >
                          <X style={{ width: 12, height: 12 }} />
                        </button>
                      )}
                    </div>

                    {activeTooltip?.id === tagId && (
                      <div
                        className="animate-slide-up"
                        style={{
                          position: 'absolute',
                          bottom: 'calc(100% + 6px)',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: '#090d16',
                          border: '1px solid rgba(255, 255, 255, 0.16)',
                          borderRadius: 6,
                          padding: '6px 10px',
                          color: '#f8fafc',
                          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.55)',
                          zIndex: 100,
                          pointerEvents: 'none',
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                        }}
                      >
                        <div style={{ fontSize: 10, color: badgeStyle.color, fontWeight: 700, textTransform: 'uppercase' }}>
                          {item.tag}
                        </div>
                        <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#e2e8f0' }}>
                          {item.email}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--text-muted)',
          }}
        >
          Escalation Recipients (Tags & Email Lists)
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Hover tags to view full email addresses</span>
      </div>

      {renderSection(
        'TO',
        'TO Recipients',
        'At least 1 required (Manager / HOD / Dy.HOD)',
        true,
        toRecipients
      )}

      {renderSection('CC', 'CC (Carbon Copy)', 'Optional', false, ccRecipients)}

      {renderSection('BCC', 'BCC (Blind Carbon Copy)', 'Optional', false, bccRecipients)}

      {modalCategory && (
        <div
          className="modal-overlay"
          style={{ zIndex: 200, background: 'rgba(0, 0, 0, 0.72)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalCategory(null);
          }}
        >
          <div
            className="modal-box animate-slide-up"
            style={{ maxWidth: 440, padding: 0, overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-elevated)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail style={{ width: 16, height: 16, color: 'var(--accent)' }} />
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  {editingIndex !== null ? 'Edit Recipient' : `Add Recipient to ${modalCategory}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalCategory(null)}
                className="btn btn-ghost"
                style={{ padding: 4 }}
              >
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>

            <div
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveSubRecipient(e);
                }
              }}
              style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              {subError && (
                <div
                  style={{
                    padding: '8px 12px',
                    background: 'var(--high-bg)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--high)',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {subError}
                </div>
              )}

              <div>
                <label className="label" htmlFor="sub-mgr-email" style={{ fontSize: 12, fontWeight: 600 }}>
                  Email Address <span style={{ color: 'var(--high)' }}>*</span>
                </label>
                <input
                  id="sub-mgr-email"
                  type="email"
                  className="input"
                  placeholder="e.g. hod.department@institution.edu"
                  value={subEmail}
                  onChange={(e) => {
                    setSubEmail(e.target.value);
                    if (subError) setSubError('');
                  }}
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="label" htmlFor="sub-mgr-tag" style={{ fontSize: 12, fontWeight: 600 }}>
                  Role Tag / Display Label <span style={{ color: 'var(--high)' }}>*</span>
                </label>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {(modalCategory === 'TO'
                    ? TO_PRESET_TAGS
                    : modalCategory === 'CC'
                    ? CC_PRESET_TAGS
                    : BCC_PRESET_TAGS
                  ).map((preset) => {
                    const isSelected = subTag.toLowerCase() === preset.toLowerCase();
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setSubTag(preset);
                          if (subError) setSubError('');
                        }}
                        style={{
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: isSelected ? 'var(--accent)' : 'var(--bg-elevated)',
                          color: isSelected ? '#fff' : 'var(--text-secondary)',
                          border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    id="sub-mgr-tag"
                    type="text"
                    className="input"
                    placeholder="or type custom tag (e.g. Dean, Admin, Lead)"
                    value={subTag}
                    onChange={(e) => {
                      setSubTag(e.target.value);
                      if (subError) setSubError('');
                    }}
                    required
                  />
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                  This tag will appear as the button/chip. Hovering over it will reveal the actual email.
                </span>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setModalCategory(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveSubRecipient}
                >
                  {editingIndex !== null ? 'Update Recipient' : 'Add Recipient'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
