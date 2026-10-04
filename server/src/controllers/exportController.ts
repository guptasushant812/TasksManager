import { Request, Response, NextFunction } from 'express';
import Task from '../models/Task';
import FollowUp from '../models/FollowUp';
import { buildQuery } from '../utils/buildQuery';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import FollowUpAttachment from '../models/FollowUpAttachment';

function createZipArchive(options: any = { zlib: { level: 9 } }) {
  const archiverModule = require('archiver');
  if (archiverModule && archiverModule.ZipArchive) {
    return new archiverModule.ZipArchive(options);
  }
  if (typeof archiverModule === 'function') {
    return archiverModule('zip', options);
  }
  if (archiverModule && typeof archiverModule.default === 'function') {
    return archiverModule.default('zip', options);
  }
  throw new Error('Unsupported archiver format');
}

// ── Color Palettes for Professional Business Reports ────────────────────────
const PRIORITY_COLORS_HEX: Record<string, string> = {
  High: '#DC2626',   // Crimson Red
  Medium: '#D97706', // Warm Amber
  Low: '#16A34A',    // Forest Green
};

const STATUS_COLORS_HEX: Record<string, string> = {
  InProgress: '#2563EB', // Vibrant Blue
  Pending: '#D97706',    // Amber
  Completed: '#16A34A',  // Emerald Green
};

const PRIORITY_COLORS_ARGB: Record<string, string> = {
  High: 'FFDC2626',
  Medium: 'FFD97706',
  Low: 'FF16A34A',
};

const STATUS_COLORS_ARGB: Record<string, string> = {
  InProgress: 'FF2563EB',
  Pending: 'FFD97706',
  Completed: 'FF16A34A',
};

// ── Date Formatting Helpers ──────────────────────────────────────────────────
const TIMEZONE = process.env.TIMEZONE || 'Asia/Kolkata';

function formatDateStr(dateVal: Date | string | null | undefined): string {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '—';
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const parts = formatter.formatToParts(d);
  const day = parts.find(p => p.type === 'day')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const year = parts.find(p => p.type === 'year')?.value || '';
  return `${day}-${month}-${year}`;
}

function formatDateTimeStr(dateVal: Date | string | null | undefined): string {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '—';
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  const parts = formatter.formatToParts(d);
  const day = parts.find(p => p.type === 'day')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const year = parts.find(p => p.type === 'year')?.value || '';
  const hour = parts.find(p => p.type === 'hour')?.value || '';
  const minute = parts.find(p => p.type === 'minute')?.value || '';
  const dayPeriod = (parts.find(p => p.type === 'dayPeriod')?.value || 'AM').toUpperCase();
  return `${day}-${month}-${year}, ${hour}:${minute} ${dayPeriod}`;
}

// ── Multi-Status Reason / Remarks Formatter for Comparison ───────────────────
function formatTaskReasonAndRemarks(task: any): string {
  const pending = (task.pendingReason || (task.workStatus === 'Pending' ? task.reason : '') || '').trim();
  const inProgress = (task.inProgressReason || (task.workStatus === 'InProgress' ? task.reason : '') || '').trim();
  const completed = (task.completedRemarks || (task.workStatus === 'Completed' ? task.remarks : '') || '').trim();

  const count = (pending ? 1 : 0) + (inProgress ? 1 : 0) + (completed ? 1 : 0);
  if (count === 0) {
    return '—';
  }

  // If only one stage was ever filled, return cleanly without prefix tags
  if (count === 1) {
    if (task.workStatus === 'Completed' && completed) return completed;
    if (task.workStatus === 'InProgress' && inProgress) return inProgress;
    if (task.workStatus === 'Pending' && pending) return pending;
    return completed || inProgress || pending;
  }

  // Multiple stages have notes — format with clear stage tags so readers can compare
  const lines: string[] = [];
  if (task.workStatus === 'Completed') {
    if (completed) lines.push(`[Completed]: ${completed}`);
    if (pending) lines.push(`[Pending Reason]: ${pending}`);
    if (inProgress) lines.push(`[InProgress Note]: ${inProgress}`);
  } else if (task.workStatus === 'Pending') {
    if (pending) lines.push(`[Pending Reason]: ${pending}`);
    if (inProgress) lines.push(`[InProgress Note]: ${inProgress}`);
    if (completed) lines.push(`[Completed Note]: ${completed}`);
  } else {
    // InProgress
    if (inProgress) lines.push(`[InProgress Note]: ${inProgress}`);
    if (pending) lines.push(`[Pending Reason]: ${pending}`);
    if (completed) lines.push(`[Completed Note]: ${completed}`);
  }

  return lines.join('\n');
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getReportTitle(query: any, tasks: any[]): string {
  const isFollowUps = query.hasFollowUps === 'true' || query.isPanel === 'true';
  const isSpecificSingleTask = query.isPanel === 'true' || (query.ids && typeof query.ids === 'string' && query.ids.split(',').filter(Boolean).length === 1);

  // 1. Single task audit export (explicitly from panel or explicit single selection)
  if (tasks.length === 1 && isSpecificSingleTask) {
    const rawTitle = (tasks[0].title || 'Task').trim();
    return isFollowUps
      ? `Task Follow-Up Audit — ${rawTitle}`
      : `Task Report — ${rawTitle}`;
  }

  const prefix = isFollowUps ? 'Follow-Ups' : 'Task';
  const reportPrefix = isFollowUps ? 'Follow-Ups Report' : 'Task Management Report';
  const registerPrefix = isFollowUps ? 'Follow-Ups Register' : 'Task Management Register';

  // 2. Explicit Day / Single Date filter
  if (query.day && typeof query.day === 'string') {
    const dayStr = formatDateStr(query.day);
    if (dayStr && dayStr !== '—') {
      return `Daily ${prefix} Report — Date ${dayStr}`;
    }
  }

  // 3. Explicit Week filter (either by weekIndex or weekStart)
  if (query.weekIndex && query.dateFrom && query.dateTo) {
    const fromStr = formatDateStr(query.dateFrom);
    const toStr = formatDateStr(query.dateTo);
    return `Weekly ${prefix} Report — Week ${query.weekIndex} [${fromStr} to ${toStr}]`;
  }

  if (query.weekStart && typeof query.weekStart === 'string') {
    const wStart = new Date(query.weekStart);
    if (!isNaN(wStart.getTime())) {
      const wEnd = new Date(wStart);
      wEnd.setDate(wEnd.getDate() + 5);
      return `Weekly ${prefix} Report — ${formatDateStr(wStart)} to ${formatDateStr(wEnd)}`;
    }
  }

  // 4. Explicit Date range
  if (query.dateFrom || query.dateTo) {
    const fromStr = query.dateFrom ? formatDateStr(query.dateFrom) : '';
    const toStr = query.dateTo ? formatDateStr(query.dateTo) : '';
    if (fromStr && toStr) {
      return `${reportPrefix} — ${fromStr} to ${toStr}`;
    }
    if (fromStr) return `${reportPrefix} — From ${fromStr}`;
    if (toStr) return `${reportPrefix} — Up to ${toStr}`;
  }

  // 5. Explicit Month & Year filter (e.g. October 2026)
  if (query.month && query.year) {
    const m = parseInt(query.month, 10);
    const y = parseInt(query.year, 10);
    if (!isNaN(m) && m >= 1 && m <= 12 && !isNaN(y)) {
      return `Monthly ${prefix} Register — ${MONTH_NAMES[m - 1]} ${y}`;
    }
  }

  // 6. Explicit Year filter without specific month -> "All Months <Year>"
  if (query.year) {
    const y = parseInt(query.year, 10);
    if (!isNaN(y)) {
      return `All Months ${y} — ${prefix} Register`;
    }
  }

  // 7. Infer from tasks if all tasks share the exact same task date
  if (tasks.length > 0) {
    const firstDateStr = formatDateStr(tasks[0].date);
    if (firstDateStr && firstDateStr !== '—') {
      const allSameDate = tasks.every((t: any) => formatDateStr(t.date) === firstDateStr);
      if (allSameDate) {
        return `Daily ${prefix} Report — Date ${firstDateStr}`;
      }
    }
  }

  // 8. Clean universal fallback
  return isFollowUps ? `Follow-Ups Activity Register` : `Task Management Register`;
}

function getReportFileName(title: string, extension: 'pdf' | 'xlsx' | 'zip'): string {
  const cleanTitle = title
    .replace(/[—–]/g, '_')
    .replace(/[\[\]]/g, '')
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 80);

  return `${cleanTitle || 'Tasks_Export'}.${extension}`;
}

