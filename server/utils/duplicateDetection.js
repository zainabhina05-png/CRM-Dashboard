const normalizePhone = (phone) => (phone || '').replace(/\D/g, '');

/**
 * Find potential duplicate leads for the same owner.
 * Matches on: exact email, normalized phone, or same name + company.
 */
const findDuplicates = async (Lead, ownerId, { email, phone, name, company, excludeId }) => {
  const conditions = [];

  if (email) {
    conditions.push({ email: email.toLowerCase().trim() });
  }

  const normalizedPhone = normalizePhone(phone);
  if (normalizedPhone.length >= 7) {
    conditions.push({
      phone: { $regex: normalizedPhone.slice(-7), $options: 'i' },
    });
  }

  if (name && company) {
    const trimmedName = name.trim();
    const trimmedCompany = company.trim();
    if (trimmedName && trimmedCompany) {
      conditions.push({
        name: { $regex: `^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
        company: { $regex: `^${trimmedCompany.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      });
    }
  }

  if (!conditions.length) return [];

  const filter = {
    owner: ownerId,
    $or: conditions,
  };

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  const duplicates = await Lead.find(filter)
    .select('name email phone company status createdAt')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return duplicates.map((lead) => ({
    ...lead,
    matchReason: getMatchReason(lead, { email, phone, name, company }),
  }));
};

const getMatchReason = (lead, input) => {
  if (input.email && lead.email === input.email.toLowerCase().trim()) {
    return 'email';
  }
  const inputPhone = normalizePhone(input.phone);
  const leadPhone = normalizePhone(lead.phone);
  if (inputPhone.length >= 7 && leadPhone.includes(inputPhone.slice(-7))) {
    return 'phone';
  }
  if (
    input.name &&
    input.company &&
    lead.name.toLowerCase() === input.name.trim().toLowerCase() &&
    lead.company.toLowerCase() === input.company.trim().toLowerCase()
  ) {
    return 'name_company';
  }
  return 'similar';
};

module.exports = { findDuplicates, normalizePhone };
