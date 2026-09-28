import { Request, Response, NextFunction } from 'express';
import Task from '../models/Task';
import FollowUp from '../models/FollowUp';
import { buildQuery } from '../utils/buildQuery';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import FollowUpAttachment from '../models/FollowUpAttachment';
const archiver = require('archiver');

const PRIORITY_COLOURS: Record<string, string> = {
  High: 'FF4444',
  Medium: 'F59E0B',
  Low: '22C55E',
};

const STATUS_COLOURS: Record<string, string> = {
  InProgress: '3B82F6',
  Pending: 'F59E0B',
  Completed: '22C55E',
};

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

    const tasks = await Task.find(filter).sort(sort).lean();
    const taskIds = tasks.map(t => t._id);

    const summaries = await FollowUp.aggregate([
      { $match: { taskId: { $in: taskIds }, isDeleted: false } },
      { $group: { _id: '$taskId', count: { $sum: 1 } } }
    ]);
    const summaryMap = new Map(summaries.map(s => [s._id.toString(), s.count]));

    const allFollowUps = await FollowUp.find({ taskId: { $in: taskIds }, isDeleted: false }).sort({ followUpDate: 1 }).lean();

    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="tasks-export.pdf"');
    doc.pipe(res);

    // ── Title ───────────────────────────────────────────────────────────────
    doc.fontSize(18).font('Helvetica-Bold').text('Task Manager Export', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(1.5);

    // ── Table header ────────────────────────────────────────────────────────
    const colWidths = [25, 60, 100, 100, 70, 50, 60, 40, 100, 135];
    const headers = ['Sr', 'Task ID', 'Title', 'Description', 'Given By', 'Priority', 'Status', 'F-Ups', 'Reason', 'Follow-Ups History'];
    const startX = doc.page.margins.left;
    let x = startX;
    const headerY = doc.y;
    const rowH = 20;

    doc.rect(startX, headerY, colWidths.reduce((a, b) => a + b, 0), rowH).fill('#1E293B');
    doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
    headers.forEach((h, i) => {
      doc.text(h, x + 3, headerY + 5, { width: colWidths[i] - 6, ellipsis: true });
      x += colWidths[i];
    });

    // ── Table rows ───────────────────────────────────────────────────────────
    let rowY = headerY + rowH;
    tasks.forEach((task: any, idx: number) => {
      if (rowY > doc.page.height - doc.page.margins.bottom - rowH) {
        doc.addPage();
        rowY = doc.page.margins.top;
      }

      const bg = idx % 2 === 0 ? '#0F172A' : '#1E293B';
      const totalW = colWidths.reduce((a, b) => a + b, 0);
      doc.rect(startX, rowY, totalW, rowH).fill(bg);

      const remarkOrReason =
        task.workStatus === 'Completed' ? task.remarks : task.reason;

      let fuHistory = '';
      const taskFUs = allFollowUps.filter(fu => fu.taskId.toString() === task._id.toString());
      taskFUs.forEach((fu, i) => {
        fuHistory += `#${i + 1} (${new Date(fu.followUpDate).toLocaleDateString('en-IN')}): ${fu.communicated} -> ${fu.responseReceived}\n`;
        if (fu.attachments && fu.attachments.length > 0) {
          fu.attachments.forEach(att => {
            const filename = att.filename || att.originalName || 'File';
            const url = att.url || `${req.protocol}://${req.get('host')}/api/f/${att._id}/${encodeURIComponent(filename)}`;
            fuHistory += `Link: ${url}\n`;
          });
        }
      });

      const cells = [
        String(idx + 1),
        task.taskId,
        task.title,
        task.description,
        task.givenBy,
        task.priority,
        task.workStatus,
        String(summaryMap.get(task._id.toString()) || 0),
        remarkOrReason,
        fuHistory.trim().replace(/\n/g, '  |  ')
      ];

      x = startX;
      doc.fillColor('#E2E8F0').font('Helvetica').fontSize(7);
      cells.forEach((cell, i) => {
        // Colour priority and status cells
        if (i === 5) {
          doc.fillColor(`#${PRIORITY_COLOURS[task.priority] || 'E2E8F0'}`);
        } else if (i === 6) {
          doc.fillColor(`#${STATUS_COLOURS[task.workStatus] || 'E2E8F0'}`);
        } else {
          doc.fillColor('#E2E8F0');
        }
        doc.text(cell || '', x + 3, rowY + 5, { width: colWidths[i] - 6, ellipsis: true });
        x += colWidths[i];
      });

      rowY += rowH;
    });

    // If exporting a single task, append full details of follow-ups below the table
    if (tasks.length === 1 && allFollowUps.length > 0) {
      doc.moveDown(2);
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000').text('Detailed Follow-Up History & Attachments');
      doc.moveDown(0.5);
      
      allFollowUps.forEach((fu, i) => {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333')
           .text(`#${i + 1} - ${new Date(fu.followUpDate).toLocaleString('en-IN')} - ${fu.method}`);
        doc.fontSize(9).font('Helvetica').fillColor('#555555')
           .text(`Communicated: ${fu.communicated}`);
        if (fu.responseReceived) {
          doc.text(`Response: ${fu.responseReceived}`);
        }
        if (fu.attachments && fu.attachments.length > 0) {
          doc.moveDown(0.2);
          doc.font('Helvetica-Bold').text('Attachments:');
          doc.font('Helvetica').fillColor('#0066cc');
          fu.attachments.forEach(att => {
            const filename = att.filename || att.originalName || 'File';
            const url = att.url || `${req.protocol}://${req.get('host')}/api/f/${att._id}/${encodeURIComponent(filename)}`;
            doc.text(`${filename}: ${url}`, { link: url, underline: true });
          });
        }
        doc.moveDown(1);
      });
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

    const tasks = await Task.find(filter).sort(sort).lean();
    const taskIds = tasks.map(t => t._id);

    const summaries = await FollowUp.aggregate([
      { $match: { taskId: { $in: taskIds }, isDeleted: false } },
      { $group: { _id: '$taskId', count: { $sum: 1 } } }
    ]);
    const summaryMap = new Map(summaries.map(s => [s._id.toString(), s.count]));

    const allFollowUps = await FollowUp.find({ taskId: { $in: taskIds }, isDeleted: false }).sort({ followUpDate: 1 }).lean();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Task Manager';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Tasks', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    sheet.columns = [
      { header: 'Sr No', key: 'sr', width: 6 },
      { header: 'Task ID', key: 'taskId', width: 12 },
      { header: 'Title', key: 'title', width: 25 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Given By', key: 'givenBy', width: 15 },
      { header: 'Priority', key: 'priority', width: 10 },
      { header: 'Work Status', key: 'workStatus', width: 14 },
      { header: 'F-Ups', key: 'fUps', width: 8 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Due Date', key: 'dueDate', width: 12 },
      { header: 'Reason / Remarks', key: 'reasonRemarks', width: 35 },
      { header: 'Follow-Ups History', key: 'followUpsHistory', width: 60 },
    ];

    // ── Style header row ──────────────────────────────────────────────────────
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FF334155' } },
      };
    });
    headerRow.height = 24;

    // ── Data rows ─────────────────────────────────────────────────────────────
    tasks.forEach((task: any, idx: number) => {
      const rowBg = idx % 2 === 0 ? 'FF0F172A' : 'FF1E293B';
      const row = sheet.addRow({
        sr: idx + 1,
        taskId: task.taskId,
        title: task.title,
        description: task.description,
        givenBy: task.givenBy,
        priority: task.priority,
        workStatus: task.workStatus,
        fUps: summaryMap.get(task._id.toString()) || 0,
        date: task.date ? new Date(task.date).toLocaleDateString('en-IN') : '',
        dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-IN') : '',
        reasonRemarks: task.workStatus === 'Completed' ? task.remarks : task.reason,
      });

      let fuHistory = '';
      const taskFUs = allFollowUps.filter(fu => fu.taskId.toString() === task._id.toString());
      taskFUs.forEach((fu, i) => {
        fuHistory += `#${i + 1} (${new Date(fu.followUpDate).toLocaleDateString('en-IN')}): ${fu.communicated} -> ${fu.responseReceived}\n`;
        if (fu.attachments && fu.attachments.length > 0) {
          fu.attachments.forEach(att => {
            const filename = att.filename || att.originalName || 'File';
            const url = att.url || `${req.protocol}://${req.get('host')}/api/f/${att._id}/${encodeURIComponent(filename)}`;
            fuHistory += `Link: ${url}\n`;
          });
        }
        fuHistory += '\n';
      });
      row.getCell('followUpsHistory').value = fuHistory.trim();

      row.height = 20;
      row.eachCell((cell, colNumber) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
        cell.font = { color: { argb: 'FFE2E8F0' }, size: 10 };
        cell.alignment = { vertical: 'middle', wrapText: true };

        // Priority colour
        if (colNumber === 6) {
          const colour = PRIORITY_COLOURS[task.priority];
          if (colour) cell.font = { color: { argb: `FF${colour}` }, bold: true, size: 10 };
        }
        // Status colour
        if (colNumber === 7) {
          const colour = STATUS_COLOURS[task.workStatus];
          if (colour) cell.font = { color: { argb: `FF${colour}` }, bold: true, size: 10 };
        }
      });
    });

    // ── Auto-filter ───────────────────────────────────────────────────────────
    sheet.autoFilter = { from: 'A1', to: `L1` };

    // ── Freeze header ─────────────────────────────────────────────────────────
    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1, topLeftCell: 'A2', activeCell: 'A2' }];

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

    const tasks = await Task.find(filter).sort(sort).lean();
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

    // 2. Generate Excel in memory and append to Zip
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Tasks');
    sheet.columns = [
      { header: 'Task ID', key: 'taskId', width: 12 },
      { header: 'Title', key: 'title', width: 25 },
      { header: 'Work Status', key: 'workStatus', width: 14 },
      { header: 'Priority', key: 'priority', width: 10 },
      { header: 'Given By', key: 'givenBy', width: 15 },
      { header: 'F-Ups', key: 'fUps', width: 8 },
      { header: 'Date', key: 'date', width: 12 },
    ];
    tasks.forEach((task: any) => {
      sheet.addRow({
        taskId: task.taskId,
        title: task.title,
        workStatus: task.workStatus,
        priority: task.priority,
        givenBy: task.givenBy,
        fUps: summaryMap.get(task._id.toString()) || 0,
        date: task.date ? new Date(task.date).toLocaleDateString('en-IN') : '',
      });
    });
    
    const excelBuffer = await workbook.xlsx.writeBuffer();
    archive.append(Buffer.from(excelBuffer as ArrayBuffer), { name: 'Tasks_Report.xlsx' });

    // 3. Process attachments
    // Fetch all follow-ups for these tasks
    const allFollowUps = await FollowUp.find({ taskId: { $in: taskIds }, isDeleted: false }).lean();

    for (const task of tasks) {
      const taskFUs = allFollowUps.filter(fu => fu.taskId.toString() === task._id.toString());
      if (taskFUs.length === 0) continue;

      for (const fu of taskFUs) {
        const folderName = `Attachments/${task.taskId}/FollowUp_${fu.followUpNumber}`;

        // A. Legacy Attachments (stored in FollowUpAttachment MongoDB collection)
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
