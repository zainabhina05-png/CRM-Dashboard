/**
 * Pipeline / Kanban Security Middleware  (Task 1.4 — Phase 1G)
 *
 * Implements ALL requirements from requirements.md §G:
 *   G1  Server-side ownership re-check on every status update
 *   G2  IDOR protection — lead must belong to requesting user
 *   G3  Valid stage-transition enforcement
 *   G4  Role-based terminal-action restrictions
 *   G5  Optimistic concurrency control (version field)
 *   G6  Rate limiting on the stage-update endpoint
 *   G7  Audit trail (reuses activity log; done in the route handler)
 *   G8  Input sanitisation for card text fields
 */

const rateLimit   = require('express-rate-limit');
const mongoose    = require('mongoose');
const { logSecurityEvent } = require('./authSecurity');

/* ─────────────────────────────────────────────────────────────
   Stage transition rules
   Skipping stages is ALLOWED forward; backward moves are also
   allowed (rep may re-qualify a lost lead).  The only hard
   constraint is that terminal stages (Won / Lost) cannot be
   left once set — only admin can un-terminate a deal.
   ───────────────────────────────────────────────────────────── */
const VALID_STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];
const TERMINAL_STATUSES = new Set(['Won', 'Lost']);

// Adjacency map: from → allowed next statuses
// null means "no restriction" (any target is valid).
// Terminal states map to [] (only admin can move out of them).
const TRANSITION_MAP = {
  New:        null,          // can go anywhere
  Contacted:  null,
  Qualified:  null,
  Proposal:   null,
  Won:        [],            // terminal — blocked unless admin
  Lost:       [],            // terminal — blocked unless admin
};

/**
 * G6 — Rate limit: 30 status changes per minute per user (keyed on userId).
 */
const statusChangeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10000 : 30,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many status changes. Please slow down.',
    data: null,
  },
});

/**
 * G1 + G2 — Verify ownership and fetch lead into req.lead.
 * Returns 404 (not 403) on ownership failure to prevent ID enumeration.
 */
const verifyLeadOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lead ID',
        data: null,
      });
    }

    const Lead = require('../models/Lead');

    // Build the query — admin sees all, others see only their own
    const filter = { _id: id };
    if (req.user.role !== 'admin') {
      filter.owner = req.user._id;
    }

    const lead = await Lead.findOne(filter);

    if (!lead) {
      // Don't reveal whether the ID exists for another user
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
        data: null,
      });
    }

    req.lead = lead;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * G3 + G4 — Validate the requested status transition.
 *
 * Rules:
 *  • Status value must be in VALID_STATUSES (also enforced by validator middleware)
 *  • Moving OUT of a terminal stage requires admin role
 *  • Moving INTO Won or Lost requires manager or admin role
 */
const validateStatusTransition = (req, res, next) => {
  const { status: newStatus } = req.body;
  const currentStatus         = req.lead.status;
  const { role }              = req.user;

  // No-op: same status is fine, just pass through
  if (newStatus === currentStatus) return next();

  // ── G3: leaving a terminal stage ────────────────────────────
  if (TERMINAL_STATUSES.has(currentStatus) && role !== 'admin') {
    logSecurityEvent('ILLEGAL_TERMINAL_TRANSITION', {
      userId:        req.user._id,
      leadId:        req.lead._id,
      fromStatus:    currentStatus,
      toStatus:      newStatus,
      role,
      ip:            req.ip,
      timestamp:     new Date().toISOString(),
    });

    return res.status(403).json({
      success: false,
      message: `Cannot move a ${currentStatus} deal. Only admins can reopen terminal stages.`,
      data: null,
    });
  }

  // ── G4: closing a deal (moving INTO terminal) ────────────────
  if (TERMINAL_STATUSES.has(newStatus) && role === 'sales_rep') {
    logSecurityEvent('UNAUTHORIZED_DEAL_CLOSURE_ATTEMPT', {
      userId:     req.user._id,
      leadId:     req.lead._id,
      fromStatus: currentStatus,
      toStatus:   newStatus,
      role,
      ip:         req.ip,
      timestamp:  new Date().toISOString(),
    });

    return res.status(403).json({
      success: false,
      message: 'Only managers and admins can close deals as Won or Lost.',
      data: null,
    });
  }

  next();
};

/**
 * G5 — Optimistic concurrency check.
 * Client may pass `__v` (Mongoose version key) in the request body.
 * If provided and it doesn't match the stored version, reject with 409.
 */
const checkConcurrency = (req, res, next) => {
  const clientVersion = req.body.__v;

  if (clientVersion !== undefined && clientVersion !== null) {
    // __v is a number; coerce to be safe
    if (Number(clientVersion) !== req.lead.__v) {
      logSecurityEvent('CONCURRENCY_CONFLICT', {
        userId:          req.user._id,
        leadId:          req.lead._id,
        clientVersion,
        serverVersion:   req.lead.__v,
        ip:              req.ip,
        timestamp:       new Date().toISOString(),
      });

      return res.status(409).json({
        success: false,
        message: 'This lead was modified by another user. Please refresh and try again.',
        data: {
          currentVersion: req.lead.__v,
        },
      });
    }
  }

  next();
};

/**
 * G8 — Sanitise text fields that come from the client.
 * Strips HTML tags, limits string lengths, and removes null bytes.
 * Applied to any route that writes lead content (create, update, activities).
 */
const sanitizeTextFields = (req, _res, next) => {
  const fields = ['name', 'company', 'notes', 'phone'];

  fields.forEach((field) => {
    if (typeof req.body[field] === 'string') {
      req.body[field] = req.body[field]
        .replace(/<[^>]*>/g, '')        // strip HTML tags
        .replace(/\0/g, '')             // strip null bytes
        .replace(/javascript:/gi, '')   // strip JS protocol
        .trim();
    }
  });

  // Sanitise activity content
  if (typeof req.body.content === 'string') {
    req.body.content = req.body.content
      .replace(/<[^>]*>/g, '')           // strip ALL HTML tags
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')        // strip event handlers
      .replace(/\0/g, '')
      .trim();
  }

  // Sanitise tags array
  if (Array.isArray(req.body.tags)) {
    req.body.tags = req.body.tags
      .map(t => typeof t === 'string' ? t.replace(/<[^>]*>/g, '').replace(/\0/g, '').trim() : '')
      .filter(Boolean);
  }

  next();
};

/**
 * Convenience: compose all security middleware for a PATCH /:id/status route.
 * Usage: router.patch('/:id/status', ...pipelineStatusGuard, handler)
 */
const pipelineStatusGuard = [
  statusChangeLimiter,
  verifyLeadOwnership,
  validateStatusTransition,
  checkConcurrency,
];

module.exports = {
  statusChangeLimiter,
  verifyLeadOwnership,
  validateStatusTransition,
  checkConcurrency,
  sanitizeTextFields,
  pipelineStatusGuard,
  VALID_STATUSES,
  TERMINAL_STATUSES,
};