// ── Universal Standard PDF Report Generator (Landscape A4) ──────────────────
function generatePdfBuffer(
  tasks: any[],
  allFollowUps: any[] = [],
  reportTitle: string,
  legacyAttachments: any[] = [],
  baseUrl: string = '',
  summaryMapParam?: Map<string, number>
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const summaryMap = summaryMapParam || new Map<string, number>();
      if (!summaryMapParam) {
        allFollowUps.forEach(fu => {
          const tId = fu.taskId ? fu.taskId.toString() : '';
          if (tId) summaryMap.set(tId, (summaryMap.get(tId) || 0) + 1);
        });
      }

      const doc = new PDFDocument({
        margin: 30,
        size: 'A4',
        layout: 'landscape',
        bufferPages: true,
        autoFirstPage: true
      });

      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: any) => reject(err));

      const colWidths = [26, 112, 178, 78, 48, 60, 34, 58, 58, 124];
      const headers = ['Sr.', 'Title', 'Description', 'Given By', 'Priority', 'Status', 'F-Ups', 'Date', 'Due Date', 'Reason / Remarks'];
      const colAligns: ('left' | 'center')[] = ['center', 'left', 'left', 'left', 'center', 'center', 'center', 'center', 'center', 'left'];
      const totalW = colWidths.reduce((a, b) => a + b, 0); // 776 pt
      const startX = 33;
      const maxPageY = 545;

      function drawTableHeader(y: number): number {
        const headerH = 22;
        doc.rect(startX, y, totalW, headerH).fill('#1E293B');

        let hX = startX;
        headers.forEach((h, i) => {
          const colW = colWidths[i];
          if (i > 0) {
            doc.moveTo(hX, y).lineTo(hX, y + headerH).strokeColor('#334155').lineWidth(0.5).stroke();
          }
          doc.fillColor('#FFFFFF')
             .fontSize(8.5)
             .font('Helvetica-Bold')
             .text(h, hX + 4, y + 6, {
               width: colW - 8,
               align: 'center',
               lineBreak: false,
             });
          hX += colW;
        });

        doc.rect(startX, y, totalW, headerH).strokeColor('#0F172A').lineWidth(0.75).stroke();
        return y + headerH;
      }

      function drawReportHeader(isFirstPage: boolean): number {
        if (isFirstPage) {
          doc.fontSize(15).font('Helvetica-Bold').fillColor('#0F172A')
             .text(reportTitle, startX, 22, {
               width: totalW,
               align: 'center',
               lineBreak: false,
             });

          const completed = tasks.filter(t => t.workStatus === 'Completed').length;
          const inProg = tasks.filter(t => t.workStatus === 'InProgress').length;
          const pending = tasks.filter(t => t.workStatus === 'Pending').length;

          doc.fontSize(8.5).font('Helvetica').fillColor('#64748B')
             .text(`Generated: ${formatDateTimeStr(new Date())}   |   Total Tasks: ${tasks.length}   |   Name: Sushant Gupta`, startX, 44, {
               lineBreak: false,
             });

          doc.fontSize(8.5).font('Helvetica-Bold');
          const sCompleted = `Completed: ${completed}`;
          const sDivider = '   |   ';
          const sInProg = `In Progress: ${inProg}`;
          const sPending = `Pending: ${pending}`;

          const wComp = doc.widthOfString(sCompleted);
          const wDiv = doc.widthOfString(sDivider);
          const wProg = doc.widthOfString(sInProg);
          const wPend = doc.widthOfString(sPending);

          const totalStatsW = wComp + wDiv + wProg + wDiv + wPend;
          let statsX = startX + totalW - totalStatsW;

          doc.font('Helvetica-Bold').fillColor('#16A34A').text(sCompleted, statsX, 44, { lineBreak: false });
          statsX += wComp;
          doc.font('Helvetica').fillColor('#94A3B8').text(sDivider, statsX, 44, { lineBreak: false });
          statsX += wDiv;
          doc.font('Helvetica-Bold').fillColor('#2563EB').text(sInProg, statsX, 44, { lineBreak: false });
          statsX += wProg;
          doc.font('Helvetica').fillColor('#94A3B8').text(sDivider, statsX, 44, { lineBreak: false });
          statsX += wDiv;
          doc.font('Helvetica-Bold').fillColor('#D97706').text(sPending, statsX, 44, { lineBreak: false });

          doc.moveTo(startX, 58).lineTo(startX + totalW, 58).strokeColor('#CBD5E1').lineWidth(0.75).stroke();

          return drawTableHeader(66);
        } else {
          doc.fontSize(10).font('Helvetica-Bold').fillColor('#0F172A')
             .text(reportTitle, startX, 26, {
               width: totalW,
               align: 'center',
               lineBreak: false,
             });

          doc.fontSize(8.5).font('Helvetica').fillColor('#64748B')
             .text(`Name: Sushant Gupta   |   ${formatDateTimeStr(new Date())}`, startX + totalW - 250, 26, {
               width: 250,
               align: 'right',
               lineBreak: false,
             });

          doc.moveTo(startX, 42).lineTo(startX + totalW, 42).strokeColor('#E2E8F0').lineWidth(0.5).stroke();

          return drawTableHeader(48);
        }
      }

      let rowY = drawReportHeader(true);

      tasks.forEach((task: any, idx: number) => {
        const remarkOrReason = formatTaskReasonAndRemarks(task);
        const cells = [
          String(idx + 1),
          task.title || '—',
          task.description || '—',
          task.givenBy || '—',
          task.priority || '—',
          task.workStatus || '—',
          String(summaryMap.get(task._id.toString()) || 0),
          formatDateStr(task.date),
          task.dueDate ? formatDateStr(task.dueDate) : '—',
          remarkOrReason || '—',
        ];

        let maxContentH = 11;
        cells.forEach((text, i) => {
          if (!text || text === '—') return;
          const colW = colWidths[i];
          const isBold = i === 1 || i === 4 || i === 5;
          doc.fontSize(8.5).font(isBold ? 'Helvetica-Bold' : 'Helvetica');
          const h = doc.heightOfString(text, { width: colW - 8, lineGap: 1.8 });
          if (h > maxContentH) maxContentH = h;
        });

        const rowH = Math.max(20, Math.ceil(maxContentH + 10));

        if (rowY + rowH > maxPageY) {
          doc.addPage();
          rowY = drawReportHeader(false);
        }

        const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        doc.rect(startX, rowY, totalW, rowH).fill(rowBg);

        let vX = startX;
        colWidths.forEach((colW, i) => {
          if (i > 0) {
            doc.moveTo(vX, rowY).lineTo(vX, rowY + rowH).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
          }
          vX += colW;
        });

        doc.rect(startX, rowY, totalW, rowH).strokeColor('#E2E8F0').lineWidth(0.5).stroke();

        let cellX = startX;
        cells.forEach((text, i) => {
          const colW = colWidths[i];
          let cellColor = '#1E293B';
          let isBold = false;

          if (i === 4) {
            cellColor = PRIORITY_COLORS_HEX[task.priority] || '#1E293B';
            isBold = true;
          } else if (i === 5) {
            cellColor = STATUS_COLORS_HEX[task.workStatus] || '#1E293B';
            isBold = true;
          } else {
            cellColor = '#334155';
          }

          const textH = text && text !== '—'
            ? doc.fontSize(8.5).font(isBold ? 'Helvetica-Bold' : 'Helvetica').heightOfString(text, { width: colW - 8, lineGap: 1.8 })
            : 10;
          const cellY = rowY + Math.max(4, Math.floor((rowH - textH) / 2));

          doc.fillColor(cellColor)
             .fontSize(8.5)
             .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
             .text(text, cellX + 4, cellY, {
               width: colW - 8,
               align: colAligns[i],
               lineGap: 1.8,
             });

          cellX += colW;
        });

        rowY += rowH;
      });

      // Follow-Up Audit Trail Section (Cards)
      if (allFollowUps.length > 0) {
        rowY += 16;
        if (rowY + 60 > maxPageY) {
          doc.addPage();
          rowY = 32;
        }

        doc.fontSize(11).font('Helvetica-Bold').fillColor('#0F172A')
           .text(`FOLLOW-UP AUDIT TRAIL & ATTACHMENTS (${allFollowUps.length})`, startX, rowY);
        rowY += 16;
        doc.moveTo(startX, rowY).lineTo(startX + totalW, rowY).strokeColor('#CBD5E1').lineWidth(0.75).stroke();
        rowY += 10;

        allFollowUps.forEach((fu: any) => {
          const fuDateStr = formatDateTimeStr(fu.followUpDate || fu.createdAt);
          const methodStr = fu.method === 'Other' && fu.methodOther ? `Other (${fu.methodOther})` : (fu.method || 'General');
          const contactStr = fu.contactPerson ? `   |   Contact: ${fu.contactPerson}` : '';

          const commText = `Communicated: ${fu.communicated || 'None'}`;
          const respText = fu.responseReceived ? `Response: ${fu.responseReceived}` : '';
          const nextActionText = fu.nextAction ? `Next Action: ${fu.nextAction}${fu.nextFollowUpDate ? ` (Target: ${formatDateStr(fu.nextFollowUpDate)})` : ''}` : '';

          doc.fontSize(8.5).font('Helvetica');
          let cardH = 24;
          cardH += doc.heightOfString(commText, { width: totalW - 20, lineGap: 1.8 }) + 4;
          if (respText) {
            cardH += doc.heightOfString(respText, { width: totalW - 20, lineGap: 1.8 }) + 4;
          }
          if (nextActionText) {
            cardH += doc.heightOfString(nextActionText, { width: totalW - 20, lineGap: 1.8 }) + 4;
          }

          const fLegacyAtts = legacyAttachments.filter((la: any) => la.followUpId && la.followUpId.toString() === fu._id.toString());
          const hasCloudinary = fu.attachments && fu.attachments.length > 0;
          const hasAtts = hasCloudinary || fLegacyAtts.length > 0;
          if (hasAtts) {
            cardH += 20;
          }
          cardH += 10;

          if (rowY + cardH > maxPageY) {
            doc.addPage();
            rowY = 32;
          }

          doc.roundedRect(startX, rowY, totalW, cardH, 4).fillAndStroke('#F8FAFC', '#E2E8F0');

          let innerY = rowY + 6;
          doc.fontSize(9).font('Helvetica-Bold').fillColor('#1E293B')
             .text(`#${fu.followUpNumber}   |   ${fuDateStr}   |   Method: ${methodStr}${contactStr}`, startX + 10, innerY);
          innerY += 15;

          doc.fontSize(8.5).font('Helvetica').fillColor('#334155')
             .text(commText, startX + 10, innerY, { width: totalW - 20, lineGap: 1.8 });
          innerY += doc.heightOfString(commText, { width: totalW - 20, lineGap: 1.8 }) + 4;

          if (respText) {
            doc.fillColor('#047857')
               .text(respText, startX + 10, innerY, { width: totalW - 20, lineGap: 1.8 });
            innerY += doc.heightOfString(respText, { width: totalW - 20, lineGap: 1.8 }) + 4;
          }

          if (nextActionText) {
            doc.fillColor('#6D28D9')
               .text(nextActionText, startX + 10, innerY, { width: totalW - 20, lineGap: 1.8 });
            innerY += doc.heightOfString(nextActionText, { width: totalW - 20, lineGap: 1.8 }) + 4;
          }

          if (hasAtts) {
            doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#1E293B')
               .text('Attachments: ', startX + 10, innerY, { continued: true });
            doc.font('Helvetica').fillColor('#2563EB');

            const attLinks: { name: string; url: string }[] = [];
            if (hasCloudinary) {
              fu.attachments.forEach((att: any) => {
                attLinks.push({ name: att.filename || 'Attachment', url: att.url });
              });
            }
            if (fLegacyAtts.length > 0) {
              fLegacyAtts.forEach((att: any) => {
                const filename = att.originalName || 'Attachment';
                const url = baseUrl ? `${baseUrl}/api/f/${att._id}/${encodeURIComponent(filename)}` : '#';
                attLinks.push({ name: filename, url });
              });
            }

            attLinks.forEach((linkObj, linkIdx) => {
              doc.text(linkObj.name, { link: linkObj.url, underline: true, continued: linkIdx < attLinks.length - 1 });
              if (linkIdx < attLinks.length - 1) {
                doc.fillColor('#64748B').text('   •   ', { underline: false, continued: true }).fillColor('#2563EB');
              }
            });
          }

          rowY += cardH + 8;
        });
      }

      // Footer on all pages
      const totalPages = doc.bufferedPageRange().count;
      for (let p = 0; p < totalPages; p++) {
        doc.switchToPage(p);
        const origBottom = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;

        doc.moveTo(startX, 558)
           .lineTo(startX + totalW, 558)
           .strokeColor('#CBD5E1')
           .lineWidth(0.75)
           .stroke();

        doc.fontSize(8.5).font('Helvetica').fillColor('#64748B')
           .text(`© ${new Date().getFullYear()} `, startX, 566, { continued: true });
        doc.font('Helvetica-Bold').fillColor('#2563EB')
           .text('TasksManager', { continued: true });
        doc.font('Helvetica').fillColor('#64748B')
           .text(' by ', { continued: true });
        doc.font('Helvetica-Bold').fillColor('#0F172A')
           .text('Sushant Gupta', { continued: true });
        doc.font('Helvetica').fillColor('#94A3B8')
           .text('  •  All Rights Reserved.', { continued: false });

        doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#475569')
           .text(`Page ${p + 1} of ${totalPages}`, startX + totalW - 150, 566, {
             width: 150,
             align: 'right',
             lineBreak: false,
           });

        doc.page.margins.bottom = origBottom;
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ── Universal Standard Excel Report Generator (Multi-Sheet) ──────────────────
async function generateExcelBuffer(
  tasks: any[],
  allFollowUps: any[] = [],
  reportTitle: string,
  legacyAttachments: any[] = [],
  baseUrl: string = '',
  summaryMapParam?: Map<string, number>
): Promise<Buffer> {
  const summaryMap = summaryMapParam || new Map<string, number>();
  if (!summaryMapParam) {
    allFollowUps.forEach(fu => {
      const tId = fu.taskId ? fu.taskId.toString() : '';
      if (tId) summaryMap.set(tId, (summaryMap.get(tId) || 0) + 1);
    });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Task Management System';
  workbook.created = new Date();

  // SHEET 1: Tasks Register
  const sheet = workbook.addWorksheet('Tasks Register', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 4, topLeftCell: 'A5', activeCell: 'A5' }],
  });

  sheet.columns = [
    { header: 'Sr No', key: 'sr', width: 8 },
    { header: 'Title', key: 'title', width: 28 },
    { header: 'Description', key: 'description', width: 48 },
    { header: 'Given By', key: 'givenBy', width: 20 },
    { header: 'Priority', key: 'priority', width: 14 },
    { header: 'Work Status', key: 'workStatus', width: 16 },
    { header: 'Follow-ups', key: 'fUps', width: 13 },
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Due Date', key: 'dueDate', width: 14 },
    { header: 'Reason / Remarks', key: 'reasonRemarks', width: 42 },
  ];

  sheet.mergeCells('A1:J1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = reportTitle;
  titleCell.font = { bold: true, color: { argb: 'FF0F172A' }, size: 14, name: 'Calibri' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 28;

  const completed = tasks.filter(t => t.workStatus === 'Completed').length;
  const inProg = tasks.filter(t => t.workStatus === 'InProgress').length;
  const pending = tasks.filter(t => t.workStatus === 'Pending').length;

  sheet.mergeCells('A2:F2');
  const metaCell = sheet.getCell('A2');
  metaCell.value = `Generated: ${formatDateTimeStr(new Date())}   |   Total Tasks: ${tasks.length}   |   Name: Sushant Gupta`;
  metaCell.font = { italic: true, color: { argb: 'FF64748B' }, size: 9.5, name: 'Calibri' };
  metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
  metaCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  sheet.mergeCells('G2:J2');
  const statsCell = sheet.getCell('G2');
  statsCell.value = {
    richText: [
      { text: `Completed: ${completed}`, font: { bold: true, color: { argb: 'FF16A34A' }, size: 9.5, name: 'Calibri' } },
      { text: '   |   ', font: { color: { argb: 'FF94A3B8' }, size: 9.5, name: 'Calibri' } },
      { text: `In Progress: ${inProg}`, font: { bold: true, color: { argb: 'FF2563EB' }, size: 9.5, name: 'Calibri' } },
      { text: '   |   ', font: { color: { argb: 'FF94A3B8' }, size: 9.5, name: 'Calibri' } },
      { text: `Pending: ${pending}`, font: { bold: true, color: { argb: 'FFD97706' }, size: 9.5, name: 'Calibri' } },
    ],
  };
  statsCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
  statsCell.alignment = { vertical: 'middle', horizontal: 'right' };
  sheet.getRow(2).height = 22;

  sheet.getRow(3).height = 8;

  const headerRow = sheet.getRow(4);
  headerRow.values = ['Sr No', 'Title', 'Description', 'Given By', 'Priority', 'Work Status', 'Follow-ups', 'Date', 'Due Date', 'Reason / Remarks'];
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10.5, name: 'Calibri' };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF475569' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF475569' } },
      right: { style: 'thin', color: { argb: 'FF475569' } },
    };
  });

  tasks.forEach((task: any, idx: number) => {
    const remarkOrReason = formatTaskReasonAndRemarks(task);
    const rowBg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';

    const row = sheet.addRow({
      sr: idx + 1,
      title: task.title || '',
      description: task.description || '',
      givenBy: task.givenBy || '',
      priority: task.priority || '',
      workStatus: task.workStatus || '',
      fUps: summaryMap.get(task._id.toString()) || 0,
      date: formatDateStr(task.date),
      dueDate: task.dueDate ? formatDateStr(task.dueDate) : '—',
      reasonRemarks: remarkOrReason || '—',
    });

    const descLines = Math.max(1, Math.ceil((task.description || '').length / 44));
    const remarksLines = Math.max(1, Math.ceil((remarkOrReason || '').length / 38));
    const titleLines = Math.max(1, Math.ceil((task.title || '').length / 26));
    const maxLines = Math.max(descLines, remarksLines, titleLines);
    row.height = maxLines === 1 ? 22 : Math.min(160, Math.max(26, maxLines * 16));

    row.eachCell((cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
      cell.font = { color: { argb: 'FF1E293B' }, size: 10, name: 'Calibri' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };

      const isLeft = [2, 3, 4, 10].includes(colNumber);
      cell.alignment = { vertical: 'middle', horizontal: isLeft ? 'left' : 'center', wrapText: true };

      if (colNumber === 5 && PRIORITY_COLORS_ARGB[task.priority]) {
        cell.font = { color: { argb: PRIORITY_COLORS_ARGB[task.priority] }, bold: true, size: 10, name: 'Calibri' };
      }
      if (colNumber === 6 && STATUS_COLORS_ARGB[task.workStatus]) {
        cell.font = { color: { argb: STATUS_COLORS_ARGB[task.workStatus] }, bold: true, size: 10, name: 'Calibri' };
      }
    });
  });

  const lastRowIdx = sheet.rowCount + 2;
  sheet.mergeCells(`A${lastRowIdx}:J${lastRowIdx}`);
  const sheetFooter = sheet.getCell(`A${lastRowIdx}`);
  sheetFooter.value = `© ${new Date().getFullYear()} TasksManager by Sushant Gupta. All Rights Reserved.`;
  sheetFooter.font = { bold: true, color: { argb: 'FF2563EB' }, size: 9.5, name: 'Calibri' };
  sheetFooter.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  sheetFooter.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(lastRowIdx).height = 22;

  sheet.autoFilter = { from: 'A4', to: 'J4' };

  // SHEET 2: Follow-Ups Log
  if (allFollowUps.length > 0) {
    const fuSheet = workbook.addWorksheet('Follow-Ups Log', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
      views: [{ state: 'frozen', xSplit: 0, ySplit: 4, topLeftCell: 'A5', activeCell: 'A5' }],
    });

    fuSheet.columns = [
      { header: 'Sr No', key: 'sr', width: 8 },
      { header: 'Task Title', key: 'taskTitle', width: 28 },
      { header: 'Follow-Up #', key: 'fuNumber', width: 14 },
      { header: 'Date & Time', key: 'fuDate', width: 18 },
      { header: 'Method', key: 'method', width: 14 },
      { header: 'Contact Person', key: 'contactPerson', width: 18 },
      { header: 'Communication Details', key: 'communicated', width: 45 },
      { header: 'Response Received', key: 'response', width: 40 },
      { header: 'Next Action', key: 'nextAction', width: 28 },
      { header: 'Attachments / Links', key: 'attachments', width: 40 },
    ];

    fuSheet.mergeCells('A1:J1');
    const fuTitleCell = fuSheet.getCell('A1');
    fuTitleCell.value = `${reportTitle} — Follow-Up Audit Trail`;
    fuTitleCell.font = { bold: true, color: { argb: 'FF0F172A' }, size: 14, name: 'Calibri' };
    fuTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    fuTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    fuSheet.getRow(1).height = 28;

    fuSheet.mergeCells('A2:J2');
    const fuMetaCell = fuSheet.getCell('A2');
    fuMetaCell.value = `Generated on: ${formatDateTimeStr(new Date())}   |   Total Follow-Up Records: ${allFollowUps.length}   |   Name: Sushant Gupta`;
    fuMetaCell.font = { italic: true, color: { argb: 'FF64748B' }, size: 9.5, name: 'Calibri' };
    fuMetaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    fuMetaCell.alignment = { vertical: 'middle', horizontal: 'center' };
    fuSheet.getRow(2).height = 20;

    fuSheet.getRow(3).height = 8;

    const fuHeaderRow = fuSheet.getRow(4);
    fuHeaderRow.values = ['Sr No', 'Task Title', 'Follow-Up #', 'Date & Time', 'Method', 'Contact Person', 'Communication Details', 'Response Received', 'Next Action', 'Attachments / Links'];
    fuHeaderRow.height = 26;
    fuHeaderRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10.5, name: 'Calibri' };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF334155' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
        left: { style: 'thin', color: { argb: 'FF334155' } },
        right: { style: 'thin', color: { argb: 'FF334155' } },
      };
    });

    const sortedFollowUps: any[] = [];
    for (const task of tasks) {
      const taskFUs = allFollowUps.filter(fu => fu.taskId && fu.taskId.toString() === task._id.toString());
      taskFUs.sort((a, b) => (b.followUpNumber || 0) - (a.followUpNumber || 0));
      sortedFollowUps.push(...taskFUs);
    }
    const followUpsToRender = sortedFollowUps.length > 0 ? sortedFollowUps : allFollowUps;

    followUpsToRender.forEach((fu: any, idx: number) => {
      const parentTask = tasks.find(t => fu.taskId && t._id.toString() === fu.taskId.toString());
      const taskTitle = parentTask ? parentTask.title : '—';
      const methodStr = fu.method === 'Other' && fu.methodOther ? `Other (${fu.methodOther})` : (fu.method || 'General');

      const fLegacyAtts = legacyAttachments.filter((la: any) => la.followUpId && la.followUpId.toString() === fu._id.toString());
      const attLinks: { name: string; url: string }[] = [];
      if (fu.attachments && fu.attachments.length > 0) {
        fu.attachments.forEach((att: any) => {
          attLinks.push({ name: att.filename || 'File', url: att.url || '#' });
        });
      }
      if (fLegacyAtts.length > 0) {
        fLegacyAtts.forEach((att: any) => {
          const filename = att.originalName || 'File';
          const url = baseUrl ? `${baseUrl}/api/f/${att._id}/${encodeURIComponent(filename)}` : '#';
          attLinks.push({ name: filename, url });
        });
      }

      const attachmentsText = attLinks.length > 0
        ? attLinks.map(a => `${a.name}: ${a.url}`).join('\n')
        : 'None';

      const rowBg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';
      const row = fuSheet.addRow({
        sr: idx + 1,
        taskTitle,
        fuNumber: `#${fu.followUpNumber}`,
        fuDate: formatDateTimeStr(fu.followUpDate || fu.createdAt),
        method: methodStr,
        contactPerson: fu.contactPerson || '—',
        communicated: fu.communicated || '',
        response: fu.responseReceived || '—',
        nextAction: fu.nextAction ? `${fu.nextAction}${fu.nextFollowUpDate ? ` (${formatDateStr(fu.nextFollowUpDate)})` : ''}` : '—',
        attachments: attachmentsText,
      });

      const commLines = Math.max(1, Math.ceil((fu.communicated || '').length / 42));
      const respLines = Math.max(1, Math.ceil((fu.responseReceived || '').length / 38));
      const attLinesCount = Math.max(1, attLinks.length);
      const maxLines = Math.max(commLines, respLines, attLinesCount);
      row.height = maxLines === 1 ? 22 : Math.min(160, Math.max(26, maxLines * 16));

      row.eachCell((cell, colNumber) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
        cell.font = { color: { argb: 'FF1E293B' }, size: 10, name: 'Calibri' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };

        const isLeft = [2, 7, 8, 9, 10].includes(colNumber);
        cell.alignment = { vertical: 'middle', horizontal: isLeft ? 'left' : 'center', wrapText: true };

        if (colNumber === 10 && attLinks.length === 1) {
          cell.value = { text: attLinks[0].name, hyperlink: attLinks[0].url };
          cell.font = { color: { argb: 'FF2563EB' }, underline: true, size: 10, name: 'Calibri' };
        }
      });
    });

    const fuLastRowIdx = fuSheet.rowCount + 2;
    fuSheet.mergeCells(`A${fuLastRowIdx}:J${fuLastRowIdx}`);
    const fuSheetFooter = fuSheet.getCell(`A${fuLastRowIdx}`);
    fuSheetFooter.value = `© ${new Date().getFullYear()} TasksManager by Sushant Gupta. All Rights Reserved.`;
    fuSheetFooter.font = { bold: true, color: { argb: 'FF2563EB' }, size: 9.5, name: 'Calibri' };
    fuSheetFooter.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    fuSheetFooter.alignment = { horizontal: 'center', vertical: 'middle' };
    fuSheet.getRow(fuLastRowIdx).height = 22;

    fuSheet.autoFilter = { from: 'A4', to: 'J4' };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

