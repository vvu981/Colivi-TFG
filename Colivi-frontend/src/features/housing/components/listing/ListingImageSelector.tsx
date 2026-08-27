import { useState, useRef } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, X, Plus, Loader2, ImagePlus } from 'lucide-react';
import clsx from 'clsx';
import { accommodationService } from '../../api/accommodationService';
import type { AccommodationImageResponse } from '../../types/accommodation.types';

interface ListingImageSelectorProps {
  accommodationId?: string;
  accommodationImages: AccommodationImageResponse[];
  value: string[]; // array de UUIDs ordenados
  onChange: (newValue: string[]) => void;
  onAccommodationImagesChange?: (newImages: AccommodationImageResponse[]) => void;
  error?: string;
}

export const ListingImageSelector = ({
  accommodationId,
  accommodationImages,
  value = [],
  onChange,
  onAccommodationImagesChange,
  error,
}: ListingImageSelectorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || !files.length || !accommodationId) return;
    setIsUploading(true);
    setUploadError(null);

    const newlyAddedIds: string[] = [];
    let updatedAccImages = [...accommodationImages];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const res = await accommodationService.uploadImage(accommodationId, file);
        updatedAccImages = res.images;
        
        // Find newly created image id by diffing
        const newImg = res.images.find(img => !accommodationImages.some(existing => existing.id === img.id));
        if (newImg && !newlyAddedIds.includes(newImg.id)) {
          newlyAddedIds.push(newImg.id);
        }
      } catch {
        setUploadError(`No se pudo subir "${file.name}".`);
      }
    }

    if (onAccommodationImagesChange) {
      onAccommodationImagesChange(updatedAccImages);
    }

    // Auto-select newly uploaded images
    if (newlyAddedIds.length > 0) {
      onChange([...value, ...newlyAddedIds]);
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getImageUrl = (id: string) => accommodationImages.find((img) => img.id === id)?.imageUrl;

  return (
    <div className="flex flex-col gap-5">
      {/* ── Imágenes Seleccionadas (Ordenadas) ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-label-lg font-bold text-on-surface">
            Fotos seleccionadas para este anuncio ({value.length})
          </h3>
          <span className="text-xs text-on-surface-variant font-medium">
            La primera foto será la portada
          </span>
        </div>

        {value.length === 0 ? (
          <p className="text-body-md text-on-surface-variant italic p-4 rounded-xl bg-surface-container-low border border-outline-variant/60">
            No has seleccionado ninguna foto. Elige las fotos de la galería inferior o sube fotos nuevas.
          </p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-3 pt-1 no-scrollbar">
            {value.map((id, index) => {
              const url = getImageUrl(id);
              if (!url) return null;

              return (
                <div
                  key={id}
                  className="relative shrink-0 w-36 h-28 rounded-xl overflow-hidden border-2 border-primary group shadow-sm bg-surface-container"
                >
                  <img src={url} alt="Seleccionada" className="w-full h-full object-cover" />
                  
                  {/* Badge de Portada */}
                  {index === 0 && (
                    <span className="absolute top-2 left-2 bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                      Portada
                    </span>
                  )}

                  {/* Overlay con controles */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleSelection(id); }}
                      aria-label="Desmarcar foto"
                      className="self-end bg-surface text-on-surface rounded-full p-1 hover:bg-error-container hover:text-on-error-container transition-colors cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                    
                    <div className="flex justify-between items-center w-full">
                      <button
                        type="button"
                        onClick={(e) => moveLeft(index, e)}
                        disabled={index === 0}
                        aria-label="Mover a la izquierda"
                        className="bg-surface text-on-surface rounded-full p-1 disabled:opacity-30 transition-opacity cursor-pointer"
                      >
                        <ChevronLeft size={15} />
                      </button>
                      
                      <span className="bg-primary text-on-primary rounded-full w-5 h-5 flex items-center justify-center text-[11px] font-bold">
                        {index + 1}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => moveRight(index, e)}
                        disabled={index === value.length - 1}
                        aria-label="Mover a la derecha"
                        className="bg-surface text-on-surface rounded-full p-1 disabled:opacity-30 transition-opacity cursor-pointer"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Galería del Inmueble y Subida ── */}
      <div className="flex flex-col gap-3 border-t border-outline-variant pt-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-label-lg font-bold text-on-surface">Galería del alojamiento</h3>
            <p className="text-xs text-on-surface-variant">
              Toca las fotos para incluirlas o quitarlas de este anuncio.
            </p>
          </div>

          {/* Botón de subida rápida al alojamiento */}
          {accommodationId && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleUploadFiles(e.target.files)}
              />
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-primary text-primary hover:bg-primary/10 transition-all text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Subiendo fotos...</span>
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    <span>Subir nuevas fotos</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {uploadError && (
          <p className="text-xs text-error font-medium">{uploadError}</p>
        )}

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {/* Subir tarjeta rápida */}
          {accommodationId && (
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="relative aspect-square rounded-2xl border-2 border-dashed border-outline-variant hover:border-primary bg-surface-container-low/50 hover:bg-surface-container flex flex-col items-center justify-center gap-1 text-on-surface-variant hover:text-primary transition-all cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <ImagePlus size={20} />
                  <span className="text-[11px] font-semibold">Subir foto</span>
                </>
              )}
            </button>
          )}

          {accommodationImages.map((img) => {
            const isSelected = value.includes(img.id);

            return (
              <button
                key={img.id}
                type="button"
                onClick={() => toggleSelection(img.id)}
                className={clsx(
                  'relative aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer',
                  isSelected
                    ? 'border-primary ring-2 ring-primary/30 scale-102 shadow-sm'
                    : 'border-transparent opacity-80 hover:opacity-100 hover:border-primary/50'
                )}
              >
                <img src={img.imageUrl} alt="Inmueble" className="w-full h-full object-cover" />
                
                {isSelected && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <CheckCircle2 size={30} className="text-primary bg-surface rounded-full border-2 border-surface shadow-xs" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {error && <p className="text-xs font-semibold text-error">{error}</p>}
    </div>
  );
};
