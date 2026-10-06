import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTH_NAMES_LONG = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
] as const;

const MONTH_NAMES_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
] as const;

export interface MonthPickerProps {
  id?: string;
  /** ISO date string for the 1st of the month: 'YYYY-MM-01' */
  value: string;
  /** Emits 'YYYY-MM-01' */
  onChange: (value: string) => void;
  /** Minimum selectable month: 'YYYY-MM-01' */
  min?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const MonthPicker: React.FC<MonthPickerProps> = ({
  id,
  value,
  onChange,
  min,
  placeholder = 'Seleccionar mes',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse currently selected date
  const selectedDate = value ? new Date(value + (value.length === 7 ? '-01T00:00:00' : 'T00:00:00')) : null;
  const minDate = min ? new Date(min + (min.length === 7 ? '-01T00:00:00' : 'T00:00:00')) : null;

  // Active year in the picker view
  const currentYearNow = new Date().getFullYear();
  const [viewYear, setViewYear] = useState<number>(() => {
    if (selectedDate && !isNaN(selectedDate.getTime())) return selectedDate.getFullYear();
    if (minDate && !isNaN(minDate.getTime())) return minDate.getFullYear();
    return currentYearNow;
  });

  // Keep viewYear in sync when value changes externally
  useEffect(() => {
    if (!value) return;
    const parsed = new Date(value + (value.length === 7 ? '-01T00:00:00' : 'T00:00:00'));
    if (!isNaN(parsed.getTime())) {
      setViewYear(parsed.getFullYear());
    }
  }, [value]);

  const updateDropdownPosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownWidth = Math.max(rect.width, 280);
    
    // Check if it overflows screen to the right
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

  // Close on click outside or escape key
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

  const isMonthDisabled = (monthIndex: number): boolean => {
    if (!minDate || isNaN(minDate.getTime())) return false;
    const candidate = new Date(viewYear, monthIndex, 1);
    const minMonthStart = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    return candidate < minMonthStart;
  };

  const isMonthSelected = (monthIndex: number): boolean => {
    if (!selectedDate || isNaN(selectedDate.getTime())) return false;
    return selectedDate.getFullYear() === viewYear && selectedDate.getMonth() === monthIndex;
  };

  const isCurrentMonthNow = (monthIndex: number): boolean => {
    const now = new Date();
    return now.getFullYear() === viewYear && now.getMonth() === monthIndex;
  };

  const handleSelectMonth = (monthIndex: number) => {
    if (isMonthDisabled(monthIndex)) return;
    const formattedMonth = String(monthIndex + 1).padStart(2, '0');
    const isoString = `${viewYear}-${formattedMonth}-01`;
    onChange(isoString);
    handleClose();
  };

  const formattedDisplay = () => {
    if (!selectedDate || isNaN(selectedDate.getTime())) return null;
    return `${MONTH_NAMES_LONG[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
  };

  const minYear = minDate && !isNaN(minDate.getTime()) ? minDate.getFullYear() : currentYearNow - 1;
  const canGoPrevYear = viewYear > minYear;

  return (
    <>
      <div className="relative w-full">
        <button
          ref={triggerRef}
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => (isOpen ? handleClose() : handleOpen())}
          className={`w-full flex items-center justify-between p-2.5 pr-10 rounded-xl border border-outline-variant bg-surface text-body-md text-left transition-colors cursor-pointer focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-outline'
          }`}
        >
          <span className={value ? 'text-on-surface font-medium capitalize' : 'text-on-surface-variant/50'}>
            {formattedDisplay() || placeholder}
          </span>
        </button>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-on-surface-variant">
          <CalendarDays size={16} />
        </div>
      </div>

      {isOpen && dropPos && document.body && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: dropPos.top,
            left: dropPos.left,
            width: dropPos.width,
            zIndex: 50,
          }}
          className="rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-xl p-3.5 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150 select-none"
        >
          {/* Header with year navigation */}
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              disabled={!canGoPrevYear}
              onClick={() => setViewYear((y) => y - 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Año anterior"
            >
              <ChevronLeft size={18} />
            </button>

            <span className="text-sm font-bold text-on-surface">
              {viewYear}
            </span>

            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              aria-label="Año siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Month grid: 3 rows x 4 columns */}
          <div className="grid grid-cols-4 gap-1.5">
            {MONTH_NAMES_SHORT.map((monthName, idx) => {
              const disabledMonth = isMonthDisabled(idx);
              const selected = isMonthSelected(idx);
              const isTodayMonth = isCurrentMonthNow(idx);

              let cellStyle = 'h-10 rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ';
              if (selected) {
                cellStyle += 'bg-primary text-on-primary shadow-xs font-bold';
              } else if (disabledMonth) {
                cellStyle += 'text-on-surface-variant/30 cursor-not-allowed hover:bg-transparent';
              } else if (isTodayMonth) {
                cellStyle += 'border border-primary text-primary font-bold hover:bg-primary/10';
              } else {
                cellStyle += 'text-on-surface hover:bg-surface-container active:scale-95';
              }

              return (
                <button
                  key={monthName}
                  type="button"
                  disabled={disabledMonth}
                  onClick={() => handleSelectMonth(idx)}
                  className={cellStyle}
                  title={MONTH_NAMES_LONG[idx]}
                >
                  {monthName}
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

export default MonthPicker;
