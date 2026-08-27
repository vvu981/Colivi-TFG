import React, { useCallback, useId, useMemo, useState } from 'react';

// ── Types & Interfaces ─────────────────────────────────────────────────────────

export interface PriceRangeFilterProps {
  /** Valor mínimo permitido en la escala (default: 0) */
  min?: number;
  /** Valor máximo permitido en la escala (debe ser el precio del anuncio más caro) */
  max?: number;
  /** Paso de incremento/decremento (default: 10) */
  step?: number;
  /** Valor mínimo inicial seleccionado (default: min) */
  initialMin?: number;
  /** Valor máximo inicial seleccionado (default: max) */
  initialMax?: number;
  /** Array de frecuencias/alturas para renderizar las barras del histograma */
  data?: number[];
  /** Símbolo de moneda mostrado en los inputs (default: '€') */
  currencySymbol?: string;
  /** Título principal de la cabecera */
  title?: string;
  /** Subtítulo descriptivo */
  subtitle?: string;
  /** Clases CSS adicionales para el contenedor principal */
  className?: string;
  /** Callback disparado ante cambios en los límites de precio */
  onChange?: (range: { min: number; max: number }) => void;
}

interface PriceBoundInputProps {
  id: string;
  label: string;
  value: number;
  currencySymbol: string;
  minBound: number;
  maxBound: number;
  onCommit: (newValue: number) => void;
}

// ── Helpers (Pure Functions - Single Responsibility) ──────────────────────────

/**
 * Limita un valor numérico dentro de los límites [min, max].
 */
const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Determina si una barra del histograma se encuentra dentro del rango activo seleccionado.
 */
const isBarActive = (
  barIndex: number,
  totalBars: number,
  min: number,
  max: number,
  currentMin: number,
  currentMax: number
): boolean => {
  if (totalBars <= 0) return false;
  const range = max - min || 1;
  const stepPerBar = range / totalBars;
  const barStart = min + barIndex * stepPerBar;
  const barEnd = barStart + stepPerBar;

  return barEnd >= currentMin && barStart <= currentMax;
};

// ── Sub-componente: Input Numérico Capsular ───────────────────────────────────

