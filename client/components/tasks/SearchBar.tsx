'use client';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder,
  className = '',
}: SearchBarProps) {
  return (
    <div className={`task-search-wrapper ${className}`}>
      <Search className="task-search-icon" aria-hidden="true" />
      <input
        id="task-search"
        type="text"
        className="input task-search-input"
        placeholder={placeholder || 'Search tasks by title, assigned by…'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search tasks"
        autoComplete="off"
        spellCheck="false"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="task-search-clear-btn"
          aria-label="Clear search text"
          title="Clear search"
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
      )}
    </div>
  );
}
