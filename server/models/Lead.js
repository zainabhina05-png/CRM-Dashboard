const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['note', 'call', 'email', 'meeting', 'status_change', 'created'],
      required: true,
    },
    content: {
      type: String,
      trim: true,
      maxlength: [1000, 'Activity content cannot exceed 1000 characters'],
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const customFieldSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true, maxlength: 50 },
    value: { type: String, trim: true, maxlength: 200, default: '' },
  },
  { _id: false }
);

const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];

const LEAD_SOURCES = ['website', 'referral', 'social_media', 'paid_ads', 'cold_call', 'other'];

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Lead name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    company: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: LEAD_STATUSES,
      default: 'New',
    },
    source: {
      type: String,
      enum: LEAD_SOURCES,
      default: 'other',
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (tags) => tags.length <= 20,
        message: 'A lead cannot have more than 20 tags',
      },
    },
    customFields: {
      type: [customFieldSchema],
      default: [],
      validate: {
        validator: (fields) => fields.length <= 10,
        message: 'A lead cannot have more than 10 custom fields',
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    activities: {
      type: [activitySchema],
      default: [],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

leadSchema.index({ owner: 1, email: 1 }, { unique: true });
leadSchema.index({ owner: 1, status: 1 });
leadSchema.index({ owner: 1, phone: 1 });
leadSchema.index({ owner: 1, tags: 1 });
leadSchema.index({ name: 'text', email: 'text', company: 'text' });

// Performance — additional compound indexes for common access patterns
leadSchema.index({ owner: 1, _id: 1 });                      // IDOR ownership checks
leadSchema.index({ owner: 1, source: 1 });                    // source filter queries
leadSchema.index({ owner: 1, createdAt: -1 });                // chronological list view
leadSchema.index({ owner: 1, updatedAt: -1 });                // kanban (sorted by recent activity)
leadSchema.index({ owner: 1, status: 1, updatedAt: -1 });     // pipeline + recency combined

leadSchema.statics.LEAD_STATUSES = LEAD_STATUSES;
leadSchema.statics.LEAD_SOURCES = LEAD_SOURCES;

module.exports = mongoose.model('Lead', leadSchema);
