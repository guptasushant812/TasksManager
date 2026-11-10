'use client';
import { useRef, useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  mobilePlaceholder?: string;
  className?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search tasks by title, description, assigned by...',
  mobilePlaceholder = 'Search by task or person...',
  className = '',
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(placeholder);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const updatePlaceholder = () => {
      setCurrentPlaceholder(mq.matches ? mobilePlaceholder : placeholder);
    };
    updatePlaceholder();
    mq.addEventListener('change', updatePlaceholder);
    return () => mq.removeEventListener('change', updatePlaceholder);
  }, [placeholder, mobilePlaceholder]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) && document.activeElement !== inputRef.current) {
        const tagName = document.activeElement?.tagName.toLowerCase();
        if (tagName !== 'input' && tagName !== 'textarea') {
          e.preventDefault();
          inputRef.current?.focus();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`task-search-wrap ${className}`.trim()}>
      <Search className="task-search-icon" />
      <input
        ref={inputRef}
        id="task-search"
        type="text"
        className="task-search-input"
        placeholder={currentPlaceholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search tasks"
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
          className="task-search-clear"
          aria-label="Clear search"
          title="Clear search"
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
      ) : (
        <kbd className="task-search-kbd" aria-hidden="true">/</kbd>
      )}
    </div>
  );
}