// ── GET /api/export/pdf ───────────────────────────────────────────────────────
export async function exportPdf(req: Request, res: Response, next: NextFunction) {
  try {
    const { filter, sort } = buildQuery(req.query);

    if (req.query.hasFollowUps === 'true') {
      const distinctTaskIds = await FollowUp.distinct('taskId', { isDeleted: false });
      if (filter._id) {
        filter._id = { ...(filter._id as object), $in: distinctTaskIds };
      } else {
        filter._id = { $in: distinctTaskIds };
      }
    }

    if (req.query.ids && typeof req.query.ids === 'string') {
      const ids = req.query.ids.split(',').filter(Boolean);
      if (ids.length > 0) {
        filter._id = { $in: ids };
      }
    }

    const exportSort: Record<string, 1 | -1> = req.query.sort && typeof req.query.sort === 'string'
      ? { [req.query.sort]: req.query.order === 'asc' ? 1 : -1, taskId: -1, createdAt: -1, _id: -1 }
      : { taskId: -1, createdAt: -1, _id: -1 };

    const tasks = await Task.find(filter)
      .collation({ locale: 'en', numericOrdering: true })
      .sort(exportSort)
      .lean();
    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No tasks found for the selected export criteria. Please add a task before exporting.',
        code: 'NO_TASKS_FOUND',
      });
    }
    const taskIds = tasks.map(t => t._id);

    const summaries = await FollowUp.aggregate([
      { $match: { taskId: { $in: taskIds }, isDeleted: false } },
      { $group: { _id: '$taskId', count: { $sum: 1 } } }
    ]);
    const summaryMap = new Map(summaries.map(s => [s._id.toString(), s.count]));

    const allFollowUps = await FollowUp.find({ taskId: { $in: taskIds }, isDeleted: false })
      .sort({ followUpNumber: -1, createdAt: -1, followUpDate: -1 })
      .lean();
    const followUpIds = allFollowUps.map(fu => fu._id);
    const legacyAttachments = await FollowUpAttachment.find({ followUpId: { $in: followUpIds } }, { data: 0 }).lean();

    const reportTitle = getReportTitle(req.query, tasks);
    const reportFileName = getReportFileName(reportTitle, 'pdf');
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const pdfBuffer = await generatePdfBuffer(tasks, allFollowUps, reportTitle, legacyAttachments, baseUrl, summaryMap);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${reportFileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

// ── GET /api/export/excel ─────────────────────────────────────────────────────
export async function exportExcel(req: Request, res: Response, next: NextFunction) {
  try {
    const { filter, sort } = buildQuery(req.query);

    if (req.query.hasFollowUps === 'true') {
      const distinctTaskIds = await FollowUp.distinct('taskId', { isDeleted: false });
      if (filter._id) {
        filter._id = { ...(filter._id as object), $in: distinctTaskIds };
      } else {
        filter._id = { $in: distinctTaskIds };
      }
    }

    if (req.query.ids && typeof req.query.ids === 'string') {
      const ids = req.query.ids.split(',').filter(Boolean);
      if (ids.length > 0) {
        filter._id = { $in: ids };
      }
    }

    const exportSort: Record<string, 1 | -1> = req.query.sort && typeof req.query.sort === 'string'
      ? { [req.query.sort]: req.query.order === 'asc' ? 1 : -1, taskId: -1, createdAt: -1, _id: -1 }
      : { taskId: -1, createdAt: -1, _id: -1 };

    const tasks = await Task.find(filter)
      .collation({ locale: 'en', numericOrdering: true })
      .sort(exportSort)
      .lean();
    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No tasks found for the selected export criteria. Please add a task before exporting.',
        code: 'NO_TASKS_FOUND',
      });
    }
    const taskIds = tasks.map(t => t._id);

    const summaries = await FollowUp.aggregate([
      { $match: { taskId: { $in: taskIds }, isDeleted: false } },
      { $group: { _id: '$taskId', count: { $sum: 1 } } }
    ]);
    const summaryMap = new Map(summaries.map(s => [s._id.toString(), s.count]));

    const allFollowUps = await FollowUp.find({ taskId: { $in: taskIds }, isDeleted: false })
      .sort({ followUpNumber: -1, createdAt: -1, followUpDate: -1 })
      .lean();
    const followUpIds = allFollowUps.map(fu => fu._id);
    const legacyAttachments = await FollowUpAttachment.find({ followUpId: { $in: followUpIds } }, { data: 0 }).lean();

    const reportTitle = getReportTitle(req.query, tasks);
    const reportFileName = getReportFileName(reportTitle, 'xlsx');
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const excelBuffer = await generateExcelBuffer(tasks, allFollowUps, reportTitle, legacyAttachments, baseUrl, summaryMap);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${reportFileName}"`);
    res.setHeader('Content-Length', excelBuffer.length.toString());
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(excelBuffer);
  } catch (err) {
    next(err);
  }
}

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface ExportWeekData {
  index: number;
  start: Date;
  end: Date;
}

