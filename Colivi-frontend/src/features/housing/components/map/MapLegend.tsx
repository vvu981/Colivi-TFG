import React, { useState } from 'react';
import { Home, Bed, Info, ChevronUp, ChevronDown } from 'lucide-react';
import { MAP_THEME } from './mapTheme';

export const MapLegend: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { pin: pinTheme, badge: badgeTheme, cluster: clusterTheme } = MAP_THEME;

  return (
    <div className="absolute bottom-4 right-4 z-30 flex flex-col items-end">
      {/* Expanded Legend Card */}
      {isOpen ? (
        <div className="w-72 bg-surface-container-lowest/95 backdrop-blur-md border border-outline-variant rounded-2xl shadow-xl p-3.5 flex flex-col gap-3 text-label-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-outline-variant pb-2">
            <div className="flex items-center gap-1.5 font-bold text-on-surface">
              <Info size={16} className="text-primary" />
              <span>Leyenda del mapa</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Minimizar leyenda"
              className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
            >
              <ChevronDown size={16} />
            </button>
          </div>

          {/* 1. Tipo de Alojamiento */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Tipo de alquiler
            </span>
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-md ${pinTheme.dropFill.replace('fill-', 'bg-')} ${badgeTheme.border} flex items-center justify-center flex-shrink-0 ${badgeTheme.shadow}`}
              >
                <Home size={13} style={{ color: pinTheme.iconColor }} />
              </div>
              <span className="text-on-surface">Alojamiento completo</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-md ${pinTheme.dropFill.replace('fill-', 'bg-')} ${badgeTheme.border} flex items-center justify-center flex-shrink-0 ${badgeTheme.shadow}`}
              >
                <Bed size={13} style={{ color: pinTheme.iconColor }} />
              </div>
              <span className="text-on-surface">Habitación</span>
            </div>
          </div>

          {/* 2. Tipo de Agrupación (Badges de color) */}
          <div className="flex flex-col gap-1.5 border-t border-outline-variant/60 pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Varios anuncios juntos
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full ${badgeTheme.sameAccommodation} flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${badgeTheme.shadow} ${badgeTheme.border}`}
              >
                4
              </span>
              <span className="text-on-surface">Mismo inmueble (Coliving)</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full ${badgeTheme.differentAccommodation} flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${badgeTheme.shadow} ${badgeTheme.border}`}
              >
                2
              </span>
              <span className="text-on-surface">Inmuebles distintos</span>
            </div>
          </div>

          {/* 3. Interacciones */}
          <div className="flex flex-col gap-1.5 border-t border-outline-variant/60 pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Interacción
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full ${clusterTheme.background} ${clusterTheme.textColor} flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${clusterTheme.shadow} ${clusterTheme.border} ring-1 ring-primary-container/20`}
              >
                +
              </span>
              <span className="text-on-surface">Macro-clúster (clic: zoom)</span>
            </div>
            <div className="text-[11px] text-on-surface-variant leading-tight mt-0.5">
              • 4 anuncios o menos: Se abren en abanico.<br />
              • 5 anuncios o más: Clic para ver en lista lateral.
            </div>
          </div>
        </div>
      ) : (
        /* Collapsed Button */
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Mostrar leyenda del mapa"
          className="flex items-center gap-2 px-3 py-2 bg-surface-container-lowest/90 hover:bg-surface-container-lowest backdrop-blur-md border border-outline-variant rounded-xl shadow-md text-label-sm text-on-surface hover:border-outline transition-all cursor-pointer hover:shadow-lg active:scale-95"
        >
          <Info size={15} className="text-primary" />
          <span>Leyenda</span>
          <ChevronUp size={14} className="text-on-surface-variant" />
        </button>
      )}
    </div>
  );
};
