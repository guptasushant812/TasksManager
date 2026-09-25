import nodemailer from 'nodemailer';
import { ITask } from '../models/Task';

// In a real application, you would put these in .env
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.ethereal.email';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@tasksmanager.com';
const MANAGER_EMAIL = process.env.MANAGER_EMAIL || 'manager@tasksmanager.com';

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export async function sendEscalationEmail(task: any, followUpCount: number, threshold: number) {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('⚠️ SMTP credentials not configured. Skipping escalation email.');
    return;
  }

  const subject = `[ESCALATION] Task Requires Attention: ${task.taskId}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #EF4444;">Task Escalation Alert</h2>
      <p>The following task has reached the follow-up threshold and requires your attention.</p>
      
      <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #111827;">${task.taskId}: ${task.title}</h3>
        <ul style="color: #4B5563; padding-left: 20px;">
          <li><strong>Status:</strong> ${task.workStatus}</li>
          <li><strong>Priority:</strong> ${task.priority}</li>
          <li><strong>Contact:</strong> ${task.contactPerson || 'N/A'}</li>
          <li><strong>Follow-ups Logged:</strong> ${followUpCount} (Threshold: ${threshold})</li>
        </ul>
      </div>
      
      <p>Please review this task in the Task Manager system.</p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Task Manager" <${FROM_EMAIL}>`,
      to: MANAGER_EMAIL,
      subject,
      html,
    });
    console.log(`✉️ Escalation email sent for ${task.taskId}: ${info.messageId}`);
  } catch (err) {
    console.error('❌ Failed to send escalation email:', err);
  }
}
