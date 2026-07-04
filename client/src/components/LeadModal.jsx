import { useState, useEffect, useRef, useCallback } from 'react';
import { LEAD_STATUSES, LEAD_SOURCES } from '../constants';
import TagInput from './TagInput';
import CustomFieldsEditor from './CustomFieldsEditor';
import DuplicateWarningModal from './DuplicateWarningModal';
import { createLead, updateLead, checkDuplicates } from '../services/leadService';

const defaultForm = {
  name: '',
  email: '',
  phone: '',
  company: '',
  status: 'New',
  source: 'other',
  tags: [],
  customFields: [],
  notes: '',
};

const LeadModal = ({ isOpen, onClose, onSubmit, initialData, loading: externalLoading }) => {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [duplicates, setDuplicates] = useState(null);
  const [pendingPayload, setPendingPayload] = useState(null);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        company: initialData.company || '',
        status: initialData.status || 'New',
        source: initialData.source || 'other',
        tags: initialData.tags || [],
        customFields: initialData.customFields || [],
        notes: initialData.notes || '',
      });
    } else {
      setForm(defaultForm);
    }
    setErrors({});
    setDuplicates(null);
    setPendingPayload(null);
  }, [initialData, isOpen]);

  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email format';
    return e;
  };

  const buildPayload = useCallback(() => ({
    ...form,
    tags: form.tags,
    customFields: form.customFields.filter((f) => f.key.trim()),
  }), [form]);

  const saveLead = useCallback(async (payload, force = false) => {
    setSubmitting(true);
    try {
      if (initialData) {
        await updateLead(initialData._id, payload);
      } else {
        await createLead({ ...payload, force });
      }
      onSubmit(payload);
    } catch (err) {
      if (err.response?.status === 409) {
        setDuplicates(err.response.data.data?.duplicates || []);
        setPendingPayload(payload);
      } else {
        setErrors({ form: err.response?.data?.message || 'Failed to save lead' });
      }
    } finally {
      setSubmitting(false);
    }
  }, [initialData, onSubmit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length) {
      setErrors(validation);
      return;
    }
    const payload = buildPayload();
    try {
      const res = await checkDuplicates({
        email: payload.email,
        phone: payload.phone,
        name: payload.name,
        company: payload.company,
        excludeId: initialData?._id,
      });
      if (res.data.hasDuplicates) {
        setDuplicates(res.data.duplicates);
        setPendingPayload(payload);
        return;
      }
    } catch {
      // proceed with save if check fails
    }
    await saveLead(payload);
  };

  const handleForceCreate = async () => {
    if (pendingPayload) {
      await saveLead(pendingPayload, true);
      setDuplicates(null);
      setPendingPayload(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  if (!isOpen) return null;

  const loading = submitting || externalLoading;

  return (
    <>
      <div
        className="modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="modal modal--lg">
          <div className="modal__header">
            <h2 id="modal-title">{initialData ? 'Edit Lead' : 'New Lead'}</h2>
            <button type="button" className="modal__close" onClick={onClose} aria-label="Close modal">✕</button>
          </div>

          {errors.form && (
            <div className="alert alert--error" style={{ margin: '0 1.25rem' }}>{errors.form}</div>
          )}

          <form id="lead-form" className="modal__form" onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="lead-name">Name *</label>
                <input
                  id="lead-name"
                  ref={firstInputRef}
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={errors.name ? 'input--error' : ''}
                  autoComplete="off"
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="lead-email">Email *</label>
                <input
                  id="lead-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className={errors.email ? 'input--error' : ''}
                  autoComplete="off"
                />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="lead-phone">Phone</label>
                <input
                  id="lead-phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="form-group">
                <label htmlFor="lead-company">Company</label>
                <input
                  id="lead-company"
                  name="company"
                  type="text"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Acme Inc."
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="lead-status">Status</label>
                <select id="lead-status" name="status" value={form.status} onChange={handleChange}>
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="lead-source">Source</label>
                <select id="lead-source" name="source" value={form.source} onChange={handleChange}>
                  {LEAD_SOURCES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Tags</label>
              <TagInput
                tags={form.tags}
                onChange={(tags) => setForm((prev) => ({ ...prev, tags }))}
              />
            </div>

            <CustomFieldsEditor
              fields={form.customFields}
              onChange={(customFields) => setForm((prev) => ({ ...prev, customFields }))}
            />

            <div className="form-group">
              <label htmlFor="lead-notes">Notes</label>
              <textarea
                id="lead-notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Add any notes about this lead..."
                rows={3}
                maxLength={500}
              />
              <span className="char-count">{form.notes.length}/500</span>
            </div>
          </form>

          <div className="modal__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" form="lead-form" className="btn btn--primary" disabled={loading}>
              {loading ? 'Saving…' : initialData ? 'Save Changes' : 'Create Lead'}
            </button>
          </div>
        </div>
      </div>

      {duplicates && (
        <DuplicateWarningModal
          duplicates={duplicates}
          onConfirm={handleForceCreate}
          onCancel={() => { setDuplicates(null); setPendingPayload(null); }}
          loading={loading}
        />
      )}
    </>
  );
};

export default LeadModal;
