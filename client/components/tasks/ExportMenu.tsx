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
  Archive,
  ChevronDown,
  AlertTriangle,
  Plus,
  X,
  Calendar,
  Layers,
  Clock,
  ShieldAlert,
  CheckCircle2,
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
  const [exportingFormat, setExportingFormat] = useState<'pdf' | 'excel' | 'zip' | null>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showInternalNewTaskModal, setShowInternalNewTaskModal] = useState(false);
  const [targetFormat, setTargetFormat] = useState<'pdf' | 'excel' | 'zip'>('excel');
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  function getFilterParams() {
    const params: Record<string, string> = {};
    if (filters.search) params.search = filters.search;
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.givenBy) params.givenBy = filters.givenBy;
    if (filters.year) params.year = filters.year;
    if (filters.month) params.month = filters.month;
    if (filters.weekStart) params.weekStart = filters.weekStart;
    if (filters.weekIndex !== undefined) params.weekIndex = filters.weekIndex.toString();
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
    setExportingFormat(format);

    try {
      const count = await resolveTaskCount();

      if (count === 0) {
        setShowAlertModal(true);
        return;
      }

      // Secure in-memory AJAX Blob fetch: Never exposes backend URL or redirects the browser
      const downloadUrl = buildExportUrl(format);
      const res = await fetch(downloadUrl);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Export failed' }));
        if (res.status === 404) {
          setShowAlertModal(true);
        } else {
          setExportError(err.message || err.error || 'Failed to generate export file.');
        }
        return;
      }

      // Extract filename from Content-Disposition header if available
      const disposition = res.headers.get('content-disposition');
      let filename = '';
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, '').trim();
        }
      }
      if (!filename) {
        const ext = format === 'excel' ? 'xlsx' : format;
        const prefix = (filters.hasFollowUps || isPanel) ? 'Follow-Ups' : 'Tasks';
        if (filters.day) {
          filename = `Daily_${prefix}_Report_Date_${formatDate(filters.day)}.${ext}`;
        } else if (filters.weekIndex !== undefined && filters.dateFrom && filters.dateTo) {
          filename = `Weekly_${prefix}_Report_Week_${filters.weekIndex}_${formatDate(filters.dateFrom)}_to_${formatDate(filters.dateTo)}.${ext}`;
        } else if (filters.month && filters.year) {
          const mIdx = parseInt(filters.month, 10) - 1;
          filename = `Monthly_${prefix}_Register_${SHORT_MONTHS[mIdx] || filters.month}_${filters.year}.${ext}`;
        } else if (filters.year) {
          filename = `All_Months_${filters.year}_${prefix}_Register.${ext}`;
        } else {
          filename = `${prefix}_Export.${ext}`;
        }
      }

      // Create isolated in-memory Blob URL and trigger native browser file save
      const blob = await res.blob();
      if (!blob || blob.size === 0) {
        setExportError('Export file generation failed. The generated file was empty.');
        return;
      }
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setExportSuccess(`"${filename}" downloaded successfully!`);
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (err) {
      console.error('Export download error:', err);
      setExportError('Could not export file. Please check your network connection and try again.');
    } finally {
      setExportingFormat(null);
    }
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
  } else if (filters.weekIndex !== undefined && filters.dateFrom && filters.dateTo) {
    scopeLabel = `Week ${filters.weekIndex} (${formatDate(filters.dateFrom)} to ${formatDate(filters.dateTo)})`;
  } else if (filters.dateFrom && filters.dateTo) {
    scopeLabel = `${formatDate(filters.dateFrom)} to ${formatDate(filters.dateTo)}`;
  } else if (filters.month && filters.year) {
    const monthNum = parseInt(filters.month, 10);
    scopeLabel = `${SHORT_MONTHS[monthNum - 1] || filters.month} ${filters.year}`;
  } else if (filters.year) {
    scopeLabel = `All Months ${filters.year}`;
  }

  const formatLabels: Record<string, string> = {
    excel: 'Excel Spreadsheet (.xlsx)',
    pdf: 'PDF Document (.pdf)',
    zip: isPanel ? 'ZIP with Attachments (.zip)' : 'ZIP Archive (.zip)',
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        id="btn-export"
        className="btn btn-ghost"
        onClick={() => setOpen(!open)}
        disabled={checking || exportingFormat !== null}
        style={{ minWidth: 100 }}
      >
        {exportingFormat ? (
          <>
            <div
              className="animate-spin"
              style={{
                width: 13,
                height: 13,
                border: '2px solid rgba(139, 92, 246, 0.3)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
              }}
            />
            <span>Generating…</span>
          </>
        ) : (
          <>
            <Download style={{ width: 14, height: 14 }} />
            <span>{checking ? 'Checking…' : 'Export'}</span>
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
          </>
        )}
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
            {isPanel ? (
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
            ) : (
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
                <Archive style={{ width: 14, height: 14, color: 'var(--accent)' }} />
                Export ZIP (Organized Folder)
              </button>
            )}
          </div>
        </>
      )}

      {/* ── Top MNC Enterprise Alert Modal (Poka-Yoke Zero-Defect Quality Gate) ── */}
      {showAlertModal && (
        <div
          className="app-dialog-overlay"
          onClick={() => setShowAlertModal(false)}
        >
          <div
            className="app-dialog-box"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Amber Warning Strip */}
            <div className="app-dialog-accent-bar app-dialog-accent-amber" />

            {/* Modal Header */}
            <div className="app-dialog-header">
              <div className="app-dialog-header-left">
                <div className="app-dialog-icon-wrap app-dialog-icon-amber">
                  <AlertTriangle style={{ width: 22, height: 22 }} />
                </div>
                <div>
                  <div className="app-dialog-eyebrow app-dialog-eyebrow-amber">
                    <ShieldAlert style={{ width: 12, height: 12 }} />
                    Notice
                  </div>
                  <h3 className="app-dialog-title">
                    No Tasks Found
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setShowAlertModal(false)}
                className="app-dialog-close-btn"
                aria-label="Close"
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="app-dialog-body">
              <p className="app-dialog-desc">
                No tasks found for <strong>{scopeLabel}</strong>. Add at least one task to export.
              </p>

              {/* Details Double-Bezel Card */}
              <div className="app-dialog-card">
                {selectedDayStr && (
                  <div className="app-dialog-row">
                    <span className="app-dialog-label">
                      <Calendar style={{ width: 13, height: 13 }} /> Selected Date:
                    </span>
                    <strong className="app-dialog-value">{selectedDayStr}</strong>
                  </div>
                )}

                <div className="app-dialog-row">
                  <span className="app-dialog-label">
                    <Clock style={{ width: 13, height: 13 }} /> Today's Date:
                  </span>
                  <span className="app-dialog-value">{currentDateStr}</span>
                </div>

                <div className="app-dialog-row">
                  <span className="app-dialog-label">
                    <Layers style={{ width: 13, height: 13 }} /> Tasks Found:
                  </span>
                  <span
                    style={{
                      background: 'rgba(239, 68, 68, 0.14)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      padding: '2px 8px',
                      borderRadius: 9999,
                      fontWeight: 700,
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
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.28)',
                    borderRadius: 'var(--radius-md, 8px)',
                    padding: '10px 14px',
                    fontSize: 12.5,
                    color: 'var(--text-secondary)',
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 14 }}>ℹ️</span>
                  <span>
                    This date is in the future. Add tasks for this date before exporting.
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
                Add a task to download your report.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="app-dialog-footer">
              <button
                type="button"
                className="app-dialog-btn-cancel"
                onClick={() => setShowAlertModal(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="app-dialog-btn-action app-dialog-btn-success"
                onClick={handleFirstAddTaskClick}
              >
                <Plus style={{ width: 14, height: 14, strokeWidth: 3 }} />
                Add a Task
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

      {/* ── Export Error Modal ────────────────────────────────────────────── */}
      {exportError && (
        <div className="app-dialog-overlay" onClick={() => setExportError(null)}>
          <div
            className="app-dialog-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 430 }}
          >
            <div className="app-dialog-accent-bar app-dialog-accent-danger" />

            <div className="app-dialog-header">
              <div className="app-dialog-header-left">
                <div className="app-dialog-icon-wrap app-dialog-icon-danger">
                  <AlertTriangle style={{ width: 20, height: 20 }} />
                </div>
                <div>
                  <div className="app-dialog-eyebrow app-dialog-eyebrow-danger">
                    EXPORT FAILED
                  </div>
                  <h3 className="app-dialog-title">Export Error</h3>
                </div>
              </div>
              <button
                type="button"
                className="app-dialog-close-btn"
                onClick={() => setExportError(null)}
                aria-label="Close dialog"
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="app-dialog-body">
              <p className="app-dialog-desc">{exportError}</p>
            </div>

            <div className="app-dialog-footer">
              <button
                type="button"
                className="app-dialog-btn-action app-dialog-btn-danger"
                onClick={() => setExportError(null)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Export Success Toast Pop ──────────────────────────────────────── */}
      {exportSuccess && (
        <div className="app-toast app-toast-success" role="status">
          <div className="app-toast-icon">
            <CheckCircle2 style={{ width: 16, height: 16 }} />
          </div>
          <span className="app-toast-text">{exportSuccess}</span>
          <button
            type="button"
            className="app-toast-dismiss"
            onClick={() => setExportSuccess(null)}
            aria-label="Dismiss toast"
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
      )}
    </div>
  );
}
