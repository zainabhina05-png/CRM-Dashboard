const { body, validationResult } = require('express-validator');

// Helper to check validation results and return consistent error shape
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

// --- Auth validation rules ---

const registerRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const loginRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// --- Lead validation rules ---

const createLeadRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Lead name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim(),
  body('company')
    .optional()
    .trim(),
  body('status')
    .optional()
    .isIn(['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'])
    .withMessage('Status must be one of: New, Contacted, Qualified, Proposal, Won, Lost'),
  body('source')
    .optional()
    .isIn(['website', 'referral', 'social_media', 'paid_ads', 'cold_call', 'other'])
    .withMessage('Invalid lead source'),
  body('tags')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Tags must be an array with at most 20 items'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be 1–30 characters'),
  body('customFields')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Custom fields must be an array with at most 10 items'),
  body('customFields.*.key')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Custom field key must be 1–50 characters'),
  body('customFields.*.value')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Custom field value cannot exceed 200 characters'),
  body('force')
    .optional()
    .isBoolean()
    .withMessage('Force must be a boolean'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
];

const updateLeadRules = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim(),
  body('company')
    .optional()
    .trim(),
  body('status')
    .optional()
    .isIn(['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'])
    .withMessage('Status must be one of: New, Contacted, Qualified, Proposal, Won, Lost'),
  body('source')
    .optional()
    .isIn(['website', 'referral', 'social_media', 'paid_ads', 'cold_call', 'other'])
    .withMessage('Invalid lead source'),
  body('tags')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Tags must be an array with at most 20 items'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be 1–30 characters'),
  body('customFields')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Custom fields must be an array with at most 10 items'),
  body('customFields.*.key')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Custom field key must be 1–50 characters'),
  body('customFields.*.value')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Custom field value cannot exceed 200 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
];

const patchStatusRules = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'])
    .withMessage('Status must be one of: New, Contacted, Qualified, Proposal, Won, Lost'),
];

const checkDuplicatesRules = [
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone').optional().trim(),
  body('name').optional().trim(),
  body('company').optional().trim(),
  body('excludeId').optional().isMongoId().withMessage('Invalid lead ID'),
];

const addActivityRules = [
  body('type')
    .notEmpty()
    .withMessage('Activity type is required')
    .isIn(['note', 'call', 'email', 'meeting'])
    .withMessage('Activity type must be one of: note, call, email, meeting'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Activity content is required')
    .isLength({ max: 1000 })
    .withMessage('Activity content cannot exceed 1000 characters'),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  createLeadRules,
  updateLeadRules,
  patchStatusRules,
  checkDuplicatesRules,
  addActivityRules,
};
