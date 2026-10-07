'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface BrandSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  id?: string;
  ariaLabel?: string;
  required?: boolean;
  variant?: 'field' | 'bare';
  icon?: React.ReactNode;
}

export default function BrandSelect({
  value, onChange, options, placeholder = 'Select', id, ariaLabel, required, variant = 'field', icon,
}: BrandSelectProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
  };

  const onTriggerKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) { setOpen(true); setHighlight(Math.max(0, options.findIndex((o) => o.value === value))); return; }
      const delta = e.key === 'ArrowDown' ? 1 : -1;
      setHighlight((h) => (h + delta + options.length) % options.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (open && highlight >= 0) choose(highlight); else setOpen(!open);
    }
  };

  return (
    <div ref={rootRef} className={`bselect bselect-${variant} ${open ? 'open' : ''}`}>
      <button
        type="button"
        id={id}
        className="bselect-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => { setOpen(!open); setHighlight(options.findIndex((o) => o.value === value)); }}
        onKeyDown={onTriggerKey}
      >
        {icon && <span className="bselect-icon">{icon}</span>}
        <span className={`bselect-value ${selected ? '' : 'placeholder'}`}>{selected?.label ?? placeholder}</span>
        <ChevronDown size={16} className="bselect-chevron" />
      </button>

      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          required
          value={value}
          onChange={() => {}}
          className="bselect-validator"
        />
      )}

      {open && (
        <ul id={listId} role="listbox" className="bselect-menu" aria-activedescendant={highlight >= 0 ? `${listId}-${highlight}` : undefined}>
          {options.map((o, i) => {
            const isSelected = o.value === value;
            return (
              <li
                key={o.value || `__${i}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={isSelected}
                className={`bselect-option ${isSelected ? 'selected' : ''} ${highlight === i ? 'highlight' : ''}`}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => choose(i)}
              >
                <span>{o.label}</span>
                {isSelected && <Check size={15} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
