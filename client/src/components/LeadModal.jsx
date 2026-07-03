import { useState, useEffect, useRef } from 'react';
import { LEAD_STATUSES } from '../constants';

const defaultForm = {
  name: '',
  email: '',
  phone: '',
  company: '',
  status: 'New',
  notes: '',
};

const LeadModal = ({ isOpen, onClose, onSubmit, initialData, loading }) => {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        company: initialData.company || '',
        status: initialData.status || 'New',
        notes: initialData.notes || '',
      });
    } else {
      setForm(defaultForm);
    }
    setErrors({});
  }, [initialData, isOpen]);

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email format';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length) {
      setErrors(validation);
      return;
    }
    onSubmit(form);
  };

  // Backdrop click closes modal
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={handleOverlayClick}
    >
      <div className="modal">
        <div className="modal__header">
          <h2 id="modal-title">{initialData ? 'Edit Lead' : 'New Lead'}</h2>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Form ends BEFORE footer — footer buttons are outside form scope */}
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

          <div className="form-group">
            <label htmlFor="lead-status">Status</label>
            <select id="lead-status" name="status" value={form.status} onChange={handleChange}>
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

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

        {/* Footer outside the form — buttons use form="lead-form" to associate */}
        <div className="modal__footer">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="lead-form"
            className="btn btn--primary"
            disabled={loading}
          >
            {loading ? 'Saving…' : initialData ? 'Save Changes' : 'Create Lead'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadModal;
