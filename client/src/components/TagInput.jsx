import { useState, useCallback } from 'react';

const TagInput = ({ tags = [], onChange, placeholder = 'Add tag and press Enter…' }) => {
  const [input, setInput] = useState('');

  const addTag = useCallback((raw) => {
    const tag = raw.trim().toLowerCase();
    if (!tag || tags.includes(tag) || tags.length >= 20) return;
    onChange([...tags, tag]);
    setInput('');
  }, [tags, onChange]);

  const removeTag = useCallback((tag) => {
    onChange(tags.filter((t) => t !== tag));
  }, [tags, onChange]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="tag-input">
      <div className="tag-input__chips">
        {tags.map((tag) => (
          <span key={tag} className="tag-chip">
            {tag}
            <button
              type="button"
              className="tag-chip__remove"
              onClick={() => removeTag(tag)}
              aria-label={`Remove tag ${tag}`}
            >
              ✕
            </button>
          </span>
        ))}
        <input
          type="text"
          className="tag-input__field"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => input.trim() && addTag(input)}
          placeholder={tags.length ? '' : placeholder}
          aria-label="Add tag"
        />
      </div>
    </div>
  );
};

export default TagInput;
