import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Spinner } from '../../../components/feedback/Spinner';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../validations/authSchemas';
import { useForgotPassword } from '../hooks/useForgotPassword';

export const ForgotPasswordForm = () => {
  const { isLoading, success, error, submitForgotPassword } = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    submitForgotPassword(data.email);
  };

  return (
    <div className="w-full">
      {success ? (
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
          <h3 className="text-xl font-semibold text-[#0b1c30]">Correo enviado</h3>
          <p className="text-sm text-[#565e74]">
            Si existe una cuenta asociada a ese correo, te enviaremos un enlace para restablecer tu
            contraseña.
          </p>
          <Link
            to="/login"
            className="mt-4 w-full bg-[#0b1c30] text-white font-medium py-3 rounded-lg hover:bg-[#1a2d45] transition-colors"
          >
            Volver a iniciar sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#0b1c30]" htmlFor="email">
              Correo electrónico <span className="text-[#9f3c16]">*</span>
            </label>
            <input
              id="email"
              type="email"
              placeholder="tu@correo.com"
              {...register('email')}
              className={`w-full bg-white border ${
                errors.email ? 'border-red-500' : 'border-[#dec0b7]'
              } text-[#0b1c30] text-sm rounded-lg py-3 px-4 focus:border-[#0b1c30] focus:ring-2 focus:ring-[#dae2fd] focus:outline-none placeholder-[#565e74]/60 transition-all duration-200`}
            />
            {errors.email && (
              <span className="text-red-500 text-xs font-medium">{errors.email.message}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0b1c30] text-white font-medium py-3 rounded-lg hover:bg-[#1a2d45] transition-colors mt-2 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading && <Spinner />}
            Enviar enlace de recuperación
          </button>

          <p className="text-sm text-center text-[#565e74] mt-2">
            ¿Te acordaste de tu contraseña?{' '}
            <Link to="/login" className="text-[#0b1c30] font-medium hover:underline">
              Inicia sesión
            </Link>
          </p>
        </form>
      )}
    </div>
  );
};
