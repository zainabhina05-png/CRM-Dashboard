import { useCallback } from 'react';

const CustomFieldsEditor = ({ fields = [], onChange }) => {
  const addField = useCallback(() => {
    if (fields.length >= 10) return;
    onChange([...fields, { key: '', value: '' }]);
  }, [fields, onChange]);

  const updateField = useCallback((index, prop, value) => {
    const next = fields.map((f, i) => (i === index ? { ...f, [prop]: value } : f));
    onChange(next);
  }, [fields, onChange]);

  const removeField = useCallback((index) => {
    onChange(fields.filter((_, i) => i !== index));
  }, [fields, onChange]);

  return (
    <div className="custom-fields">
      <div className="custom-fields__header">
        <label>Custom Fields</label>
        <button
          type="button"
          className="btn btn--sm btn--ghost"
          onClick={addField}
          disabled={fields.length >= 10}
        >
          + Add Field
        </button>
      </div>
      {fields.length === 0 ? (
        <p className="custom-fields__empty">No custom fields. Add fields specific to your business.</p>
      ) : (
        <div className="custom-fields__list">
          {fields.map((field, index) => (
            <div key={index} className="custom-fields__row">
              <input
                type="text"
                placeholder="Field name"
                value={field.key}
                onChange={(e) => updateField(index, 'key', e.target.value)}
                aria-label={`Custom field ${index + 1} name`}
              />
              <input
                type="text"
                placeholder="Value"
                value={field.value}
                onChange={(e) => updateField(index, 'value', e.target.value)}
                aria-label={`Custom field ${index + 1} value`}
              />
              <button
                type="button"
                className="btn btn--sm btn--danger-ghost btn--icon"
                onClick={() => removeField(index)}
                aria-label="Remove custom field"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomFieldsEditor;
