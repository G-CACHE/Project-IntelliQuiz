import { useEffect, useRef, useState } from 'react';
import { BiChevronDown, BiCheck } from 'react-icons/bi';

type SelectValue = string | number;

export interface SelectOption<Value extends SelectValue = string> {
  value: Value;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps<Value extends SelectValue = string> {
  value: Value;
  options: SelectOption<Value>[];
  onChange: (value: Value) => void;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
  compact?: boolean;
  dropUp?: boolean;
}

const toKey = (value: SelectValue) => String(value);

export default function CustomSelect<Value extends SelectValue = string>({ value, options, onChange, disabled, id, placeholder, compact, dropUp }: CustomSelectProps<Value>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const allOptions: SelectOption<Value>[] = placeholder
    ? [{ value: '' as Value, label: placeholder, disabled: true }, ...options]
    : options;

  const selected = allOptions.find((o) => toKey(o.value) === toKey(value));

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((p) => !p); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const enabledOptions = allOptions.filter((option) => !option.disabled);
      const idx = enabledOptions.findIndex((o) => toKey(o.value) === toKey(value));
      const next = enabledOptions[Math.min(idx + 1, enabledOptions.length - 1)];
      if (next) onChange(next.value);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const enabledOptions = allOptions.filter((option) => !option.disabled);
      const idx = enabledOptions.findIndex((o) => toKey(o.value) === toKey(value));
      const prev = enabledOptions[Math.max(idx - 1, 0)];
      if (prev) onChange(prev.value);
    }
  };

  const isPlaceholderSelected = placeholder && toKey(value) === '';

  return (
    <div ref={ref} className={`cselect-root${compact ? ' cselect-compact' : ''}`} style={{ position: 'relative' }}>
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        className={`cselect-trigger admin-btn admin-btn-secondary${open ? ' is-open' : ''}${isPlaceholderSelected ? ' is-placeholder' : ''}`}
        onClick={() => !disabled && setOpen((p) => !p)}
        onKeyDown={handleKey}
      >
        <span className="cselect-value">{selected?.label ?? (placeholder || value)}</span>
        <BiChevronDown size={16} className={`cselect-chevron${open ? ' rotated' : ''}`} />
      </button>

      {open && (
        <ul role="listbox" className={`cselect-menu${dropUp ? ' cselect-menu-up' : ''}`}>
          {allOptions.map((opt) => {
            const isPlaceholderOpt = placeholder && toKey(opt.value) === '';
            const isSelected = toKey(opt.value) === toKey(value);
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                className={`cselect-option${isSelected ? ' is-selected' : ''}${isPlaceholderOpt ? ' is-placeholder-opt' : ''}${opt.disabled ? ' is-disabled' : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (opt.disabled) return;
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <span>{opt.label}</span>
                {isSelected && !isPlaceholderOpt && <BiCheck size={15} className="cselect-check" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
