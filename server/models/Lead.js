const mongoose = require('mongoose');

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
      // NOTE: NOT globally unique — uniqueness is enforced per-owner via compound index below
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
      enum: ['New', 'Contacted', 'Qualified', 'Lost', 'Won'],
      default: 'New',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
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

// Compound unique index: one email per owner (not globally unique)
// This allows different users to have leads with the same email
leadSchema.index({ owner: 1, email: 1 }, { unique: true });

// Indexes for fast filtering and full-text search
leadSchema.index({ owner: 1, status: 1 });
leadSchema.index({ name: 'text', email: 'text' });

module.exports = mongoose.model('Lead', leadSchema);
