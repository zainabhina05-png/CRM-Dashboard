export const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];

export const PIPELINE_STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];

export const LEAD_SOURCES = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'paid_ads', label: 'Paid Ads' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'other', label: 'Other' },
];

export const SOURCE_LABELS = Object.fromEntries(
  LEAD_SOURCES.map(({ value, label }) => [value, label])
);

export const STATUS_COLORS = {
  New: '#45a3e5',
  Contacted: '#e5b62b',
  Qualified: '#13a3a3',
  Proposal: '#8b5cf6',
  Lost: '#e55b5b',
  Won: '#4fb86e',
};

export const USER_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'sales_rep', label: 'Sales Rep' },
];

export const ROLE_LABELS = Object.fromEntries(
  USER_ROLES.map(({ value, label }) => [value, label])
);

export const STATUS_ICONS = {
  New: '🌱',
  Contacted: '📞',
  Qualified: '⭐',
  Proposal: '📋',
  Lost: '❌',
  Won: '🏆',
};

export const ACTIVITY_TYPES = [
  { value: 'note', label: 'Note', icon: '📝' },
  { value: 'call', label: 'Call', icon: '📞' },
  { value: 'email', label: 'Email', icon: '✉️' },
  { value: 'meeting', label: 'Meeting', icon: '📅' },
];

export const ACTIVITY_ICONS = {
  note: '📝',
  call: '📞',
  email: '✉️',
  meeting: '📅',
  status_change: '🔄',
  created: '✨',
  reminder: '⏰',
};

export const MATCH_REASON_LABELS = {
  email: 'Same email',
  phone: 'Same phone number',
  name_company: 'Same name & company',
  similar: 'Similar record',
};

export const DEFAULT_PAGE_SIZE = 10;
export const DEBOUNCE_DELAY = 400;
