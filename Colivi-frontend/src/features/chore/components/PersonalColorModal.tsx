import React, { useState, useEffect } from 'react';
import { Palette, X, Check, Loader2 } from 'lucide-react';
import { MEMBER_PALETTE, DEFAULT_MEMBER_COLOR, getChorePillStyles, getChoreBadgeStyles } from '../utils/userColor';
import { homeService } from '../../home/api/homeService';

interface PersonalColorModalProps {
  isOpen: boolean;
  onClose: () => void;
  homeId: string;
  currentColor?: string | null;
  onSuccess?: (newColor: string) => void;
}

export const PersonalColorModal: React.FC<PersonalColorModalProps> = ({
  isOpen,
  onClose,
  homeId,
  currentColor,
  onSuccess,
}) => {
  const [selectedColor, setSelectedColor] = useState<string>(currentColor || DEFAULT_MEMBER_COLOR);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedColor(currentColor || DEFAULT_MEMBER_COLOR);
      setErrorMessage(null);
    }
  }, [isOpen, currentColor]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await homeService.updateMyMemberColor(homeId, selectedColor);
      if (onSuccess) {
        onSuccess(selectedColor);
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el color';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">Mi color en el hogar</h3>
              <p className="text-xs text-secondary">
                Personaliza cómo se ven tus tareas en el calendario
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-secondary hover:text-on-surface rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensaje de Error */}
        {errorMessage && (
          <div className="p-3 text-xs rounded-xl bg-error/10 text-error border border-error/20">
            {errorMessage}
          </div>
        )}

        {/* Palette Grid */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
            Selecciona un color
          </label>
          <div className="grid grid-cols-5 gap-3 pt-1">
            {MEMBER_PALETTE.map((colorOption) => {
              const isSelected = selectedColor.toLowerCase() === colorOption.hex.toLowerCase();
              return (
                <button
                  key={colorOption.hex}
                  type="button"
                  title={colorOption.name}
                  onClick={() => setSelectedColor(colorOption.hex)}
                  className={`relative flex items-center justify-center aspect-square rounded-2xl transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface-container-lowest scale-105 shadow-sm'
                      : 'hover:scale-105 hover:shadow-xs'
                  }`}
                  style={{ backgroundColor: colorOption.hex }}
                >
                  {isSelected && (
                    <span className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white stroke-[3] drop-shadow-xs" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Preview */}
        <div className="p-4 rounded-2xl bg-surface-container-low/50 border border-outline-variant/40 space-y-3">
          <span className="text-xs font-semibold text-secondary uppercase tracking-wider block">
            Vista previa
          </span>
          <div className="space-y-2.5">
            {/* Calendar Pill Preview */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-secondary w-20 shrink-0">Calendario:</span>
              <div
                className="px-2 py-0.5 rounded text-xs font-medium border truncate max-w-[220px]"
                style={getChorePillStyles(selectedColor)}
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: selectedColor }}
                  />
                  Limpiar la cocina
                </span>
              </div>
            </div>

            {/* List View Card Preview */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-secondary w-20 shrink-0">Lista:</span>
              <div
                className="flex-1 p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 flex items-center justify-between"
                style={{ borderLeftWidth: '4px', borderLeftColor: selectedColor }}
              >
                <span className="text-xs font-bold text-on-surface">Fregar vajilla</span>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                  style={getChoreBadgeStyles(selectedColor)}
                >
                  Tú
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer / Botones de Acción */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/40">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-semibold text-secondary hover:text-on-surface transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary-container disabled:opacity-50 transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              'Guardar color'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
