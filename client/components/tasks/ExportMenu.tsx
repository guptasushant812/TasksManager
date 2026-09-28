'use client';
import { BASE_URL, buildQueryString } from '@/lib/api';
import { TaskFilters } from '@/types/task';
import { useState } from 'react';
import { formatDate, SHORT_MONTHS } from '@/lib/dates';
import NewTaskModal from '../modals/NewTaskModal';
import {
  Download,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  AlertTriangle,
  Plus,
  X,
  Calendar,
  Layers,
  Clock,
  ShieldAlert,
} from 'lucide-react';

interface ExportMenuProps {
  filters: TaskFilters;
  selectedIds: string[];
  isPanel?: boolean;
  totalTasks?: number;
  onAddNewTask?: () => void;
}

export default function ExportMenu({
  filters,
  selectedIds,
  isPanel = false,
  totalTasks,
  onAddNewTask,
}: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showInternalNewTaskModal, setShowInternalNewTaskModal] = useState(false);
  const [targetFormat, setTargetFormat] = useState<'pdf' | 'excel' | 'zip'>('excel');

  function getFilterParams() {
    const params: Record<string, string> = {};
    if (filters.search) params.search = filters.search;
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.givenBy) params.givenBy = filters.givenBy;
    if (filters.year) params.year = filters.year;
    if (filters.month) params.month = filters.month;
    if (filters.weekStart) params.weekStart = filters.weekStart;
    if (filters.day) params.day = filters.day;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (filters.sort) params.sort = filters.sort;
    if (filters.order) params.order = filters.order;
    if (filters.hasFollowUps) params.hasFollowUps = filters.hasFollowUps;
    if (isPanel) params.isPanel = 'true';
    if (selectedIds.length > 0) params.ids = selectedIds.join(',');
    return params;
  }

  function buildExportUrl(format: 'pdf' | 'excel' | 'zip') {
    const params = getFilterParams();
    const qs = buildQueryString(params);
    return `${BASE_URL}/api/export/${format}${qs}`;
  }

  // Check task count asynchronously if totalTasks is not provided
  async function resolveTaskCount(): Promise<number> {
    if (selectedIds.length > 0) return selectedIds.length;
    if (typeof totalTasks === 'number') return totalTasks;

    try {
      setChecking(true);
      const params = getFilterParams();
      params.limit = '1';
      const qs = buildQueryString(params);
      const res = await fetch(`${BASE_URL}/api/tasks${qs}`);
      if (!res.ok) return 0;
      const json = await res.json();
      return json.pagination?.total ?? json.data?.length ?? 0;
    } catch {
      return 0;
    } finally {
      setChecking(false);
    }
  }

  async function handleExportClick(format: 'pdf' | 'excel' | 'zip') {
    setOpen(false);
    setTargetFormat(format);

    const count = await resolveTaskCount();

    if (count === 0) {
      setShowAlertModal(true);
      return;
    }

    // Direct download trigger without opening orphaned blank tabs
    const downloadUrl = buildExportUrl(format);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleFirstAddTaskClick() {
    setShowAlertModal(false);
    if (onAddNewTask) {
      onAddNewTask();
    } else {
      setShowInternalNewTaskModal(true);
    }
  }

  // Contextual date information
  const currentDateStr = formatDate(new Date());
  const selectedDayStr = filters.day ? formatDate(filters.day) : null;
  const isFutureDate = filters.day ? new Date(filters.day).setHours(0,0,0,0) > new Date().setHours(0,0,0,0) : false;

  let scopeLabel = 'Current Filter Selection';
  if (selectedDayStr) {
    scopeLabel = `Date: ${selectedDayStr}`;
  } else if (filters.dateFrom && filters.dateTo) {
    scopeLabel = `${formatDate(filters.dateFrom)} to ${formatDate(filters.dateTo)}`;
  } else if (filters.month && filters.year) {
    const monthNum = parseInt(filters.month, 10);
    scopeLabel = `${SHORT_MONTHS[monthNum - 1] || filters.month} ${filters.year}`;
  } else if (filters.year) {
    scopeLabel = `Year ${filters.year}`;
  }

  const formatLabels: Record<string, string> = {
    excel: 'Excel Spreadsheet (.xlsx)',
    pdf: 'PDF Document (.pdf)',
    zip: 'ZIP Archive (.zip)',
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        id="btn-export"
        className="btn btn-ghost"
        onClick={() => setOpen(!open)}
        disabled={checking}
      >
        <Download style={{ width: 14, height: 14 }} />
        {checking ? 'Checking…' : 'Export'}
        {selectedIds.length > 0 && (
          <span
            style={{
              background: 'var(--accent)',
              color: '#fff',
              borderRadius: '50%',
              width: 16,
              height: 16,
              fontSize: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
            }}
          >
            {selectedIds.length}
          </span>
        )}
        <ChevronDown style={{ width: 14, height: 14, color: 'var(--text-muted)' }} />
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 19 }} onClick={() => setOpen(false)} />
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 4px)',
              background: 'var(--bg-elevated)',
              border: 'var(--border-width-layout) solid var(--border)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              boxShadow: 'var(--box-shadow-brutalist)',
              zIndex: 20,
              minWidth: 180,
            }}
            className="animate-slide-down"
          >
            {selectedIds.length > 0 && (
              <div
                style={{
                  padding: '8px 14px',
                  fontSize: 11,
                  color: 'var(--text-primary)',
                  borderBottom: '1px solid var(--border)',
                  fontWeight: 700,
                  background: 'var(--bg-surface)',
                }}
              >
                Exporting {selectedIds.length} selected
              </div>
            )}
            <button
              id="export-pdf-btn"
              type="button"
              onClick={() => handleExportClick('pdf')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                color: 'var(--text-primary)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                textAlign: 'left',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <FileText style={{ width: 14, height: 14, color: 'var(--high)' }} />
              Export as PDF
            </button>
            <button
              id="export-excel-btn"
              type="button"
              onClick={() => handleExportClick('excel')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                color: 'var(--text-primary)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                textAlign: 'left',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <FileSpreadsheet style={{ width: 14, height: 14, color: 'var(--low)' }} />
              Export as Excel
            </button>
            {isPanel && (
              <button
                id="export-zip-btn"
                type="button"
                onClick={() => handleExportClick('zip')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  color: 'var(--text-primary)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Download style={{ width: 14, height: 14, color: 'var(--text-primary)' }} />
                Export ZIP with Attachments
              </button>
            )}
          </div>
        </>
      )}

      {/* ── Top MNC Enterprise Alert Modal (Poka-Yoke Zero-Defect Quality Gate) ── */}
      {showAlertModal && (
        <div
          className="modal-overlay animate-fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowAlertModal(false)}
        >
          <div
            className="modal-box animate-slide-up"
            style={{
              maxWidth: 480,
              width: '100%',
              background: 'var(--bg-elevated)',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--box-shadow-brutalist), 0 20px 40px -15px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              padding: 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Amber Warning Strip */}
            <div
              style={{
                height: 4,
                width: '100%',
                background: 'linear-gradient(90deg, #F59E0B 0%, #EF4444 100%)',
              }}
            />

            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1.5px solid rgba(245, 158, 11, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#D97706',
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle style={{ width: 22, height: 22 }} />
                </div>
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: '#D97706',
                      marginBottom: 2,
                    }}
                  >
                    <ShieldAlert style={{ width: 12, height: 12 }} />
                    Zero-Defect Validation Gate
                  </div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 17,
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    No Tasks Found for Export
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setShowAlertModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  borderRadius: 'var(--radius-sm)',
                }}
                aria-label="Close"
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px' }}>
              <p
                style={{
                  margin: '0 0 16px',
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  color: 'var(--text-primary)',
                }}
              >
                Cannot generate <strong>{formatLabels[targetFormat]}</strong>. There are currently{' '}
                <strong style={{ color: 'var(--high)' }}>0 tasks</strong> recorded for{' '}
                <strong>{scopeLabel}</strong>.
              </p>

              {/* MNC Context Data Grid */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  fontSize: 12.5,
                  marginBottom: 18,
                }}
              >
                {selectedDayStr && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar style={{ width: 13, height: 13 }} /> Selected Date:
                    </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{selectedDayStr}</strong>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock style={{ width: 13, height: 13 }} /> Current System Date:
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{currentDateStr}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Layers style={{ width: 13, height: 13 }} /> Records Found:
                  </span>
                  <span
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: 'var(--high)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 800,
                      fontSize: 11,
                    }}
                  >
                    0 Tasks
                  </span>
                </div>
              </div>

              {isFutureDate && (
                <div
                  style={{
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    marginBottom: 18,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 14 }}>ℹ️</span>
                  <span>
                    Note: <strong>{selectedDayStr}</strong> is scheduled in the future. Please add planned or upcoming tasks first before downloading this register.
                  </span>
                </div>
              )}

              <p
                style={{
                  margin: 0,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                }}
              >
                Action Required: First add a task to enable verified enterprise reporting.
              </p>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                padding: '14px 24px 20px',
                background: 'var(--bg-surface)',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 10,
              }}
            >
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowAlertModal(false)}
                style={{ fontSize: 13 }}
              >
                Dismiss
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleFirstAddTaskClick}
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Plus style={{ width: 14, height: 14, strokeWidth: 3 }} />
                First Add a Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fallback New Task Modal if onAddNewTask is not provided */}
      {showInternalNewTaskModal && (
        <NewTaskModal
          defaultFilters={filters}
          onClose={() => setShowInternalNewTaskModal(false)}
          onSaved={() => {
            setShowInternalNewTaskModal(false);
            window.dispatchEvent(new CustomEvent('task-created'));
          }}
        />
      )}
    </div>
  );
}
