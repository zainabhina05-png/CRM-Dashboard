const nodemailer = require('nodemailer');
const logger = require('./logger');

/**
 * Lazy-initialised transporter — created once on first use.
 * Supports any SMTP provider: Gmail, SendGrid, Mailgun, Resend, etc.
 * Falls back to a no-op console log when SMTP_HOST is not configured
 * (safe for development without email credentials).
 */
let _transporter = null;

const getTransporter = () => {
  if (_transporter) return _transporter;

  if (!process.env.SMTP_HOST) {
    _transporter = {
      sendMail: async (options) => {
        logger.debug(`[EmailService] SMTP not configured — would send: to=${options.to} subject="${options.subject}"`);
        return { messageId: 'dev-stub' };
      },
    };
    return _transporter;
  }

  _transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true', // true for port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return _transporter;
};

const FROM = process.env.SMTP_FROM || 'LeadFlow <no-reply@leadflow.app>';

/**
 * Send an email.
 * @param {Object} opts
 * @param {string}   opts.to       Recipient email
 * @param {string}   opts.subject  Subject line
 * @param {string}   opts.html     HTML body
 * @param {string}   [opts.text]   Plain-text fallback
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: FROM,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ''),
    });
    return info;
  } catch (err) {
    logger.error(`[EmailService] Failed to send email to ${to}: ${err.message}`);
    return null;
  }
};

/* ── Email templates ─────────────────────────────────────── */

/**
 * Notify the lead owner that a new lead was assigned to them.
 */
const sendLeadAssignedEmail = async ({ ownerEmail, ownerName, lead }) => {
  const subject = `New lead assigned: ${lead.name}`;
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;color:#edf2ff;background:#060d1a;padding:2rem;border-radius:8px;border:1px solid rgba(255,255,255,0.08)">
      <h2 style="color:#e5b62b;margin:0 0 1rem">New Lead Assigned</h2>
      <p style="color:#8fa8cc;margin:0 0 1.5rem">Hi ${ownerName}, a new lead has been added to your pipeline.</p>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:0.5rem 0;color:#506080;font-size:13px">Name</td><td style="color:#edf2ff;font-size:13px">${lead.name}</td></tr>
        <tr><td style="padding:0.5rem 0;color:#506080;font-size:13px">Email</td><td style="color:#edf2ff;font-size:13px">${lead.email}</td></tr>
        ${lead.company ? `<tr><td style="padding:0.5rem 0;color:#506080;font-size:13px">Company</td><td style="color:#edf2ff;font-size:13px">${lead.company}</td></tr>` : ''}
        <tr><td style="padding:0.5rem 0;color:#506080;font-size:13px">Source</td><td style="color:#edf2ff;font-size:13px">${lead.source || 'other'}</td></tr>
        <tr><td style="padding:0.5rem 0;color:#506080;font-size:13px">Status</td><td style="color:#edf2ff;font-size:13px">${lead.status}</td></tr>
      </table>
      <p style="margin:1.5rem 0 0;color:#506080;font-size:12px">LeadFlow CRM — you're receiving this because you are the lead owner.</p>
    </div>
  `;
  return sendEmail({ to: ownerEmail, subject, html });
};

/**
 * Remind the lead owner about an upcoming or overdue follow-up task.
 */
const sendReminderEmail = async ({ ownerEmail, ownerName, reminder, lead }) => {
  const due = new Date(reminder.dueDate);
  const now = new Date();
  const isOverdue = due < now;
  const formattedDue = due.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });

  const subject = isOverdue
    ? `[Overdue] Follow-up: ${reminder.title}`
    : `[Reminder] Follow-up due soon: ${reminder.title}`;

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;color:#edf2ff;background:#060d1a;padding:2rem;border-radius:8px;border:1px solid rgba(255,255,255,0.08)">
      <h2 style="color:${isOverdue ? '#e55b5b' : '#e5b62b'};margin:0 0 1rem">${isOverdue ? 'Overdue Follow-up' : 'Upcoming Follow-up'}</h2>
      <p style="color:#8fa8cc;margin:0 0 1.5rem">Hi ${ownerName}, you have a follow-up task${isOverdue ? ' that is overdue' : ' due soon'}.</p>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:0.5rem 0;color:#506080;font-size:13px">Task</td><td style="color:#edf2ff;font-size:13px"><strong>${reminder.title}</strong></td></tr>
        <tr><td style="padding:0.5rem 0;color:#506080;font-size:13px">Due</td><td style="color:${isOverdue ? '#e55b5b' : '#edf2ff'};font-size:13px">${formattedDue}</td></tr>
        <tr><td style="padding:0.5rem 0;color:#506080;font-size:13px">Lead</td><td style="color:#edf2ff;font-size:13px">${lead.name}</td></tr>
        ${lead.company ? `<tr><td style="padding:0.5rem 0;color:#506080;font-size:13px">Company</td><td style="color:#edf2ff;font-size:13px">${lead.company}</td></tr>` : ''}
        <tr><td style="padding:0.5rem 0;color:#506080;font-size:13px">Lead Email</td><td style="color:#edf2ff;font-size:13px">${lead.email}</td></tr>
      </table>
      <p style="margin:1.5rem 0 0;color:#506080;font-size:12px">LeadFlow CRM — you're receiving this because you set this reminder.</p>
    </div>
  `;
  return sendEmail({ to: ownerEmail, subject, html });
};

module.exports = { sendEmail, sendLeadAssignedEmail, sendReminderEmail };
