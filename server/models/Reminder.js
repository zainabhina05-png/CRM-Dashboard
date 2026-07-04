const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Reminder title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    // Whether the due-date email alert has been sent (prevents duplicate sends)
    emailSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes for efficient querying
reminderSchema.index({ owner: 1, completed: 1, dueDate: 1 });
reminderSchema.index({ lead: 1 });
// TTL-style: find reminders due for email dispatch
reminderSchema.index({ dueDate: 1, emailSent: 1, completed: 1 });

module.exports = mongoose.model('Reminder', reminderSchema);
