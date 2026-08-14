import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "../services/authService";
import { Spinner } from "../../../components/feedback/Spinner";
import { PasswordWithStrengthInput } from "../../../components/ui/PasswordWithStrengthInput";

export const ResetPasswordForm = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si no hay token en la URL, mostramos un error de inmediato
  if (!token) {
    return (
      <div className="w-full flex flex-col items-center text-center gap-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium w-full">
          Enlace de recuperación inválido o caducado.
        </div>
        <Link
          to="/forgot-password"
          className="mt-4 w-full bg-[#0b1c30] text-white font-medium py-3 rounded-lg hover:bg-[#1a2d45] transition-colors"
        >
          Volver a solicitar recuperación
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err: any) {
      console.error("Reset password failed", err);
      let msg = "No se ha podido restablecer la contraseña. Es posible que el enlace haya caducado.";
      if (err.response?.data?.message) {
         msg = err.response.data.message;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {success ? (
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-[#ebf3ed] text-[#4b9861] rounded-full flex items-center justify-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-[#0b1c30]">Contraseña actualizada</h3>
          <p className="text-sm text-[#565e74]">
            Tu contraseña se ha restablecido correctamente. Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="mt-4 w-full bg-[#0b1c30] text-white font-medium py-3 rounded-lg hover:bg-[#1a2d45] transition-colors"
          >
            Ir a Iniciar Sesión
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
          <PasswordWithStrengthInput
            id="new-password"
            label="Nueva contraseña"
            value={newPassword}
            onChange={(val) => setNewPassword(val)}
            placeholder="Min. 8 caracteres"
            required
          />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#0b1c30]" htmlFor="confirm-password">
              Confirmar contraseña <span className="text-[#9f3c16]">*</span>
            </label>
            <input
              id="confirm-password"
              type="password"
              placeholder="Repite la contraseña"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white border border-[#dec0b7] text-[#0b1c30] text-sm rounded-lg py-3 px-4 focus:border-[#0b1c30] focus:ring-2 focus:ring-[#dae2fd] focus:outline-none placeholder-[#565e74]/60 transition-all duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !newPassword || !confirmPassword}
            className="w-full bg-[#0b1c30] text-white font-medium py-3 rounded-lg hover:bg-[#1a2d45] transition-colors mt-2 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading && <Spinner />}
            Restablecer contraseña
          </button>
        </form>
      )}
    </div>
  );
};
