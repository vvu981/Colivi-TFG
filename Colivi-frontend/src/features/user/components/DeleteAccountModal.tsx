import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Spinner } from '../../../components/feedback/Spinner';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const CONFIRMATION_KEYWORD = 'ELIMINAR';

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (isDeleting) return;
    setConfirmationInput('');
    setError(null);
    onClose();
  };

  const isConfirmed = confirmationInput.trim().toUpperCase() === CONFIRMATION_KEYWORD;

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed || isDeleting) return;

    try {
      setIsDeleting(true);
      setError(null);
      await onConfirm();
    } catch (err: unknown) {
      console.error('Error deleting account:', err);
      let msg = 'No se pudo eliminar la cuenta. Por favor, inténtalo de nuevo.';
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string; error?: string } } };
        msg = axiosErr.response?.data?.message || axiosErr.response?.data?.error || msg;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Eliminar cuenta">
      <form onSubmit={handleDelete} className="p-6 flex flex-col gap-5">
        {/* Warning Banner */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-red-600 text-[24px] shrink-0 select-none">
            warning
          </span>
          <div className="text-sm text-red-800 space-y-1">
            <p className="font-semibold text-red-900">¿Estás seguro de que deseas eliminar tu cuenta?</p>
            <p className="text-red-700 leading-relaxed">
              Esta acción dará de baja tu cuenta. Se cerrará tu sesión inmediatamente, tu perfil se desactivará
              y no podrás volver a acceder con tus credenciales.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        {/* Confirmation Keyword Input */}
        <div className="flex flex-col gap-2">
          <label htmlFor="delete-confirmation-input" className="text-sm font-medium text-on-surface">
            Escribe <span className="font-bold text-red-600 select-all">{CONFIRMATION_KEYWORD}</span> para confirmar:
          </label>
          <input
            id="delete-confirmation-input"
            type="text"
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            placeholder={`Escribe ${CONFIRMATION_KEYWORD}`}
            disabled={isDeleting}
            autoComplete="off"
            className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface text-on-surface focus:outline-hidden focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-colors text-sm disabled:opacity-50"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-lg font-label-md text-label-md bg-surface-variant text-on-surface-variant hover:bg-surface-dim transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!isConfirmed || isDeleting}
            className="px-5 py-2.5 rounded-lg font-label-md text-label-md bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
          >
            {isDeleting ? (
              <>
                <Spinner />
                <span>Eliminando cuenta...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                <span>Eliminar mi cuenta</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
