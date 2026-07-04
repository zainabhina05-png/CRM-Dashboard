const express = require('express');
const Lead = require('../models/Lead');
const protect = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { findDuplicates } = require('../utils/duplicateDetection');
const { sendLeadAssignedEmail } = require('../utils/emailService');
const {
  validate,
  createLeadRules,
  updateLeadRules,
  patchStatusRules,
  checkDuplicatesRules,
  addActivityRules,
} = require('../middleware/validators');

const router = express.Router();
const PIPELINE_STATUSES = Lead.LEAD_STATUSES || ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];

router.use(protect);

// POST /api/leads/check-duplicates — Check for potential duplicates before creating
router.post('/check-duplicates', checkDuplicatesRules, validate, async (req, res, next) => {
  try {
    const { email, phone, name, company, excludeId } = req.body;
    const duplicates = await findDuplicates(Lead, req.user._id, {
      email,
      phone,
      name,
      company,
      excludeId,
    });

    res.status(200).json({
      success: true,
      message: duplicates.length ? 'Potential duplicates found' : 'No duplicates found',
      data: { duplicates, hasDuplicates: duplicates.length > 0 },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/leads — Create a new lead (with duplicate detection)
router.post('/', createLeadRules, validate, async (req, res, next) => {
  try {
    const { name, email, phone, company, status, notes, source, tags, customFields, force } = req.body;

    if (!force) {
      const duplicates = await findDuplicates(Lead, req.user._id, {
        email,
        phone,
        name,
        company,
      });

      if (duplicates.length) {
        return res.status(409).json({
          success: false,
          message: 'Potential duplicate leads detected',
          data: { duplicates, hasDuplicates: true },
        });
      }
    }

    const lead = await Lead.create({
      name,
      email,
      phone,
      company,
      status,
      notes,
      source,
      tags: tags || [],
      customFields: customFields || [],
      owner: req.user._id,
      activities: [
        {
          type: 'created',
          content: 'Lead created',
          createdBy: req.user._id,
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: { lead },
    });

    // Fire-and-forget: notify the owner by email (doesn't block the response)
    sendLeadAssignedEmail({
      ownerEmail: req.user.email,
      ownerName:  req.user.name,
      lead,
    }).catch(() => {});
  } catch (error) {
    next(error);
  }
});

// GET /api/leads/export — Export leads as CSV (admin + manager only)
router.get('/export', authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const filter = { owner: req.user._id };

    if (req.query.status && req.query.status !== 'All') filter.status = req.query.status;
    if (req.query.source && req.query.source !== 'All') filter.source = req.query.source;
    if (req.query.tag) filter.tags = req.query.tag;
    if (req.query.search && req.query.search.trim()) {
      filter.$text = { $search: req.query.search.trim() };
    }

    const leads = await Lead.find(filter)
      .select('name email phone company status source tags notes createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean();

    // Build CSV manually — no external dep needed
    const escape = (val) => {
      if (val == null) return '';
      const str = String(val).replace(/"/g, '""');
      return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
    };

    const headers = ['Name','Email','Phone','Company','Status','Source','Tags','Notes','Created At'];
    const rows = leads.map((l) => [
      escape(l.name),
      escape(l.email),
      escape(l.phone),
      escape(l.company),
      escape(l.status),
      escape(l.source),
      escape((l.tags || []).join('; ')),
      escape(l.notes),
      escape(new Date(l.createdAt).toISOString()),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leads-export.csv"');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
});

// GET /api/leads/kanban — All leads grouped by pipeline stage
router.get('/kanban', async (req, res, next) => {
  try {
    const filter = { owner: req.user._id };

    if (req.query.search && req.query.search.trim()) {
      filter.$text = { $search: req.query.search.trim() };
    }

    if (req.query.source && req.query.source !== 'All') {
      filter.source = req.query.source;
    }

    if (req.query.tag) {
      filter.tags = req.query.tag;
    }

    const leads = await Lead.find(filter)
      .select('name email phone company status source tags customFields createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    const grouped = {};
    PIPELINE_STATUSES.forEach((s) => {
      grouped[s] = [];
    });
    leads.forEach((lead) => {
      if (grouped[lead.status]) {
        grouped[lead.status].push(lead);
      }
    });

    res.status(200).json({
      success: true,
      message: 'Kanban data retrieved successfully',
      data: { grouped, total: leads.length },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/leads — Get all leads with pagination, search, filter
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { owner: req.user._id };

    if (req.query.status && req.query.status !== 'All') {
      filter.status = req.query.status;
    }

    if (req.query.source && req.query.source !== 'All') {
      filter.source = req.query.source;
    }

    if (req.query.tag) {
      filter.tags = req.query.tag;
    }

    if (req.query.search && req.query.search.trim()) {
      filter.$text = { $search: req.query.search.trim() };
    }

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Lead.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: 'Leads retrieved successfully',
      data: {
        leads,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/leads/analytics — Counts per status, source breakdown, win/loss rate, monthly trend
router.get('/analytics', async (req, res, next) => {
  try {
    const ownerId = req.user._id;

    // Run all aggregations in parallel for performance
    const [statusAgg, sourceAgg, monthlyAgg] = await Promise.all([
      // 1. Count by status
      Lead.aggregate([
        { $match: { owner: ownerId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // 2. Count by source
      Lead.aggregate([
        { $match: { owner: ownerId } },
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // 3. Monthly lead creation trend — last 12 months
      Lead.aggregate([
        {
          $match: {
            owner: ownerId,
            createdAt: {
              $gte: new Date(new Date().setMonth(new Date().getMonth() - 11, 1)),
            },
          },
        },
        {
          $group: {
            _id: {
              year:  { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
            won:   { $sum: { $cond: [{ $eq: ['$status', 'Won'] }, 1, 0] } },
            lost:  { $sum: { $cond: [{ $eq: ['$status', 'Lost'] }, 1, 0] } },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    // Build status counts map
    const counts = {};
    PIPELINE_STATUSES.forEach((s) => { counts[s] = 0; });
    statusAgg.forEach((item) => { counts[item._id] = item.count; });
    const total = Object.values(counts).reduce((sum, c) => sum + c, 0);

    // Build source breakdown array
    const LEAD_SOURCES = ['website', 'referral', 'social_media', 'paid_ads', 'cold_call', 'other'];
    const sourceCounts = {};
    LEAD_SOURCES.forEach((s) => { sourceCounts[s] = 0; });
    sourceAgg.forEach((item) => { if (item._id) sourceCounts[item._id] = item.count; });
    const bySource = Object.entries(sourceCounts).map(([source, count]) => ({ source, count }));

    // Win / loss rate
    const closed = (counts['Won'] || 0) + (counts['Lost'] || 0);
    const winRate  = closed > 0 ? Math.round((counts['Won']  / closed) * 100) : 0;
    const lossRate = closed > 0 ? Math.round((counts['Lost'] / closed) * 100) : 0;

    // Fill in all 12 months even if no leads exist for that month
    const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const now = new Date();
    const trend = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year  = d.getFullYear();
      const month = d.getMonth() + 1; // MongoDB $month is 1-indexed
      const found = monthlyAgg.find((m) => m._id.year === year && m._id.month === month);
      trend.push({
        month: `${MONTH_NAMES[month - 1]} ${String(year).slice(2)}`,
        total: found?.count || 0,
        won:   found?.won   || 0,
        lost:  found?.lost  || 0,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Analytics retrieved successfully',
      data: {
        counts,
        total,
        bySource,
        winRate,
        lossRate,
        trend,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/leads/:id — Get a single lead with activities
router.get('/:id', async (req, res, next) => {
  try {
    const lead = await Lead.findOne({
      _id: req.params.id,
      owner: req.user._id,
    }).populate('activities.createdBy', 'name');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Lead retrieved successfully',
      data: { lead },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/leads/:id/activities — Log an activity on a lead
router.post('/:id/activities', addActivityRules, validate, async (req, res, next) => {
  try {
    const { type, content } = req.body;

    const lead = await Lead.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
        data: null,
      });
    }

    lead.activities.unshift({
      type,
      content,
      createdBy: req.user._id,
    });

    await lead.save();
    await lead.populate('activities.createdBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Activity logged successfully',
      data: { lead },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/leads/:id — Full update a lead
router.put('/:id', updateLeadRules, validate, async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, owner: req.user._id });
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
        data: null,
      });
    }

    const { status, ...rest } = req.body;
    const previousStatus = lead.status;

    Object.assign(lead, rest);

    if (status && status !== previousStatus) {
      lead.status = status;
      lead.activities.unshift({
        type: 'status_change',
        content: `Status changed from ${previousStatus} to ${status}`,
        metadata: { fromStatus: previousStatus, toStatus: status },
        createdBy: req.user._id,
      });
    } else if (status) {
      lead.status = status;
    }

    await lead.save();

    res.status(200).json({
      success: true,
      message: 'Lead updated successfully',
      data: { lead },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/leads/:id/status — Partial update (status only)
router.patch('/:id/status', patchStatusRules, validate, async (req, res, next) => {
  try {
    const existing = await Lead.findOne({ _id: req.params.id, owner: req.user._id });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
        data: null,
      });
    }

    const newStatus = req.body.status;
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      {
        status: newStatus,
        $push: {
          activities: {
            $each: [
              {
                type: 'status_change',
                content: `Status changed from ${existing.status} to ${newStatus}`,
                metadata: { fromStatus: existing.status, toStatus: newStatus },
                createdBy: req.user._id,
              },
            ],
            $position: 0,
          },
        },
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Lead status updated successfully',
      data: { lead },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/leads/:id — Remove a lead (admin and manager only)
router.delete('/:id', authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const lead = await Lead.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Lead deleted successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
