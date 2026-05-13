import { useEffect, useRef, useState } from 'react';
import { BiChevronDown, BiCheck } from 'react-icons/bi';

interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
}

export default function CustomSelect({ value, options, onChange, disabled, id }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((p) => !p); }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const idx = options.findIndex((o) => o.value === value);
      const next = options[Math.min(idx + 1, options.length - 1)];
      if (next) onChange(next.value);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = options.findIndex((o) => o.value === value);
      const prev = options[Math.max(idx - 1, 0)];
      if (prev) onChange(prev.value);
    }
  };

  return (
    <div ref={ref} className="cselect-root" style={{ position: 'relative' }}>
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        className={`cselect-trigger admin-btn admin-btn-secondary${open ? ' is-open' : ''}`}
        onClick={() => !disabled && setOpen((p) => !p)}
        onKeyDown={handleKey}
      >
        <span className="cselect-value">{selected?.label ?? value}</span>
        <BiChevronDown size={16} className={`cselect-chevron${open ? ' rotated' : ''}`} />
      </button>

      {open && (
        <ul role="listbox" className="cselect-menu">
          {options.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`cselect-option${opt.value === value ? ' is-selected' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(opt.value);
                setOpen(false);
              }}
            >
              <span>{opt.label}</span>
              {opt.value === value && <BiCheck size={15} className="cselect-check" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
