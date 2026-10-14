'use client';
import { useRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit?: (val: string) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder,
  className = '',
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (onSubmit) {
        onSubmit(value);
      }
      // On mobile viewports, blur input to dismiss virtual keyboard and show results
      if (typeof window !== 'undefined' && window.innerWidth <= 768) {
        inputRef.current?.blur();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleClear();
    }
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange('');
    }
    inputRef.current?.focus();
  };

  return (
    <div className={`task-search-wrapper ${value ? 'has-value' : ''} ${className}`}>
      <Search
        className="task-search-icon"
        strokeWidth={2.2}
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        id="task-search"
        type="text"
        className="input task-search-input"
        placeholder={placeholder || 'Search tasks by title, assigned by…'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        enterKeyHint="search"
        inputMode="search"
        aria-label="Search tasks"
        autoComplete="off"
        spellCheck="false"
        style={{
          paddingLeft: 42,
          paddingRight: value ? 38 : 16,
        }}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="task-search-clear-btn"
          aria-label="Clear search text"
          title="Clear search"
        >
          <X style={{ width: 14, height: 14 }} strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
}

