import nodemailer from 'nodemailer';
import { ITask } from '../models/Task';
import { IFollowUp } from '../models/FollowUp';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.ethereal.email';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@tasksmanager.com';

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export async function sendEscalationEmail(task: any, followUpCount: number, settings: any, followUps: any[]) {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('⚠️ SMTP credentials not configured. Skipping escalation email.');
    return;
  }

  const { managerEmail, hodEmail, dyhodEmail, ccEmail, threshold } = settings;
  let toEmails = [managerEmail, hodEmail, dyhodEmail].filter(Boolean).join(', ');
  let resolvedCc = ccEmail ? ccEmail : undefined;

  // Fallback: If no primary recipients (Manager, HOD, DyHOD) are filled, but CC is provided, use CC as recipient
  if (!toEmails && ccEmail) {
    toEmails = ccEmail;
    resolvedCc = undefined;
  }
  
  if (!toEmails) {
    console.warn('⚠️ No recipients (Manager, HOD, DyHOD, or CC) configured for escalation emails.');
    return;
  }

  const subject = `Action Required: Task Escalation - ${task.title}`;
  
  // Format the follow-ups timeline: strictly newest-first (latest follow-up at top)
  const sortedFollowUps = [...followUps].sort((a, b) => {
    const timeA = new Date(a.followUpDate || a.createdAt || 0).getTime();
    const timeB = new Date(b.followUpDate || b.createdAt || 0).getTime();
    if (timeB !== timeA) return timeB - timeA;
    return (b.followUpNumber || 0) - (a.followUpNumber || 0);
  });
  
  const timelineHtml = sortedFollowUps.map((fu, idx) => `
    <div style="border-left: 2px solid #cbd5e1; padding-left: 16px; margin-bottom: 24px; position: relative;">
      <div style="position: absolute; width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; left: -5px; top: 6px;"></div>
      <div style="font-size: 13px; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">
        Follow-Up #${fu.followUpNumber || (sortedFollowUps.length - idx)} &nbsp;&bull;&nbsp; ${new Date(fu.followUpDate).toLocaleString()} &nbsp;&bull;&nbsp; via ${fu.method}
      </div>
      <div style="font-size: 14px; color: #334155; line-height: 1.5;">
        <strong>Communication:</strong> ${fu.communicated}
      </div>
      ${fu.responseReceived ? `<div style="font-size: 14px; color: #334155; margin-top: 6px; line-height: 1.5;"><strong>Response:</strong> ${fu.responseReceived}</div>` : ''}
      ${fu.contactPerson ? `<div style="font-size: 13px; color: #64748b; margin-top: 6px;"><strong>Contacted:</strong> ${fu.contactPerson}</div>` : ''}
      ${fu.attachments && fu.attachments.length > 0 ? `
        <div style="margin-top: 10px; background: #f1f5f9; padding: 10px 14px; border-radius: 6px; border: 1px solid #e2e8f0;">
          <strong style="font-size: 13px; color: #475569;">Proof Attached for this Follow-Up:</strong>
          <ul style="margin: 6px 0 0 0; padding-left: 20px; font-size: 13px;">
            ${fu.attachments.map((att: any) => `<li><a href="${att.url}" target="_blank" style="color: #2563eb; text-decoration: none;">${att.filename}</a></li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `).join('');

  // Collect all attachments from all follow-ups for the actual email attachments array
  const mailAttachments: any[] = [];
  followUps.forEach((fu: any) => {
    if (fu.attachments && fu.attachments.length > 0) {
      fu.attachments.forEach((att: any) => {
        // Prevent duplicate attachments if they somehow share the same URL
        if (!mailAttachments.find(ma => ma.path === att.url)) {
          mailAttachments.push({
            filename: `FU${fu.followUpNumber}_${att.filename}`,
            path: att.url
          });
        }
      });
    }
  });

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #1e293b; line-height: 1.6; background-color: #ffffff;">
      
      <!-- Header -->
      <div style="background-color: #0f172a; padding: 24px 32px; border-radius: 8px 8px 0 0;">
        <h2 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 500; letter-spacing: -0.01em;">Task Escalation Notice</h2>
      </div>
      
      <!-- Body -->
      <div style="padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="margin-top: 0; font-size: 15px;">
          Please be advised that this task requires immediate managerial attention due to a high volume of pending follow-ups (<strong>${followUpCount}</strong> recorded).
        </p>
        
        <!-- Task Details -->
        <div style="margin: 28px 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 12px 20px;">
            <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Task Details</h3>
          </div>
          <div style="padding: 20px;">
            <div style="margin-bottom: 12px;">
              <span style="display: inline-block; width: 100px; color: #64748b; font-size: 14px;">Title:</span>
              <strong style="color: #0f172a; font-size: 15px;">${task.title}</strong>
            </div>
            <div style="margin-bottom: 12px;">
              <span style="display: inline-block; width: 100px; color: #64748b; font-size: 14px;">Status:</span>
              <span style="display: inline-block; padding: 2px 8px; background: #fef3c7; color: #92400e; border-radius: 4px; font-size: 13px; font-weight: 500;">${task.workStatus}</span>
            </div>
            <div style="margin-bottom: 12px;">
              <span style="display: inline-block; width: 100px; color: #64748b; font-size: 14px;">Priority:</span>
              <span style="color: #0f172a; font-size: 14px; font-weight: 500;">${task.priority}</span>
            </div>
            <div style="margin-bottom: 12px;">
              <span style="display: inline-block; width: 100px; color: #64748b; font-size: 14px;">Assigned By:</span>
              <span style="color: #0f172a; font-size: 14px;">${task.givenBy || 'N/A'}</span>
            </div>
            <div style="margin-bottom: 0;">
              <span style="display: block; color: #64748b; font-size: 14px; margin-bottom: 4px;">Description:</span>
              <div style="color: #334155; font-size: 14px; background: #f8fafc; padding: 12px; border-radius: 6px;">${task.description || 'N/A'}</div>
            </div>
          </div>
        </div>

        <!-- Follow-Up Timeline -->
        <h3 style="font-size: 16px; font-weight: 600; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-top: 36px; margin-bottom: 24px;">Complete Communication History</h3>
        
        <div style="padding-left: 8px;">
          ${timelineHtml}
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0; text-align: center;">
            This is an automated escalation notice generated by the TasksManager System.<br/>
            Please coordinate internally for resolution.
          </p>
        </div>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"TasksManager Automated Escalation" <${FROM_EMAIL}>`,
      to: toEmails,
      cc: resolvedCc,
      subject,
      html,
      attachments: mailAttachments,
    });
    console.log(`✉️ Escalation email sent for ${task.taskId}: ${info.messageId}`);
  } catch (err) {
    console.error('❌ Failed to send escalation email:', err);
  }
}
