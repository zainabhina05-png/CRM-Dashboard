/**
 * reminderScheduler — polls every 5 minutes for reminders that are due
 * within the next 30 minutes and haven't had an email sent yet.
 * Uses setInterval (no external job queue needed for this scale).
 *
 * Call start() once from server.js after DB connects.
 */
const Reminder = require('../models/Reminder');
const User     = require('../models/User');
const Lead     = require('../models/Lead');
const { sendReminderEmail } = require('./emailService');
const logger = require('./logger');

const POLL_INTERVAL_MS  = 5  * 60 * 1000; // 5 minutes
const LOOKAHEAD_MS      = 30 * 60 * 1000; // notify when due within 30 min

let _timer = null;

const runCheck = async () => {
  try {
    const now     = new Date();
    const horizon = new Date(now.getTime() + LOOKAHEAD_MS);

    // Find reminders that are:
    //  - not completed
    //  - not already emailed
    //  - due between (now - 24h) and (now + lookahead)
    //    The -24h window catches reminders that were due while the server was down.
    const reminders = await Reminder.find({
      completed: false,
      emailSent: false,
      dueDate: {
        $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        $lte: horizon,
      },
    })
      .populate('lead',  'name email company')
      .populate('owner', 'name email')
      .lean();

    for (const reminder of reminders) {
      if (!reminder.owner?.email || !reminder.lead) continue;

      await sendReminderEmail({
        ownerEmail: reminder.owner.email,
        ownerName:  reminder.owner.name,
        reminder,
        lead: reminder.lead,
      });

      // Mark emailed so we don't send again
      await Reminder.findByIdAndUpdate(reminder._id, { emailSent: true });
    }

    if (reminders.length) {
      logger.info(`[ReminderScheduler] Sent ${reminders.length} reminder email(s)`);
    }
  } catch (err) {
    logger.error(`[ReminderScheduler] Error during check: ${err.message}`);
  }
};

const start = () => {
  if (_timer) return;
  logger.info('[ReminderScheduler] Started — polling every 5 minutes');
  runCheck();
  _timer = setInterval(runCheck, POLL_INTERVAL_MS);
};

const stop = () => {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
  }
};

module.exports = { start, stop };
