import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
] as const;

const WEEKDAY_NAMES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'] as const;

export interface DatePickerProps {
  id?: string;
  /** ISO date string: 'YYYY-MM-DD' */
  value: string;
  /** Emits 'YYYY-MM-DD' */
  onChange: (value: string) => void;
  /** Minimum selectable date: 'YYYY-MM-DD' */
  min?: string;
  /** Maximum selectable date: 'YYYY-MM-DD' */
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  id,
  value,
  onChange,
  min,
  max,
  placeholder = 'Selecciona una fecha',
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const parseDate = (dStr?: string): Date | null => {
    if (!dStr || !/^\d{4}-\d{2}-\d{2}$/.test(dStr)) return null;
    const [y, m, d] = dStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return isNaN(date.getTime()) ? null : date;
  };

  const selectedDate = parseDate(value);
  const minDate = parseDate(min);
  const maxDate = parseDate(max);

  const now = new Date();
  const [viewYear, setViewYear] = useState<number>(() => {
    if (selectedDate) return selectedDate.getFullYear();
    if (minDate) return minDate.getFullYear();
    return now.getFullYear();
  });

  const [viewMonth, setViewMonth] = useState<number>(() => {
    if (selectedDate) return selectedDate.getMonth();
    if (minDate) return minDate.getMonth();
    return now.getMonth();
  });

  useEffect(() => {
    if (!value) return;
    const parsed = parseDate(value);
    if (parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
  }, [value]);

  const updateDropdownPosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownWidth = 300;
    
    let left = rect.left;
    if (left + dropdownWidth > window.innerWidth - 16) {
      left = window.innerWidth - dropdownWidth - 16;
    }

    setDropPos({
      top: rect.bottom + 6,
      left: Math.max(16, left),
      width: dropdownWidth,
    });
  };

  const handleOpen = () => {
    if (disabled) return;
    updateDropdownPosition();
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updateDropdownPosition);
    window.addEventListener('scroll', updateDropdownPosition, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [isOpen]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const isDayDisabled = (year: number, month: number, day: number): boolean => {
    const candidate = new Date(year, month, day);
    if (minDate) {
      const minStart = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
      if (candidate < minStart) return true;
    }
    if (maxDate) {
      const maxEnd = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
      if (candidate > maxEnd) return true;
    }
    return false;
  };

  const isDaySelected = (year: number, month: number, day: number): boolean => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === day
    );
  };

  const isDayToday = (year: number, month: number, day: number): boolean => {
    return (
      now.getFullYear() === year &&
      now.getMonth() === month &&
      now.getDate() === day
    );
  };

  const handleSelectDay = (year: number, month: number, day: number) => {
    if (isDayDisabled(year, month, day)) return;
    const yStr = String(year);
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    onChange(`${yStr}-${mStr}-${dStr}`);
    handleClose();
  };

  // Build grid: days of current month + leading empty days (Monday first)
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday, 1 = Monday
  const leadingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const formattedDisplay = () => {
    if (!selectedDate) return null;
    return `${selectedDate.getDate()} de ${MONTH_NAMES[selectedDate.getMonth()]} de ${selectedDate.getFullYear()}`;
  };

  return (
    <>
      <div className="relative w-full">
        <button
          ref={triggerRef}
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => (isOpen ? handleClose() : handleOpen())}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border border-outline-variant bg-surface text-body-md text-left transition-colors cursor-pointer focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-outline'
          } ${className}`}
        >
          <span className={value ? 'text-on-surface font-medium' : 'text-secondary/60'}>
            {formattedDisplay() || placeholder}
          </span>
          <span className="text-secondary pointer-events-none shrink-0 ml-2">
            <CalendarDays size={16} />
          </span>
        </button>
      </div>

      {isOpen && dropPos && document.body && createPortal(
        <div
          ref={dropdownRef}
          data-datepicker-portal="true"
          style={{
            position: 'fixed',
            top: dropPos.top,
            left: dropPos.left,
            width: dropPos.width,
            zIndex: 60,
          }}
          className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest shadow-2xl p-4 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150 select-none"
        >
          {/* Header navigation */}
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-secondary hover:text-on-surface transition-colors cursor-pointer"
              aria-label="Mes anterior"
            >
              <ChevronLeft size={18} />
            </button>

            <span className="text-sm font-bold text-on-surface">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-secondary hover:text-on-surface transition-colors cursor-pointer"
              aria-label="Mes siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAY_NAMES.map((w) => (
              <span key={w} className="text-[11px] font-bold text-secondary/70 py-1">
                {w}
              </span>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Leading blank slots */}
            {Array.from({ length: leadingDays }).map((_, idx) => (
              <div key={`blank-${idx}`} className="h-8" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const disabledDay = isDayDisabled(viewYear, viewMonth, dayNum);
              const selected = isDaySelected(viewYear, viewMonth, dayNum);
              const today = isDayToday(viewYear, viewMonth, dayNum);

              let cellStyle = 'h-8 rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ';
              if (selected) {
                cellStyle += 'bg-primary text-white shadow-xs font-bold';
              } else if (disabledDay) {
                cellStyle += 'text-secondary/30 cursor-not-allowed hover:bg-transparent';
              } else if (today) {
                cellStyle += 'border border-primary text-primary font-bold hover:bg-primary/10';
              } else {
                cellStyle += 'text-on-surface hover:bg-surface-container active:scale-95';
              }

              return (
                <button
                  key={dayNum}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => handleSelectDay(viewYear, viewMonth, dayNum)}
                  className={cellStyle}
                  aria-label={`${dayNum} de ${MONTH_NAMES[viewMonth]}`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default DatePicker;
