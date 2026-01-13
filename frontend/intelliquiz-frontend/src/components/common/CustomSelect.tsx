import { useState, useRef, useEffect } from 'react';
import { BiChevronDown, BiCheck } from 'react-icons/bi';
import './CustomSelect.css';

interface Option {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  options: Option[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && listRef.current && highlightedIndex >= 0) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          const opt = options[highlightedIndex];
          if (!opt.disabled) {
            onChange(opt.value);
            setIsOpen(false);
          }
        } else {
          setIsOpen(true);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) => 
            prev < options.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (opt: Option) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`custom-select ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''} ${className}`}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
    >
      <div className="custom-select-trigger" onClick={() => !disabled && setIsOpen(!isOpen)}>
        <span className={`custom-select-value ${!selectedOption ? 'placeholder' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <BiChevronDown className={`custom-select-arrow ${isOpen ? 'rotated' : ''}`} size={20} />
      </div>
      
      {isOpen && (
        <ul ref={listRef} className="custom-select-dropdown">
          {options.map((opt, index) => (
            <li
              key={opt.value}
              className={`custom-select-option ${opt.value === value ? 'selected' : ''} ${opt.disabled ? 'disabled' : ''} ${index === highlightedIndex ? 'highlighted' : ''}`}
              onClick={() => handleSelect(opt)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <span>{opt.label}</span>
              {opt.value === value && <BiCheck size={18} className="check-icon" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
