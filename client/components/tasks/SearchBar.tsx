'use client';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', width: 16, height: 16, pointerEvents: 'none' }} />
      <input
        id="task-search"
        type="text"
        className="input"
        placeholder="Search tasks by title, description, assigned by…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ paddingLeft: 36 }}
      />
    </div>
  );
}
