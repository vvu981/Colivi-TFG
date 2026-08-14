import { Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Spinner } from '../../../components/feedback/Spinner';
import { PasswordWithStrengthInput } from '../../../components/ui/PasswordWithStrengthInput';
import { resetPasswordSchema, type ResetPasswordFormData } from '../validations/authSchemas';
import { useResetPassword } from '../hooks/useResetPassword';

export const ResetPasswordForm = () => {
  const { isLoading, success, error, submitResetPassword } = useResetPassword();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    submitResetPassword(data.newPassword);
  };

  if (success) {
    return (
      <div className="w-full">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-[#ebf3ed] text-[#4b9861] rounded-full flex items-center justify-center mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-[#0b1c30]">Contraseña restablecida</h3>
          <p className="text-sm text-[#565e74]">
            Tu contraseña ha sido modificada con éxito. Ya puedes iniciar sesión con tus nuevas
            credenciales.
          </p>
          <Link
            to="/login"
            className="mt-4 w-full bg-[#0b1c30] text-white font-medium py-3 rounded-lg hover:bg-[#1a2d45] transition-colors"
          >
            Ir al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <Controller
          name="newPassword"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1.5">
              <PasswordWithStrengthInput
                id="newPassword"
                label="Nueva contraseña"
                required
                showStrength
                placeholder="Mínimo 8 caracteres"
                value={field.value}
                onChange={field.onChange}
              />
              {errors.newPassword && (
                <span className="text-red-500 text-xs font-medium">
                  {errors.newPassword.message}
                </span>
              )}
            </div>
          )}
        />

        <Controller
          name="confirmPassword"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1.5">
              <PasswordWithStrengthInput
                id="confirmPassword"
                label="Confirmar nueva contraseña"
                required
                placeholder="Repite tu contraseña"
                value={field.value}
                onChange={field.onChange}
              />
              {errors.confirmPassword && (
                <span className="text-red-500 text-xs font-medium">
                  {errors.confirmPassword.message}
                </span>
              )}
            </div>
          )}
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#0b1c30] text-white font-medium py-3 rounded-lg hover:bg-[#1a2d45] transition-colors mt-2 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading && <Spinner />}
          Restablecer contraseña
        </button>

        <p className="text-sm text-center text-[#565e74] mt-2">
          ¿Recordaste tu contraseña?{' '}
          <Link to="/login" className="text-[#0b1c30] font-medium hover:underline">
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  );
};
