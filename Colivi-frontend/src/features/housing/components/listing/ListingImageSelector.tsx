import { CheckCircle2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import clsx from 'clsx';
import type { AccommodationImageResponse } from '../../types/accommodation.types';

interface ListingImageSelectorProps {
  accommodationImages: AccommodationImageResponse[];
  value: string[]; // array de UUIDs ordenados
  onChange: (newValue: string[]) => void;
  error?: string;
}

export const ListingImageSelector = ({
  accommodationImages,
  value = [],
  onChange,
  error,
}: ListingImageSelectorProps) => {
  // Maneja la selección / deselección
  const toggleSelection = (imageId: string) => {
    if (value.includes(imageId)) {
      onChange(value.filter((id) => id !== imageId));
    } else {
      onChange([...value, imageId]);
    }
  };

  // Mueve una imagen a la izquierda en el orden
  const moveLeft = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index === 0) return;
    const newValue = [...value];
    [newValue[index - 1], newValue[index]] = [newValue[index], newValue[index - 1]];
    onChange(newValue);
  };

  // Mueve una imagen a la derecha en el orden
  const moveRight = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index === value.length - 1) return;
    const newValue = [...value];
    [newValue[index + 1], newValue[index]] = [newValue[index], newValue[index + 1]];
    onChange(newValue);
  };

  const getImageUrl = (id: string) => accommodationImages.find((img) => img.id === id)?.imageUrl;

  return (
    <div className="flex flex-col gap-4">
      {/* ── Imágenes Seleccionadas (Ordenadas) ── */}
      <div className="flex flex-col gap-2">
        <h3 className="text-label-lg font-label-lg text-on-surface">Imágenes del anuncio (Orden actual)</h3>
        {value.length === 0 ? (
          <p className="text-label-md font-label-md text-on-surface-variant italic">
            No has seleccionado ninguna foto.
          </p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 pt-2">
            {value.map((id, index) => {
              const url = getImageUrl(id);
              if (!url) return null;

              return (
                <div
                  key={id}
                  className="relative shrink-0 w-40 h-32 rounded-xl overflow-hidden border-2 border-primary group"
                >
                  <img src={url} alt="Seleccionada" className="w-full h-full object-cover" />
                  
                  {/* Overlay con controles */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleSelection(id); }}
                      className="self-end bg-surface text-on-surface rounded-full p-1 hover:bg-error-container hover:text-on-error-container"
                    >
                      <X size={16} />
                    </button>
                    
                    <div className="flex justify-between w-full">
                      <button
                        type="button"
                        onClick={(e) => moveLeft(index, e)}
                        disabled={index === 0}
                        className="bg-surface text-on-surface rounded-full p-1 disabled:opacity-50"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      
                      <span className="bg-primary text-on-primary rounded-full w-6 h-6 flex items-center justify-center text-label-sm font-bold">
                        {index + 1}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => moveRight(index, e)}
                        disabled={index === value.length - 1}
                        className="bg-surface text-on-surface rounded-full p-1 disabled:opacity-50"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Galería del Inmueble ── */}
      <div className="flex flex-col gap-2 border-t border-outline-variant pt-4">
        <h3 className="text-label-lg font-label-lg text-on-surface">Galería del alojamiento</h3>
        <p className="text-label-sm font-label-sm text-on-surface-variant">
          Haz clic en las fotos que quieras mostrar en este anuncio.
        </p>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {accommodationImages.map((img) => {
            const isSelected = value.includes(img.id);

            return (
              <button
                key={img.id}
                type="button"
                onClick={() => toggleSelection(img.id)}
                className={clsx(
                  'relative aspect-square rounded-xl overflow-hidden border-2 transition-all',
                  isSelected ? 'border-primary' : 'border-transparent hover:border-primary/50'
                )}
              >
                <img src={img.imageUrl} alt="Inmueble" className="w-full h-full object-cover" />
                
                {isSelected && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <CheckCircle2 size={32} className="text-primary bg-surface rounded-full border-2 border-surface" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {error && <p className="text-label-sm font-label-sm text-error">{error}</p>}
    </div>
  );
};
