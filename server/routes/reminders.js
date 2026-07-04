const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Reminder = require('../models/Reminder');
const Lead     = require('../models/Lead');
const protect  = require('../middleware/auth');

const router = express.Router();
router.use(protect);

/* ── Validation helpers ─────────────────────────────────── */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: errors.array().map((e) => e.msg).join(', '),
      data: null,
    });
  }
  next();
};

const createReminderRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('dueDate')
    .notEmpty().withMessage('Due date is required')
    .isISO8601().withMessage('Due date must be a valid ISO 8601 date'),
  body('leadId')
    .notEmpty().withMessage('Lead ID is required')
    .isMongoId().withMessage('Invalid lead ID'),
];

/* ── GET /api/reminders ─────────────────────────────────── */
// Returns all reminders for the current user.
// Query params:
//   completed=true|false  (default: false — pending only)
//   leadId=<id>           (filter to a specific lead)
router.get('/', async (req, res, next) => {
  try {
    const filter = { owner: req.user._id };

    if (req.query.completed !== undefined) {
      filter.completed = req.query.completed === 'true';
    } else {
      filter.completed = false; // default: show pending only
    }

    if (req.query.leadId) {
      filter.lead = req.query.leadId;
    }

    const reminders = await Reminder.find(filter)
      .populate('lead', 'name email company status')
      .sort({ dueDate: 1 })
      .lean();

    res.status(200).json({
      success: true,
      message: 'Reminders retrieved',
      data: { reminders },
    });
  } catch (err) {
    next(err);
  }
});

/* ── GET /api/reminders/summary ─────────────────────────── */
// Returns counts for the notification bell:
//   overdue, dueToday, dueThisWeek
router.get('/summary', async (req, res, next) => {
  try {
    const now      = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const weekEnd  = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [overdue, dueToday, dueThisWeek] = await Promise.all([
      Reminder.countDocuments({
        owner: req.user._id, completed: false,
        dueDate: { $lt: now },
      }),
      Reminder.countDocuments({
        owner: req.user._id, completed: false,
        dueDate: { $gte: now, $lte: todayEnd },
      }),
      Reminder.countDocuments({
        owner: req.user._id, completed: false,
        dueDate: { $gte: now, $lte: weekEnd },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Reminder summary retrieved',
      data: { overdue, dueToday, dueThisWeek },
    });
  } catch (err) {
    next(err);
  }
});

/* ── POST /api/reminders ────────────────────────────────── */
router.post('/', createReminderRules, validate, async (req, res, next) => {
  try {
    const { title, dueDate, leadId } = req.body;

    // Verify the lead belongs to this user
    const lead = await Lead.findOne({ _id: leadId, owner: req.user._id }).lean();
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
        data: null,
      });
    }

    const reminder = await Reminder.create({
      title,
      dueDate: new Date(dueDate),
      lead:  leadId,
      owner: req.user._id,
    });

    const populated = await reminder.populate('lead', 'name email company status');

    res.status(201).json({
      success: true,
      message: 'Reminder created',
      data: { reminder: populated },
    });
  } catch (err) {
    next(err);
  }
});

/* ── PATCH /api/reminders/:id/complete ──────────────────── */
router.patch(
  '/:id/complete',
  [param('id').isMongoId().withMessage('Invalid reminder ID')],
  validate,
  async (req, res, next) => {
    try {
      const reminder = await Reminder.findOneAndUpdate(
        { _id: req.params.id, owner: req.user._id },
        { completed: true, completedAt: new Date() },
        { new: true }
      ).populate('lead', 'name email company status');

      if (!reminder) {
        return res.status(404).json({ success: false, message: 'Reminder not found', data: null });
      }

      res.status(200).json({
        success: true,
        message: 'Reminder marked complete',
        data: { reminder },
      });
    } catch (err) {
      next(err);
    }
  }
);

/* ── DELETE /api/reminders/:id ──────────────────────────── */
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid reminder ID')],
  validate,
  async (req, res, next) => {
    try {
      const reminder = await Reminder.findOneAndDelete({
        _id: req.params.id,
        owner: req.user._id,
      });

      if (!reminder) {
        return res.status(404).json({ success: false, message: 'Reminder not found', data: null });
      }

      res.status(200).json({ success: true, message: 'Reminder deleted', data: null });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
