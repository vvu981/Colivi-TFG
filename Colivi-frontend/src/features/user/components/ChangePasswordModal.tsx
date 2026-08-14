import React, { useState } from "react";
import { userService } from "../../user/services/userService";
import { Spinner } from "../../../components/feedback/Spinner";
import { PasswordWithStrengthInput } from "../../../components/ui/PasswordWithStrengthInput";
import { Modal } from "../../../components/ui/Modal";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const handleClose = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setError("");
    setSuccess(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword !== confirmNewPassword) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("La nueva contraseña no puede ser igual a la actual.");
      return;
    }

    setIsLoading(true);

    try {
      await userService.updateCredentials({
        currentPassword,
        newPassword
      });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      console.error("Change password failed", err);
      let msg = "Error al actualizar la contraseña. Verifica tu contraseña actual.";
      if (err.response?.data?.message) {
         msg = err.response.data.message;
      } else if (err.response?.data?.error) {
         msg = err.response.data.error;
      } else if (Array.isArray(err.response?.data?.errors) && err.response.data.errors.length > 0) {
         msg = err.response.data.errors[0].defaultMessage || err.response.data.errors[0].msg || msg;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Cambiar Contraseña">
      <form onSubmit={handleSubmit} className="p-xl flex flex-col gap-lg">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-medium">
              ¡Contraseña actualizada correctamente!
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          {/* Contraseña actual */}
          <PasswordWithStrengthInput
            id="current-password"
            label="Contraseña actual"
            value={currentPassword}
            onChange={setCurrentPassword}
            required
          />

          {/* Nueva Contraseña */}
          <PasswordWithStrengthInput
            id="new-password"
            label="Nueva contraseña"
            value={newPassword}
            onChange={setNewPassword}
            required
            minLength={8}
            placeholder="Mín. 8 caracteres"
            showStrength
          />

          {/* Confirmar Nueva Contraseña */}
          <PasswordWithStrengthInput
            id="confirm-new-password"
            label="Confirmar nueva contraseña"
            value={confirmNewPassword}
            onChange={setConfirmNewPassword}
            required
            minLength={8}
            placeholder="Confirmar contraseña"
          />

          <div className="mt-md flex justify-end gap-md">
            <button
              type="button"
              onClick={handleClose}
              className="px-xl py-2 rounded-lg font-label-md text-label-md bg-surface-variant text-on-surface-variant hover:bg-surface-dim transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || success}
              className="px-xl py-2 rounded-lg font-label-md text-label-md bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-sm disabled:opacity-50"
            >
              {isLoading ? <Spinner /> : "Guardar Cambios"}
            </button>
          </div>
        </form>
    </Modal>
  );
};
