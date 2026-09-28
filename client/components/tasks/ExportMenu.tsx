'use client';
import { BASE_URL } from '@/lib/api';
import { buildQueryString } from '@/lib/api';
import { TaskFilters } from '@/types/task';
import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';

interface ExportMenuProps {
  filters: TaskFilters;
  selectedIds: string[];
  isPanel?: boolean;
}

export default function ExportMenu({ filters, selectedIds, isPanel = false }: ExportMenuProps) {
  const [open, setOpen] = useState(false);

  function buildExportUrl(format: 'pdf' | 'excel' | 'zip') {
    const params: Record<string, string> = {};

    // Pass active filters
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

    // If rows are selected, pass their IDs
    if (selectedIds.length > 0) params.ids = selectedIds.join(',');

    const qs = buildQueryString(params as Record<string, string>);
    return `${BASE_URL}/api/export/${format}${qs}`;
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        id="btn-export"
        className="btn btn-ghost"
        onClick={() => setOpen(!open)}
      >
        <Download style={{ width: 14, height: 14 }} />
        Export
        {selectedIds.length > 0 && (
          <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
            {selectedIds.length}
          </span>
        )}
        <ChevronDown style={{ width: 14, height: 14, color: 'var(--text-muted)' }} />
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 19 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 4px)',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)', zIndex: 20, minWidth: 160,
          }} className="animate-slide-down">
            {selectedIds.length > 0 && (
              <div style={{ padding: '8px 14px', fontSize: 11, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600, background: 'var(--bg-surface)' }}>
                Exporting {selectedIds.length} selected
              </div>
            )}
            <a
              id="export-pdf-btn"
              href={buildExportUrl('pdf')}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', color: 'var(--text-primary)',
                textDecoration: 'none', fontSize: 13, transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <FileText style={{ width: 14, height: 14, color: 'var(--high)' }} />
              Export as PDF
            </a>
            <a
              id="export-excel-btn"
              href={buildExportUrl('excel')}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', color: 'var(--text-primary)',
                textDecoration: 'none', fontSize: 13, transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <FileSpreadsheet style={{ width: 14, height: 14, color: 'var(--low)' }} />
              Export as Excel
            </a>
            {isPanel && (
              <a
                id="export-zip-btn"
                href={buildExportUrl('zip')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', color: 'var(--text-primary)',
                  textDecoration: 'none', fontSize: 13, transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Download style={{ width: 14, height: 14, color: 'var(--text-primary)' }} />
                Export ZIP with Attachments
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}
