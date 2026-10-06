import React, { useState } from 'react';
import type { ChoreResponseDto, DeleteMode } from '../types';
import { Trash2, X, AlertTriangle } from 'lucide-react';

interface ConfirmDeleteChoreModalProps {
  chore: ChoreResponseDto | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (choreId: string, mode: DeleteMode) => Promise<void>;
  isDeleting?: boolean;
}

export const ConfirmDeleteChoreModal: React.FC<ConfirmDeleteChoreModalProps> = ({
  chore,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  const [deleteMode, setDeleteMode] = useState<DeleteMode>('DELETE_SINGLE');

  if (!isOpen || !chore) return null;

  const isRecurring = Boolean(chore.seriesId);

  const handleConfirm = async () => {
    await onConfirm(chore.id, deleteMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in">
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-error/10 text-error rounded-xl">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">Eliminar Tarea</h3>
              <p className="text-xs text-secondary">Confirma la acción de eliminación</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-secondary hover:text-on-surface rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensaje */}
        <div className="text-xs text-secondary space-y-2">
          <p>
            ¿Estás seguro de que deseas eliminar la tarea{' '}
            <strong className="text-on-surface">"{chore.title}"</strong> prevista para el{' '}
            <strong className="text-on-surface">{chore.dueDate}</strong>?
          </p>

          {isRecurring ? (
            <div className="p-3.5 bg-surface-container-low rounded-2xl border border-outline-variant/40 space-y-2.5">
              <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>Esta tarea pertenece a una serie recurrente</span>
              </div>
              <p className="text-[11px] text-secondary">
                Elige cómo deseas proceder con las repeticiones:
              </p>

              <div className="space-y-2 pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-xl border border-outline-variant/40 hover:bg-surface-container transition-colors">
                  <input
                    type="radio"
                    name="deleteMode"
                    value="DELETE_SINGLE"
                    checked={deleteMode === 'DELETE_SINGLE'}
                    onChange={() => setDeleteMode('DELETE_SINGLE')}
                    className="mt-0.5 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-xs font-bold text-on-surface block">
                      Solo esta tarea
                    </span>
                    <span className="text-[11px] text-secondary block">
                      Omite únicamente el turno de este día. Las próximas ocurrencias seguirán activas.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-xl border border-outline-variant/40 hover:bg-surface-container transition-colors">
                  <input
                    type="radio"
                    name="deleteMode"
                    value="DELETE_FORWARD"
                    checked={deleteMode === 'DELETE_FORWARD'}
                    onChange={() => setDeleteMode('DELETE_FORWARD')}
                    className="mt-0.5 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-xs font-bold text-on-surface block">
                      Esta y todas las tareas futuras
                    </span>
                    <span className="text-[11px] text-secondary block">
                      Elimina esta tarea y cancela todas las próximas repeticiones de la serie.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-secondary">
              Esta acción no se puede deshacer y quedará registrada en la auditoría del hogar.
            </p>
          )}
        </div>

        {/* Botones */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-secondary hover:text-on-surface transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-5 py-2 bg-error text-white text-xs font-bold rounded-xl shadow-xs hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {isDeleting ? 'Eliminando...' : 'Confirmar Eliminación'}
          </button>
        </div>
      </div>
    </div>
  );
};
