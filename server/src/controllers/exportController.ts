import { Request, Response, NextFunction } from 'express';
import Task from '../models/Task';
import FollowUp from '../models/FollowUp';
import { buildQuery } from '../utils/buildQuery';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import FollowUpAttachment from '../models/FollowUpAttachment';
const archiver = require('archiver');

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

// ── GET /api/export/pdf ───────────────────────────────────────────────────────
export async function exportPdf(req: Request, res: Response, next: NextFunction) {
  try {
    const { filter, sort } = buildQuery(req.query);

    // If specific IDs are requested (selection export)
    if (req.query.ids && typeof req.query.ids === 'string') {
      const ids = req.query.ids.split(',').filter(Boolean);
      if (ids.length > 0) {
        filter._id = { $in: ids };
      }
    }

    // Always export latest data first (newest dates and latest created tasks at top)
    const exportSort: Record<string, 1 | -1> = req.query.sort && typeof req.query.sort === 'string'
      ? { [req.query.sort]: req.query.order === 'asc' ? 1 : -1, createdAt: -1, _id: -1 }
      : { date: -1, createdAt: -1, _id: -1 };

    const tasks = await Task.find(filter).sort(exportSort).lean();
    const taskIds = tasks.map(t => t._id);

    const summaries = await FollowUp.aggregate([
      { $match: { taskId: { $in: taskIds }, isDeleted: false } },
      { $group: { _id: '$taskId', count: { $sum: 1 } } }
    ]);
    const summaryMap = new Map(summaries.map(s => [s._id.toString(), s.count]));

    const allFollowUps = await FollowUp.find({ taskId: { $in: taskIds }, isDeleted: false }).sort({ followUpDate: 1 }).lean();
    const followUpIds = allFollowUps.map(fu => fu._id);
    const legacyAttachments = await FollowUpAttachment.find({ followUpId: { $in: followUpIds } }, { data: 0 }).lean();

    // A4 Landscape geometry: 841.89 pt x 595.28 pt
    const doc = new PDFDocument({
      margin: 30,
      size: 'A4',
      layout: 'landscape',
      bufferPages: true,
      autoFirstPage: true
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="tasks-export.pdf"');
    doc.pipe(res);

    // ── Table Column Definitions (Total: 776 pt) ─────────────────────────────
    // Centered horizontally: (841.89 - 776) / 2 = 32.94 pt -> startX = 33
    const colWidths = [26, 112, 178, 78, 48, 60, 34, 58, 58, 124];
    const headers = ['Sr.', 'Title', 'Description', 'Given By', 'Priority', 'Status', 'F-Ups', 'Date', 'Due Date', 'Reason / Remarks'];
    const colAligns: ('left' | 'center')[] = ['center', 'left', 'left', 'left', 'center', 'center', 'center', 'center', 'center', 'left'];
    const totalW = colWidths.reduce((a, b) => a + b, 0); // 776 pt
    const startX = 33;
    const maxPageY = 545; // Leaves space for footer line at 560 and text at 566

    // Helper: Draw table column header with vertical column borders
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

    // Helper: Draw report header (First page vs Subsequent pages)
    function drawReportHeader(isFirstPage: boolean): number {
      const todayStr = formatDateStr(new Date());

      if (isFirstPage) {
        // Executive Header Banner - Centered, Clean & Professional
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#0F172A')
           .text(`Today Tasks [${todayStr}]`, startX, 22, {
             width: totalW,
             align: 'center',
             lineBreak: false,
           });

        const completed = tasks.filter(t => t.workStatus === 'Completed').length;
        const inProg = tasks.filter(t => t.workStatus === 'InProgress').length;
        const pending = tasks.filter(t => t.workStatus === 'Pending').length;

        // Subtitle line (Y = 44)
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

        // Thin accent divider
        doc.moveTo(startX, 58).lineTo(startX + totalW, 58).strokeColor('#CBD5E1').lineWidth(0.75).stroke();

        return drawTableHeader(66);
      } else {
        // Minimal Running Header on Subsequent Pages - Centered & Clean
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#0F172A')
           .text(`Today Tasks [${todayStr}]`, startX, 26, {
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

    // ── Render Data Rows ──────────────────────────────────────────────────────
    let rowY = drawReportHeader(true);

    tasks.forEach((task: any, idx: number) => {
      const remarkOrReason = task.workStatus === 'Completed' ? task.remarks : task.reason;
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

      // Calculate dynamic row height needed so NO text is clipped or overflows
      let maxContentH = 11;
      cells.forEach((text, i) => {
        if (!text || text === '—') return;
        const colW = colWidths[i];
        const isBold = i === 1 || i === 4 || i === 5;
        doc.fontSize(8.5).font(isBold ? 'Helvetica-Bold' : 'Helvetica');
        const h = doc.heightOfString(text, { width: colW - 8, lineGap: 1.8 });
        if (h > maxContentH) maxContentH = h;
      });

      const rowH = Math.max(20, Math.ceil(maxContentH + 10)); // Padding top & bottom

      // Check for page break before drawing row
      if (rowY + rowH > maxPageY) {
        doc.addPage();
        rowY = drawReportHeader(false);
      }

      // Zebra striping background
      const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      doc.rect(startX, rowY, totalW, rowH).fill(rowBg);

      // Vertical column divider lines
      let vX = startX;
      colWidths.forEach((colW, i) => {
        if (i > 0) {
          doc.moveTo(vX, rowY).lineTo(vX, rowY + rowH).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
        }
        vX += colW;
      });

      // Outer row border
      doc.rect(startX, rowY, totalW, rowH).strokeColor('#E2E8F0').lineWidth(0.5).stroke();

      // Render cell text with vertical middle alignment
      let cellX = startX;
      cells.forEach((text, i) => {
        const colW = colWidths[i];
        let cellColor = '#1E293B';
        let isBold = false;

        if (i === 1) {
          cellColor = '#0F172A';
          isBold = true;
        } else if (i === 4) {
          cellColor = PRIORITY_COLORS_HEX[task.priority] || '#1E293B';
          isBold = true;
        } else if (i === 5) {
          cellColor = STATUS_COLORS_HEX[task.workStatus] || '#1E293B';
          isBold = true;
        } else {
          cellColor = '#334155';
        }

        // Calculate vertical middle position
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

    // ── Single-Task Detailed Follow-Up Section (If Exported from Panel) ───────
    if (tasks.length === 1 && allFollowUps.length > 0) {
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

      allFollowUps.forEach((fu: any, i: number) => {
        const fuDateStr = formatDateTimeStr(fu.followUpDate);
        const methodStr = fu.method === 'Other' && fu.methodOther ? `Other (${fu.methodOther})` : fu.method;
        const contactStr = fu.contactPerson ? `   |   Contact: ${fu.contactPerson}` : '';

        const commText = `Communicated: ${fu.communicated || 'None'}`;
        const respText = fu.responseReceived ? `Response: ${fu.responseReceived}` : '';
        const nextActionText = fu.nextAction ? `Next Action: ${fu.nextAction}${fu.nextFollowUpDate ? ` (Target: ${formatDateStr(fu.nextFollowUpDate)})` : ''}` : '';

        // Calculate card height dynamically
        doc.fontSize(8.5).font('Helvetica');
        let cardH = 24; // Header
        cardH += doc.heightOfString(commText, { width: totalW - 20, lineGap: 1.8 }) + 4;
        if (respText) {
          cardH += doc.heightOfString(respText, { width: totalW - 20, lineGap: 1.8 }) + 4;
        }
        if (nextActionText) {
          cardH += doc.heightOfString(nextActionText, { width: totalW - 20, lineGap: 1.8 }) + 4;
        }

        const fLegacyAtts = legacyAttachments.filter((la: any) => la.followUpId.toString() === fu._id.toString());
        const hasCloudinary = fu.attachments && fu.attachments.length > 0;
        const hasAtts = hasCloudinary || fLegacyAtts.length > 0;
        if (hasAtts) {
          cardH += 20;
        }
        cardH += 10; // Card bottom padding

        if (rowY + cardH > maxPageY) {
          doc.addPage();
          rowY = 32;
        }

        // Draw card background & border
        doc.roundedRect(startX, rowY, totalW, cardH, 4).fillAndStroke('#F8FAFC', '#E2E8F0');

        let innerY = rowY + 6;
        // Follow-up card header
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#1E293B')
           .text(`#${i + 1}   |   ${fuDateStr}   |   Method: ${methodStr}${contactStr}`, startX + 10, innerY);
        innerY += 15;

        // Communicated
        doc.fontSize(8.5).font('Helvetica').fillColor('#334155')
           .text(commText, startX + 10, innerY, { width: totalW - 20, lineGap: 1.8 });
        innerY += doc.heightOfString(commText, { width: totalW - 20, lineGap: 1.8 }) + 4;

        // Response
        if (respText) {
          doc.fillColor('#047857')
             .text(respText, startX + 10, innerY, { width: totalW - 20, lineGap: 1.8 });
          innerY += doc.heightOfString(respText, { width: totalW - 20, lineGap: 1.8 }) + 4;
        }

        // Next Action
        if (nextActionText) {
          doc.fillColor('#6D28D9')
             .text(nextActionText, startX + 10, innerY, { width: totalW - 20, lineGap: 1.8 });
          innerY += doc.heightOfString(nextActionText, { width: totalW - 20, lineGap: 1.8 }) + 4;
        }

        // Attachments
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
              const url = `${req.protocol}://${req.get('host')}/api/f/${att._id}/${encodeURIComponent(filename)}`;
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

    // ── Page Numbering & Footer on All Pages ─────────────────────────────────
    // Read total pages once, disable bottom margin during footer drawing to prevent ghost pages
    const totalPages = doc.bufferedPageRange().count;
    for (let p = 0; p < totalPages; p++) {
      doc.switchToPage(p);
      const origBottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;

      // Footer divider
      doc.moveTo(startX, 558)
         .lineTo(startX + totalW, 558)
         .strokeColor('#CBD5E1')
         .lineWidth(0.75)
         .stroke();

      // Styled colorful footer branding
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
    next(err);
  }
}

// ── GET /api/export/excel ─────────────────────────────────────────────────────
export async function exportExcel(req: Request, res: Response, next: NextFunction) {
  try {
    const { filter, sort } = buildQuery(req.query);

    if (req.query.ids && typeof req.query.ids === 'string') {
      const ids = req.query.ids.split(',').filter(Boolean);
      if (ids.length > 0) {
        filter._id = { $in: ids };
      }
    }

    // Always export latest data first (newest dates and latest created tasks at top)
    const exportSort: Record<string, 1 | -1> = req.query.sort && typeof req.query.sort === 'string'
      ? { [req.query.sort]: req.query.order === 'asc' ? 1 : -1, createdAt: -1, _id: -1 }
      : { date: -1, createdAt: -1, _id: -1 };

    const tasks = await Task.find(filter).sort(exportSort).lean();
    const taskIds = tasks.map(t => t._id);

    const summaries = await FollowUp.aggregate([
      { $match: { taskId: { $in: taskIds }, isDeleted: false } },
      { $group: { _id: '$taskId', count: { $sum: 1 } } }
    ]);
    const summaryMap = new Map(summaries.map(s => [s._id.toString(), s.count]));

    const allFollowUps = await FollowUp.find({ taskId: { $in: taskIds }, isDeleted: false }).sort({ followUpDate: 1 }).lean();
    const followUpIds = allFollowUps.map(fu => fu._id);
    const legacyAttachments = await FollowUpAttachment.find({ followUpId: { $in: followUpIds } }, { data: 0 }).lean();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Task Management System';
    workbook.created = new Date();

    // ─────────────────────────────────────────────────────────────────────────
    // SHEET 1: Tasks Register
    // ─────────────────────────────────────────────────────────────────────────
    const sheet = workbook.addWorksheet('Tasks Register', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
      views: [{ state: 'frozen', xSplit: 0, ySplit: 4, topLeftCell: 'A5', activeCell: 'A5' }],
    });

    // Clean, perfectly proportioned columns — Task ID is strictly removed!
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

    const todayStr = formatDateStr(new Date());

    // Row 1: Title Banner
    sheet.mergeCells('A1:J1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `Today Tasks [${todayStr}]`;
    titleCell.font = { bold: true, color: { argb: 'FF0F172A' }, size: 14, name: 'Calibri' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 28;

    // Row 2: Metadata Subtitle
    sheet.mergeCells('A2:J2');
    const metaCell = sheet.getCell('A2');
    metaCell.value = `Generated: ${formatDateTimeStr(new Date())}   |   Total Tasks: ${tasks.length}   |   Name: Sushant Gupta`;
    metaCell.font = { italic: true, color: { argb: 'FF64748B' }, size: 9.5, name: 'Calibri' };
    metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    metaCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(2).height = 20;

    // Row 3: Spacer
    sheet.getRow(3).height = 8;

    // Row 4: Column Headers
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

    // Rows 5+: Data Rows
    tasks.forEach((task: any, idx: number) => {
      const remarkOrReason = task.workStatus === 'Completed' ? task.remarks : task.reason;
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

      // Calculate dynamic row height so wrapped content is NEVER clipped or overlapping
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

        // Priority Color Formatting
        if (colNumber === 5) {
          const colour = PRIORITY_COLORS_ARGB[task.priority];
          if (colour) cell.font = { color: { argb: colour }, bold: true, size: 10, name: 'Calibri' };
        }
        // Status Color Formatting
        if (colNumber === 6) {
          const colour = STATUS_COLORS_ARGB[task.workStatus];
          if (colour) cell.font = { color: { argb: colour }, bold: true, size: 10, name: 'Calibri' };
        }
      });
    });

    // Copyright Footer at bottom of table
    const lastRowIdx = sheet.rowCount + 2;
    sheet.mergeCells(`A${lastRowIdx}:J${lastRowIdx}`);
    const sheetFooter = sheet.getCell(`A${lastRowIdx}`);
    sheetFooter.value = `© ${new Date().getFullYear()} TasksManager by Sushant Gupta. All Rights Reserved.`;
    sheetFooter.font = { bold: true, color: { argb: 'FF2563EB' }, size: 9.5, name: 'Calibri' };
    sheetFooter.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    sheetFooter.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(lastRowIdx).height = 22;

    // AutoFilter across table columns
    sheet.autoFilter = { from: 'A4', to: 'J4' };

    // ─────────────────────────────────────────────────────────────────────────
    // SHEET 2: Follow-Ups Audit Trail & Attachments (If Follow-Ups Exist)
    // ─────────────────────────────────────────────────────────────────────────
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

      // Row 1: Title Banner
      fuSheet.mergeCells('A1:J1');
      const fuTitleCell = fuSheet.getCell('A1');
      fuTitleCell.value = `Today Tasks [${todayStr}] — Follow-Up Audit Trail`;
      fuTitleCell.font = { bold: true, color: { argb: 'FF0F172A' }, size: 14, name: 'Calibri' };
      fuTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      fuTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      fuSheet.getRow(1).height = 28;

      // Row 2: Metadata Subtitle
      fuSheet.mergeCells('A2:J2');
      const fuMetaCell = fuSheet.getCell('A2');
      fuMetaCell.value = `Generated on: ${formatDateTimeStr(new Date())}   |   Total Follow-Up Records: ${allFollowUps.length}   |   Name: Sushant Gupta`;
      fuMetaCell.font = { italic: true, color: { argb: 'FF64748B' }, size: 9.5, name: 'Calibri' };
      fuMetaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      fuMetaCell.alignment = { vertical: 'middle', horizontal: 'center' };
      fuSheet.getRow(2).height = 20;

      // Row 3: Spacer
      fuSheet.getRow(3).height = 8;

      // Row 4: Column Headers
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

      // Data Rows
      allFollowUps.forEach((fu: any, idx: number) => {
        const parentTask = tasks.find(t => t._id.toString() === fu.taskId.toString());
        const taskTitle = parentTask ? parentTask.title : '—';
        const methodStr = fu.method === 'Other' && fu.methodOther ? `Other (${fu.methodOther})` : fu.method;

        // Collect attachment links
        const fLegacyAtts = legacyAttachments.filter((la: any) => la.followUpId.toString() === fu._id.toString());
        const attLinks: { name: string; url: string }[] = [];
        if (fu.attachments && fu.attachments.length > 0) {
          fu.attachments.forEach((att: any) => {
            attLinks.push({ name: att.filename || 'File', url: att.url || '#' });
          });
        }
        if (fLegacyAtts.length > 0) {
          fLegacyAtts.forEach((att: any) => {
            const filename = att.originalName || 'File';
            const url = `${req.protocol}://${req.get('host')}/api/f/${att._id}/${encodeURIComponent(filename)}`;
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
          fuDate: formatDateTimeStr(fu.followUpDate),
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

          // If single attachment, render as active clickable hyperlink in Excel
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

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="tasks-export.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}

// ── GET /api/export/zip ───────────────────────────────────────────────────────
export async function exportZip(req: Request, res: Response, next: NextFunction) {
  try {
    const { filter, sort } = buildQuery(req.query);

    if (req.query.ids && typeof req.query.ids === 'string') {
      const ids = req.query.ids.split(',').filter(Boolean);
      if (ids.length > 0) {
        filter._id = { $in: ids };
      }
    }

    // Always export latest data first (newest dates and latest created tasks at top)
    const exportSort: Record<string, 1 | -1> = req.query.sort && typeof req.query.sort === 'string'
      ? { [req.query.sort]: req.query.order === 'asc' ? 1 : -1, createdAt: -1, _id: -1 }
      : { date: -1, createdAt: -1, _id: -1 };

    const tasks = await Task.find(filter).sort(exportSort).lean();
    const taskIds = tasks.map(t => t._id);

    const summaries = await FollowUp.aggregate([
      { $match: { taskId: { $in: taskIds }, isDeleted: false } },
      { $group: { _id: '$taskId', count: { $sum: 1 } } }
    ]);
    const summaryMap = new Map(summaries.map(s => [s._id.toString(), s.count]));

    // 1. Prepare Zip Archiver
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="tasks-export.zip"');
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err: Error) => { throw err; });
    archive.pipe(res);

    // 2. Generate Clean Excel in memory (without Task ID) and append to Zip
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Task Management System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Tasks Register', {
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

    const todayStr = formatDateStr(new Date());

    sheet.mergeCells('A1:J1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `Today Tasks [${todayStr}]`;
    titleCell.font = { bold: true, color: { argb: 'FF0F172A' }, size: 14, name: 'Calibri' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 28;

    sheet.mergeCells('A2:J2');
    const metaCell = sheet.getCell('A2');
    metaCell.value = `Generated: ${formatDateTimeStr(new Date())}   |   Total Tasks: ${tasks.length}   |   Name: Sushant Gupta`;
    metaCell.font = { italic: true, color: { argb: 'FF64748B' }, size: 9.5, name: 'Calibri' };
    metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    metaCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(2).height = 20;

    sheet.getRow(3).height = 8;

    const headerRow = sheet.getRow(4);
    headerRow.values = ['Sr No', 'Title', 'Description', 'Given By', 'Priority', 'Work Status', 'Follow-ups', 'Date', 'Due Date', 'Reason / Remarks'];
    headerRow.height = 26;
    headerRow.eachCell((cell) => {
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

    tasks.forEach((task: any, idx: number) => {
      const remarkOrReason = task.workStatus === 'Completed' ? task.remarks : task.reason;
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
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
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

    const zipLastRowIdx = sheet.rowCount + 2;
    sheet.mergeCells(`A${zipLastRowIdx}:J${zipLastRowIdx}`);
    const zipSheetFooter = sheet.getCell(`A${zipLastRowIdx}`);
    zipSheetFooter.value = `© ${new Date().getFullYear()} TasksManager by Sushant Gupta. All Rights Reserved.`;
    zipSheetFooter.font = { bold: true, color: { argb: 'FF2563EB' }, size: 9.5, name: 'Calibri' };
    zipSheetFooter.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    zipSheetFooter.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(zipLastRowIdx).height = 22;

    sheet.autoFilter = { from: 'A4', to: 'J4' };

    const excelBuffer = await workbook.xlsx.writeBuffer();
    archive.append(Buffer.from(excelBuffer as ArrayBuffer), { name: 'Tasks_Report.xlsx' });

    // 3. Process and organize task attachments in ZIP
    const allFollowUps = await FollowUp.find({ taskId: { $in: taskIds }, isDeleted: false }).lean();

    for (let tIdx = 0; tIdx < tasks.length; tIdx++) {
      const task = tasks[tIdx];
      const taskFUs = allFollowUps.filter(fu => fu.taskId.toString() === task._id.toString());
      if (taskFUs.length === 0) continue;

      const safeTitle = (task.title || 'Task').replace(/[^a-zA-Z0-9_\- ]/g, '').trim().slice(0, 30);
      const folderPrefix = `Attachments/Task_${tIdx + 1}_${safeTitle}`;

      for (const fu of taskFUs) {
        const folderName = `${folderPrefix}/FollowUp_${fu.followUpNumber}`;

        // A. Legacy Attachments (stored in MongoDB)
        const legacyAtts = await FollowUpAttachment.find({ followUpId: fu._id }).lean();
        for (const lAtt of legacyAtts) {
          if (lAtt.data) {
            archive.append(lAtt.data, { name: `${folderName}/${lAtt.originalName}` });
          }
        }

        // B. Cloudinary Attachments
        if (fu.attachments && fu.attachments.length > 0) {
          for (const cAtt of fu.attachments) {
            if (cAtt.url) {
              try {
                const response = await fetch(cAtt.url);
                if (response.ok) {
                  const arrayBuffer = await response.arrayBuffer();
                  archive.append(Buffer.from(arrayBuffer), { name: `${folderName}/${cAtt.filename}` });
                }
              } catch (e) {
                console.error(`Failed to fetch Cloudinary attachment: ${cAtt.url}`, e);
              }
            }
          }
        }
      }
    }

    await archive.finalize();
  } catch (err) {
    next(err);
  }
}
