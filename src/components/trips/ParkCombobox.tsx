'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { PARKS } from '@/data/parks';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/cn';
import type { Park } from '@/types/domain';

interface ParkComboboxProps {
  /** Park ids to hide from the options (already added). */
  excludeIds: Set<string>;
  onSelect: (park: Park) => void;
  placeholder?: string;
}

export function ParkCombobox({ excludeIds, onSelect, placeholder }: ParkComboboxProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PARKS.filter(
      (p) => !excludeIds.has(p.id) && (!q || p.fullName.toLowerCase().includes(q)),
    ).slice(0, 8);
  }, [query, excludeIds]);

  // Close when clicking outside.
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  function select(park: Park) {
    onSelect(park);
    setQuery('');
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        role="combobox"
        aria-expanded={open}
        aria-controls="park-combobox-list"
        aria-label="Add a park"
        placeholder={placeholder ?? 'Add a park to this trip…'}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlighted(0);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlighted((h) => Math.min(h + 1, options.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlighted((h) => Math.max(h - 1, 0));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            if (options[highlighted]) select(options[highlighted]);
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
        className="pl-9"
      />
      {open && options.length > 0 && (
        <ul
          id="park-combobox-list"
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-border bg-card py-1 shadow-lg"
        >
          {options.map((park, i) => (
            <li key={park.id} role="option" aria-selected={i === highlighted}>
              <button
                type="button"
                onClick={() => select(park)}
                onMouseEnter={() => setHighlighted(i)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm',
                  i === highlighted && 'bg-muted',
                )}
              >
                <span className="font-medium">{park.name}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {park.states.join(' · ')}
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