function getExportWeeksInMonth(year: number, month: number): ExportWeekData[] {
  const weeks: ExportWeekData[] = [];
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  let current = new Date(firstDay);
  let weekIndex = 1;

  while (current <= lastDay) {
    const weekStart = new Date(current);
    const weekDays: Date[] = [];
    while (current <= lastDay) {
      weekDays.push(new Date(current));
      if (current.getDay() === 0) {
        current.setDate(current.getDate() + 1);
        break;
      }
      current.setDate(current.getDate() + 1);
    }
    weeks.push({
      index: weekIndex++,
      start: weekDays[0],
      end: weekDays[weekDays.length - 1],
    });
  }
  return weeks;
}

function sanitizeZipEntryName(name: string): string {
  return (name || 'file')
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── GET /api/export/zip ───────────────────────────────────────────────────────
export async function exportZip(req: Request, res: Response, next: NextFunction) {
  try {
    const { filter, sort } = buildQuery(req.query);

    if (req.query.hasFollowUps === 'true') {
      const distinctTaskIds = await FollowUp.distinct('taskId', { isDeleted: false });
      if (filter._id) {
        filter._id = { ...(filter._id as object), $in: distinctTaskIds };
      } else {
        filter._id = { $in: distinctTaskIds };
      }
    }

    if (req.query.ids && typeof req.query.ids === 'string') {
      const ids = req.query.ids.split(',').filter(Boolean);
      if (ids.length > 0) {
        filter._id = { $in: ids };
      }
    }

    const exportSort: Record<string, 1 | -1> = req.query.sort && typeof req.query.sort === 'string'
      ? { [req.query.sort]: req.query.order === 'asc' ? 1 : -1, taskId: -1, createdAt: -1, _id: -1 }
      : { taskId: -1, createdAt: -1, _id: -1 };

    const tasks = await Task.find(filter)
      .collation({ locale: 'en', numericOrdering: true })
      .sort(exportSort)
      .lean();
    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No tasks found for the selected export criteria. Please add a task before exporting.',
        code: 'NO_TASKS_FOUND',
      });
    }
    const taskIds = tasks.map(t => t._id);

    const summaries = await FollowUp.aggregate([
      { $match: { taskId: { $in: taskIds }, isDeleted: false } },
      { $group: { _id: '$taskId', count: { $sum: 1 } } }
    ]);
    const summaryMap = new Map(summaries.map(s => [s._id.toString(), s.count]));

    const reportTitle = getReportTitle(req.query, tasks);
    const reportFileName = getReportFileName(reportTitle, 'zip');
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const allFollowUps = await FollowUp.find({ taskId: { $in: taskIds }, isDeleted: false })
      .sort({ followUpNumber: -1, createdAt: -1, followUpDate: -1 })
      .lean();
    const allFuIds = allFollowUps.map(fu => fu._id);
    const allLegacyAttachments = await FollowUpAttachment.find({ followUpId: { $in: allFuIds } }, { data: 0 }).lean();

    // 1. Prepare Zip Archiver in memory with safety buffer
    const archive = createZipArchive({ zlib: { level: 9 }, forceZip64: false });
    const chunks: Buffer[] = [];
    const archivePromise = new Promise<Buffer>((resolve, reject) => {
      archive.on('data', (chunk: Buffer) => chunks.push(chunk));
      archive.on('error', (err: any) => reject(err));
      archive.on('end', () => resolve(Buffer.concat(chunks)));
    });

    const isPanelExport = req.query.isPanel === 'true';

    // 2. Generate Clean Excel & PDF in memory and append to Zip Root
    const rootExcelBuffer = await generateExcelBuffer(tasks, allFollowUps, reportTitle, allLegacyAttachments, baseUrl, summaryMap);
    const excelInsideZip = getReportFileName(reportTitle, 'xlsx');
    archive.append(rootExcelBuffer, { name: excelInsideZip });

    const rootPdfBuffer = await generatePdfBuffer(tasks, allFollowUps, reportTitle, allLegacyAttachments, baseUrl, summaryMap);
    const pdfInsideZip = getReportFileName(reportTitle, 'pdf');
    archive.append(rootPdfBuffer, { name: pdfInsideZip });

    if (isPanelExport) {
      // ── RESTORED OLD HISTORY EXPORT LOGIC: Direct Attachments Folder for Task History ──
      for (let tIdx = 0; tIdx < tasks.length; tIdx++) {
        const task = tasks[tIdx];
        const taskFUs = allFollowUps.filter(fu => fu.taskId.toString() === task._id.toString());
        if (taskFUs.length === 0) continue;
        taskFUs.sort((a, b) => (b.followUpNumber || 0) - (a.followUpNumber || 0));

        const safeTitle = (task.title || 'Task').replace(/[^a-zA-Z0-9_\- ]/g, '').trim().slice(0, 30);
        const folderPrefix = `Attachments/Task_${tIdx + 1}_${safeTitle}`;

        for (const fu of taskFUs) {
          const folderName = `${folderPrefix}/FollowUp_${fu.followUpNumber}`;

          // Legacy Attachments (MongoDB)
          const legacyAtts = await FollowUpAttachment.find({ followUpId: fu._id }).lean();
          for (const lAtt of legacyAtts) {
            if (lAtt.data) {
              try {
                const buf = Buffer.isBuffer(lAtt.data)
                  ? lAtt.data
                  : (lAtt.data as any).buffer
                  ? Buffer.from((lAtt.data as any).buffer)
                  : Buffer.from(lAtt.data as any);
                const safeName = sanitizeZipEntryName(lAtt.originalName || 'attachment');
                archive.append(buf, { name: `${folderName}/${safeName}` });
              } catch (err) {
                console.error(`Failed to append attachment ${lAtt.originalName} to zip:`, err);
              }
            }
          }

          // Cloudinary Attachments
          if (fu.attachments && fu.attachments.length > 0) {
            for (const cAtt of fu.attachments) {
              if (cAtt.url) {
                try {
                  const response = await fetch(cAtt.url);
                  if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    const safeName = sanitizeZipEntryName(cAtt.filename || 'attachment');
                    archive.append(Buffer.from(arrayBuffer), { name: `${folderName}/${safeName}` });
                  }
                } catch (e) {
                  console.error(`Failed to fetch Cloudinary attachment: ${cAtt.url}`, e);
                }
              }
            }
          }
        }
      }
    } else {
      // ── MAIN WORKSPACE EXPORT: ORGANIZED CALENDAR HIERARCHY (Month -> Week -> Date -> Follow-ups) ──
      // Month [Folder] -> Week [Folder] -> Date [Folder]
      //   |- Date Folder contains:
      //      - Consolidated PDF (all follow-ups)
      //      - Consolidated Excel (all follow-ups)
      //      - Follow-up N [Folder]
      //          |- Attachment [Folder]
      //          |- pdf file (exact same standard styling)
      //          |- excelsheet file (exact same standard styling)
      for (let tIdx = 0; tIdx < tasks.length; tIdx++) {
        const task = tasks[tIdx];
        const taskFUs = allFollowUps.filter(fu => fu.taskId.toString() === task._id.toString());
        if (taskFUs.length === 0) continue;

      // Ensure follow-ups are ordered newest-first (#5, #4, #3...)
      taskFUs.sort((a, b) => (b.followUpNumber || 0) - (a.followUpNumber || 0));

      const d = task.date ? new Date(task.date) : (task.createdAt ? new Date(task.createdAt) : new Date());
      const year = isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
      const month = isNaN(d.getTime()) ? (new Date().getMonth() + 1) : (d.getMonth() + 1);
      const monthFolderName = MONTH_NAMES_SHORT[month - 1] || 'Month';

      const weeks = getExportWeeksInMonth(year, month);
      const taskTime = new Date(year, month - 1, isNaN(d.getDate()) ? 1 : d.getDate()).getTime();
      const weekObj = weeks.find(w => {
        const s = new Date(w.start.getFullYear(), w.start.getMonth(), w.start.getDate()).getTime();
        const e = new Date(w.end.getFullYear(), w.end.getMonth(), w.end.getDate()).getTime();
        return taskTime >= s && taskTime <= e;
      }) || weeks[0] || { index: 1, start: new Date(year, month - 1, 1), end: new Date(year, month - 1, 7) };

      const weekFolderName = `Week ${weekObj.index} [${formatDateStr(weekObj.start)} to ${formatDateStr(weekObj.end)}]`;
      const dateFolderName = `Date ${formatDateStr(d)}`;

      // Check if multiple tasks share this exact date
      const tasksOnSameDate = tasks.filter(t => formatDateStr(t.date) === formatDateStr(d));
      const taskPrefix = tasksOnSameDate.length > 1
        ? `${monthFolderName}/${weekFolderName}/${dateFolderName}/Task_${task.taskId}`
        : `${monthFolderName}/${weekFolderName}/${dateFolderName}`;

      // ── Date-Level Consolidated PDF & Excel (Contains ALL follow-ups for this task/date) ──
      try {
        const taskFuIds = taskFUs.map(f => f._id);
        const taskLegacyAtts = allLegacyAttachments.filter((la: any) =>
          taskFuIds.some(fId => fId.toString() === la.followUpId.toString())
        );
        const dateReportTitle = `Task Follow-Up Audit — ${task.title || 'Task'}`;

        const datePdfBuffer = await generatePdfBuffer([task], taskFUs, dateReportTitle, taskLegacyAtts, baseUrl);
        const dateExcelBuffer = await generateExcelBuffer([task], taskFUs, dateReportTitle, taskLegacyAtts, baseUrl);

        const datePdfName = tasksOnSameDate.length > 1
          ? `${taskPrefix}/Task_${task.taskId}_Follow-Up_Audit.pdf`
          : `${taskPrefix}/Task_Follow-Up_Audit.pdf`;
        const dateExcelName = tasksOnSameDate.length > 1
          ? `${taskPrefix}/Task_${task.taskId}_Follow-Up_Audit.xlsx`
          : `${taskPrefix}/Task_Follow-Up_Audit.xlsx`;

        archive.append(datePdfBuffer, { name: datePdfName });
        archive.append(dateExcelBuffer, { name: dateExcelName });
      } catch (err) {
        console.error(`Failed to generate date-level consolidated files for task ${task.taskId}:`, err);
      }

      // ── Individual Follow-Up Folders ──
      for (const fu of taskFUs) {
        const fuFolderName = `${taskPrefix}/Follow-up ${fu.followUpNumber}`;
        const fuLegacyAtts = allLegacyAttachments.filter((la: any) => la.followUpId.toString() === fu._id.toString());
        const fuReportTitle = `Task Follow-Up Audit — ${task.title || 'Task'} (#${fu.followUpNumber})`;

        // A. PDF File for this follow-up (Exact same standard layout & styling)
        try {
          const fuPdfBuffer = await generatePdfBuffer([task], [fu], fuReportTitle, fuLegacyAtts, baseUrl);
          archive.append(fuPdfBuffer, { name: `${fuFolderName}/Follow-up_${fu.followUpNumber}.pdf` });
        } catch (err) {
          console.error(`Failed to generate follow-up PDF for fu #${fu.followUpNumber}:`, err);
        }

        // B. Excel File for this follow-up (Exact same standard layout & styling)
        try {
          const fuExcelBuffer = await generateExcelBuffer([task], [fu], fuReportTitle, fuLegacyAtts, baseUrl);
          archive.append(fuExcelBuffer, { name: `${fuFolderName}/Follow-up_${fu.followUpNumber}.xlsx` });
        } catch (err) {
          console.error(`Failed to generate follow-up Excel for fu #${fu.followUpNumber}:`, err);
        }

        // C. Attachment Folder - explicitly create folder entry
        const attFolderName = `${fuFolderName}/Attachment`;
        archive.append(Buffer.alloc(0), { name: `${attFolderName}/` });

        // 1. Legacy Attachments (stored in MongoDB)
        const legacyAtts = await FollowUpAttachment.find({ followUpId: fu._id }).lean();
        for (const lAtt of legacyAtts) {
          if (lAtt.data) {
            try {
              const buf = Buffer.isBuffer(lAtt.data)
                ? lAtt.data
                : (lAtt.data as any).buffer
                ? Buffer.from((lAtt.data as any).buffer)
                : Buffer.from(lAtt.data as any);
              const safeName = sanitizeZipEntryName(lAtt.originalName || 'attachment');
              archive.append(buf, { name: `${attFolderName}/${safeName}` });
            } catch (err) {
              console.error(`Failed to append attachment ${lAtt.originalName} to zip:`, err);
            }
          }
        }

        // 2. Cloudinary Attachments
        if (fu.attachments && fu.attachments.length > 0) {
          for (const cAtt of fu.attachments) {
            if (cAtt.url) {
              try {
                const response = await fetch(cAtt.url);
                if (response.ok) {
                  const arrayBuffer = await response.arrayBuffer();
                  const safeName = sanitizeZipEntryName(cAtt.filename || 'attachment');
                  archive.append(Buffer.from(arrayBuffer), { name: `${attFolderName}/${safeName}` });
                }
              } catch (e) {
                console.error(`Failed to fetch Cloudinary attachment: ${cAtt.url}`, e);
              }
            }
          }
        }
      }
    }
  }

    await archive.finalize();
    const zipBuffer = await archivePromise;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${reportFileName}"`);
    res.setHeader('Content-Length', zipBuffer.length.toString());
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(zipBuffer);
  } catch (err) {
    next(err);
  }
}