const PriceBoundInput: React.FC<PriceBoundInputProps> = React.memo(({
  id,
  label,
  value,
  currencySymbol,
  minBound,
  maxBound,
  onCommit,
}) => {
  const [localText, setLocalText] = useState<string>(value.toString());

  // Sincronizar texto local si el valor externo cambia vía slider o prop
  React.useEffect(() => {
    setLocalText(value.toString());
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    setLocalText(rawVal);
  };

  const handleBlur = () => {
    const parsed = parseInt(localText, 10);
    if (isNaN(parsed) || localText === '') {
      setLocalText(minBound.toString());
      onCommit(minBound);
      return;
    }
    const clamped = clamp(parsed, minBound, maxBound);
    setLocalText(clamped.toString());
    onCommit(clamped);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="flex flex-col items-center flex-1 min-w-0">
      <label htmlFor={id} className="text-label-sm text-on-surface-variant font-medium mb-1 select-none">
        {label}
      </label>
      <div className="flex items-center justify-center w-full min-w-[90px] h-10 rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1.5 shadow-xs transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <span className="text-xs font-bold text-on-surface-variant select-none mr-1">
          {currencySymbol}
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={localText}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full min-w-0 bg-transparent text-center text-xs font-bold text-on-surface outline-none"
          aria-label={`${label} (${currencySymbol})`}
        />
      </div>
    </div>
  );
});

PriceBoundInput.displayName = 'PriceBoundInput';

// ── Componente Principal: PriceRangeFilter ────────────────────────────────────

export const PriceRangeFilter: React.FC<PriceRangeFilterProps> = ({
  min = 0,
  max = 1000,
  step = 10,
  initialMin,
  initialMax,
  data = [],
  currencySymbol = '€',
  title = 'Rango de precios',
  subtitle = 'Precio del viaje, incluye todas las comisiones',
  className = '',
  onChange,
}) => {
  const minInputId = useId();
  const maxInputId = useId();

  // Estado local
  const [minValue, setMinValue] = useState<number>(() => initialMin ?? min);
  const [maxValue, setMaxValue] = useState<number>(() => initialMax ?? max);

  // Sincronizar estado local si cambian los límites externos
  React.useEffect(() => {
    if (initialMin !== undefined) {
      setMinValue(clamp(initialMin, min, max));
    }
  }, [initialMin, min, max]);

  React.useEffect(() => {
    if (initialMax !== undefined) {
      setMaxValue(clamp(initialMax, min, max));
    } else {
      setMaxValue(max);
    }
  }, [initialMax, min, max]);

  // Determinar altura máxima del histograma para escalar proporcionalmente
  const maxHistogramFreq = useMemo(() => {
    if (!data || data.length === 0) return 1;
    return Math.max(...data, 1);
  }, [data]);

  // Actualizador centralizado: SOLO actualiza el estado local visual del slider (fluidez)
  const updateVisualRange = useCallback(
    (newMin: number, newMax: number) => {
      const sanitizedMin = clamp(newMin, min, newMax);
      const sanitizedMax = clamp(newMax, sanitizedMin, max);

      setMinValue(sanitizedMin);
      setMaxValue(sanitizedMax);
    },
    [min, max]
  );

  // Función de compromiso que notifica el cambio final al padre
  const commitRange = useCallback(() => {
    if (onChange) {
      onChange({ min: minValue, max: maxValue });
    }
  }, [minValue, maxValue, onChange]);

  // Manejadores para los sliders (sólo actualizan UI visual)
  const handleMinSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    const newMin = Math.min(val, maxValue);
    updateVisualRange(newMin, maxValue);
  };

  const handleMaxSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    const newMax = Math.max(val, minValue);
    updateVisualRange(minValue, newMax);
  };

  // Manejadores para inputs numéricos inferiores (disparan commit inmediato tras onBlur/Enter)
  const handleMinInputCommit = (newMin: number) => {
    const validMin = Math.min(newMin, maxValue);
    updateVisualRange(validMin, maxValue);
    if (onChange) onChange({ min: validMin, max: maxValue });
  };

  const handleMaxInputCommit = (newMax: number) => {
    const validMax = Math.max(newMax, minValue);
    updateVisualRange(minValue, validMax);
    if (onChange) onChange({ min: minValue, max: validMax });
  };

  const [activeThumb, setActiveThumb] = useState<'min' | 'max' | null>(null);

  // Dynamic z-index prevents the top input from blocking the bottom thumb
  const isMinOnTop = activeThumb === 'min' || minValue > max - (max - min) * 0.2 || (activeThumb !== 'max' && minValue <= min + (max - min) * 0.5);

  const rangePercentLeft = Math.max(0, Math.min(100, ((minValue - min) / (max - min || 1)) * 100));
  const rangePercentRight = Math.max(0, Math.min(100, 100 - ((maxValue - min) / (max - min || 1)) * 100));

  const histogramBars = useMemo(() => {
    return data.map((freq, index) => {
      const heightPercent = Math.max((freq / maxHistogramFreq) * 100, 8);
      const active = isBarActive(index, data.length, min, max, minValue, maxValue);

      return (
        <div
          key={`bar-${index}`}
          className="flex-1 flex flex-col justify-end h-full min-w-[2px]"
        >
          <div
            style={{ height: `${heightPercent}%` }}
            className={`w-full rounded-t-xs transition-colors duration-150 ${
              active
                ? 'bg-primary'
                : 'bg-outline-variant/30 opacity-40'
            }`}
          />
        </div>
      );
    });
  }, [data, maxHistogramFreq, min, max, minValue, maxValue]);

  return (
    <section className={`w-full min-w-full select-none ${className}`}>
      {/* ── CAPA 1: CABECERA Y TEXTO ── */}
      <header className="mb-3">
        <h2 className="text-sm font-semibold tracking-tight text-on-surface">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-xs text-on-surface-variant leading-snug">
            {subtitle}
          </p>
        )}
      </header>

      {/* ── CAPA 2: HISTOGRAMA Y DUAL SLIDER SUPERPUESTO ── */}
      <div className="relative w-full pt-4 pb-2 px-1">
        {/* Histograma (Fondo) */}
        <div
          className="flex items-end justify-between w-full h-16 gap-[2px] mb-[-4px] overflow-hidden"
          aria-hidden="true"
        >
          {histogramBars}
        </div>

        {/* Dual Slider Superpuesto */}
        <div className="relative w-full h-7 flex items-center">
          {/* Track base */}
          <div className="absolute inset-x-0 h-1 bg-outline-variant/30 rounded-full" />

          {/* Track resaltado entre min y max */}
          <div
            className="absolute h-1 bg-primary rounded-full"
            style={{
              left: `${rangePercentLeft}%`,
              right: `${rangePercentRight}%`,
            }}
          />

          {/* Slider Min */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={minValue}
            onChange={handleMinSliderChange}
            onPointerDown={(e) => {
              setActiveThumb('min');
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onTouchStart={() => {
              setActiveThumb('min');
            }}
            onPointerUp={(e) => {
              e.currentTarget.releasePointerCapture(e.pointerId);
              commitRange();
            }}
            onTouchEnd={commitRange}
            onKeyUp={(e) => {
              if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                commitRange();
              }
            }}
            onFocus={() => setActiveThumb('min')}
            aria-label="Precio mínimo"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={minValue}
            className={`absolute inset-0 w-full appearance-none bg-transparent pointer-events-none m-0 ${isMinOnTop ? 'z-30' : 'z-20'}
              [&::-webkit-slider-thumb]:pointer-events-auto
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-6
              [&::-webkit-slider-thumb]:h-6
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-surface-container-lowest
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-primary
              [&::-webkit-slider-thumb]:shadow-md
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:transition-transform
              [&::-webkit-slider-thumb]:hover:scale-115
              [&::-webkit-slider-thumb]:active:scale-95
              [&::-webkit-slider-thumb]:focus-visible:ring-2
              [&::-webkit-slider-thumb]:focus-visible:ring-primary
              [&::-moz-range-thumb]:pointer-events-auto
              [&::-moz-range-thumb]:appearance-none
              [&::-moz-range-thumb]:w-6
              [&::-moz-range-thumb]:h-6
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-surface-container-lowest
              [&::-moz-range-thumb]:border-2
              [&::-moz-range-thumb]:border-primary
              [&::-moz-range-thumb]:shadow-md
              [&::-moz-range-thumb]:cursor-pointer
              [&::-moz-range-thumb]:transition-transform
              [&::-moz-range-thumb]:hover:scale-115
              [&::-moz-range-thumb]:active:scale-95`}
          />

          {/* Slider Max */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={maxValue}
            onChange={handleMaxSliderChange}
            onPointerDown={(e) => {
              setActiveThumb('max');
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onTouchStart={() => {
              setActiveThumb('max');
            }}
            onPointerUp={(e) => {
              e.currentTarget.releasePointerCapture(e.pointerId);
              commitRange();
            }}
            onTouchEnd={commitRange}
            onKeyUp={(e) => {
              if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                commitRange();
              }
            }}
            onFocus={() => setActiveThumb('max')}
            aria-label="Precio máximo"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={maxValue}
            className={`absolute inset-0 w-full appearance-none bg-transparent pointer-events-none m-0 ${!isMinOnTop ? 'z-30' : 'z-20'}
              [&::-webkit-slider-thumb]:pointer-events-auto
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-6
              [&::-webkit-slider-thumb]:h-6
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-surface-container-lowest
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-primary
              [&::-webkit-slider-thumb]:shadow-md
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:transition-transform
              [&::-webkit-slider-thumb]:hover:scale-115
              [&::-webkit-slider-thumb]:active:scale-95
              [&::-webkit-slider-thumb]:focus-visible:ring-2
              [&::-webkit-slider-thumb]:focus-visible:ring-primary
              [&::-moz-range-thumb]:pointer-events-auto
              [&::-moz-range-thumb]:appearance-none
              [&::-moz-range-thumb]:w-6
              [&::-moz-range-thumb]:h-6
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-surface-container-lowest
              [&::-moz-range-thumb]:border-2
              [&::-moz-range-thumb]:border-primary
              [&::-moz-range-thumb]:shadow-md
              [&::-moz-range-thumb]:cursor-pointer
              [&::-moz-range-thumb]:transition-transform
              [&::-moz-range-thumb]:hover:scale-115
              [&::-moz-range-thumb]:active:scale-95`}
          />
        </div>
      </div>

      {/* ── CAPA 3: INPUTS NUMÉRICOS INFERIORES ── */}
      <div className="flex items-center justify-between gap-3 mt-4 w-full">
        <PriceBoundInput
          id={minInputId}
          label="Mínimo"
          value={minValue}
          currencySymbol={currencySymbol}
          minBound={min}
          maxBound={maxValue}
          onCommit={handleMinInputCommit}
        />

        <span className="text-on-surface-variant text-sm font-semibold mt-4" aria-hidden="true">
          —
        </span>

        <PriceBoundInput
          id={maxInputId}
          label="Máximo"
          value={maxValue}
          currencySymbol={currencySymbol}
          minBound={minValue}
          maxBound={max}
          onCommit={handleMaxInputCommit}
        />
      </div>
    </section>
  );
};

export default PriceRangeFilter;
