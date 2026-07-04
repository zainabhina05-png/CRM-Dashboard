/**
 * POST /api/webhooks/leads
 *
 * Generic inbound webhook for external lead capture.
 * Compatible with: Facebook Lead Ads, Zapier, Make.com, custom forms.
 *
 * Security: HMAC-SHA256 signature verification via X-LeadFlow-Signature header.
 * The signature is: HMAC-SHA256(rawBody, WEBHOOK_SECRET), hex-encoded.
 *
 * Payload shape (flexible — maps common field names):
 * {
 *   "name"    : "Jane Doe",
 *   "email"   : "jane@example.com",
 *   "phone"   : "+1 555 000 0000",
 *   "company" : "Acme Corp",
 *   "source"  : "website",          // optional
 *   "tags"    : ["vip","q4"],        // optional
 *   "notes"   : "Came from ad #12", // optional
 *
 *   // Facebook Lead Ads alternative field names (auto-mapped):
 *   "full_name"    : "Jane Doe",
 *   "phone_number" : "+1 555 000 0000",
 * }
 *
 * Target owner is resolved from the WEBHOOK_OWNER_ID env var (the user that
 * owns all webhook-captured leads). Set this to the admin user's MongoDB _id.
 */
const express  = require('express');
const crypto   = require('crypto');
const Lead     = require('../models/Lead');
const User     = require('../models/User');
const { findDuplicates }      = require('../utils/duplicateDetection');
const { sendLeadAssignedEmail } = require('../utils/emailService');

const router = express.Router();

/* ── HMAC signature verification ───────────────────────── */
const verifySignature = (req, res, next) => {
  const secret = process.env.WEBHOOK_SECRET;

  // If no secret is configured, skip verification in development
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({
        success: false,
        message: 'Webhook secret not configured',
        data: null,
      });
    }
    return next(); // dev: allow unsigned
  }

  const signature = req.headers['x-leadflow-signature'];
  if (!signature) {
    return res.status(401).json({
      success: false,
      message: 'Missing X-LeadFlow-Signature header',
      data: null,
    });
  }

  // req.rawBody is populated by the express.json verify callback in server.js
  const expected = crypto
    .createHmac('sha256', secret)
    .update(req.rawBody || '')
    .digest('hex');

  const trusted = `sha256=${expected}`;

  // Constant-time comparison to prevent timing attacks
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(trusted))) {
    return res.status(401).json({
      success: false,
      message: 'Invalid webhook signature',
      data: null,
    });
  }

  next();
};

/* ── Field normalisation ─────────────────────────────────── */
const VALID_SOURCES = ['website', 'referral', 'social_media', 'paid_ads', 'cold_call', 'other'];

const normalisePayload = (body) => ({
  name:    (body.name    || body.full_name    || '').trim(),
  email:   (body.email                        || '').trim().toLowerCase(),
  phone:   (body.phone   || body.phone_number || '').trim(),
  company: (body.company || body.company_name || '').trim(),
  source:  VALID_SOURCES.includes(body.source) ? body.source : 'website',
  tags:    Array.isArray(body.tags) ? body.tags.slice(0, 20) : [],
  notes:   (body.notes   || '').trim().slice(0, 500),
});

/* ── POST /api/webhooks/leads ────────────────────────────── */
router.post('/leads', verifySignature, async (req, res, next) => {
  try {
    const payload = normalisePayload(req.body);

    if (!payload.name || !payload.email) {
      return res.status(422).json({
        success: false,
        message: 'Webhook payload must include name and email',
        data: null,
      });
    }

    // Resolve the owner from env — webhooks always land on this user
    const ownerId = process.env.WEBHOOK_OWNER_ID;
    if (!ownerId) {
      return res.status(500).json({
        success: false,
        message: 'WEBHOOK_OWNER_ID is not configured',
        data: null,
      });
    }

    const owner = await User.findById(ownerId).lean();
    if (!owner) {
      return res.status(500).json({
        success: false,
        message: 'Webhook owner user not found',
        data: null,
      });
    }

    // Duplicate check — skip create if exact email already exists for this owner
    const dupes = await findDuplicates(Lead, ownerId, {
      email:   payload.email,
      phone:   payload.phone,
      name:    payload.name,
      company: payload.company,
    });

    if (dupes.length) {
      return res.status(200).json({
        success: true,
        message: 'Duplicate lead detected — skipped',
        data: { skipped: true, duplicates: dupes },
      });
    }

    const lead = await Lead.create({
      ...payload,
      status:   'New',
      owner:    ownerId,
      activities: [{
        type:      'created',
        content:   `Lead captured via webhook (source: ${payload.source})`,
        createdBy: ownerId,
      }],
    });

    // Fire-and-forget email notification to the owner
    sendLeadAssignedEmail({
      ownerEmail: owner.email,
      ownerName:  owner.name,
      lead,
    }).catch(() => {}); // errors are already logged inside emailService

    res.status(201).json({
      success: true,
      message: 'Lead created via webhook',
      data: { leadId: lead._id },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
