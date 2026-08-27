import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import type { SelectOption } from './Select';

export interface MultiSelectProps {
  id?: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

/**
 * Reusable Multi-Select Dropdown component with checklists.
 * Follows SOLID principles and design system tokens.
 */
export const MultiSelect: React.FC<MultiSelectProps> = ({
  id,
  value,
  onChange,
  options,
  placeholder = 'Seleccionar opciones',
  className = '',
  disabled = false,
  'aria-label': ariaLabel,
}) => {
  const generatedId = useId();
  const selectId = id || generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleToggle = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  // Get labels of selected options
  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  const renderTriggerLabel = () => {
    if (selectedOptions.length === 0) {
      return <span className="text-on-surface-variant/60">{placeholder}</span>;
    }

    if (selectedOptions.length === 1) {
      const single = selectedOptions[0];
      return (
        <span className="flex items-center gap-2 text-on-surface truncate">
          {single.icon && <span className="flex-shrink-0">{single.icon}</span>}
          <span className="truncate">{single.label}</span>
        </span>
      );
    }

    return (
      <span className="flex items-center gap-2 text-on-surface truncate">
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
          {selectedOptions.length}
        </span>
        <span className="truncate text-body-md font-medium">
          {selectedOptions.map((o) => o.label).join(', ')}
        </span>
      </span>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border border-outline-variant text-body-md text-on-surface bg-surface-container-lowest focus:outline-none focus:border-on-surface focus:ring-2 focus:ring-secondary-container transition-all cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <div className="flex items-center gap-2 truncate pr-2">
          {renderTriggerLabel()}
        </div>
        <ChevronDown
          size={16}
          className={`text-on-surface-variant flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-on-surface' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-labelledby={selectId}
          aria-multiselectable="true"
          className="absolute left-0 right-0 top-full mt-0.5 z-50 max-h-64 overflow-y-auto rounded-xl border border-outline-variant bg-surface-container-lowest shadow-lg py-1.5 px-1 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-0.5"
        >
          {options.map((option) => {
            const isChecked = value.includes(option.value);
            return (
              <div
                key={option.value}
                role="option"
                aria-selected={isChecked}
                onClick={() => handleToggle(option.value)}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-body-md cursor-pointer transition-colors select-none ${
                  isChecked
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-on-surface hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 ${
                      isChecked
                        ? 'bg-primary border-primary text-white'
                        : 'border-outline-variant bg-surface'
                    }`}
                    aria-hidden="true"
                  >
                    {isChecked && <Check size={12} strokeWidth={3} />}
                  </div>
                  {option.icon && (
                    <span className={`flex-shrink-0 ${isChecked ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {option.icon}
                    </span>
                  )}
                  <span className="truncate text-xs">{option.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
