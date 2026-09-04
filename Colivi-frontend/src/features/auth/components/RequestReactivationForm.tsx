import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Spinner } from '../../../components/feedback/Spinner';
import {
  reactivationRequestSchema,
  type ReactivationRequestFormData,
} from '../validations/authSchemas';
import { useRequestReactivation } from '../hooks/useRequestReactivation';

export const RequestReactivationForm = () => {
  const { isLoading, success, error, submitRequestReactivation } = useRequestReactivation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReactivationRequestFormData>({
    resolver: zodResolver(reactivationRequestSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (data: ReactivationRequestFormData) => {
    submitRequestReactivation(data.email);
  };

  return (
    <div className="w-full">
      {success ? (
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-[#ebf3ed] text-[#4b9861] rounded-full flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-[32px]">mark_email_read</span>
          </div>
          <h3 className="text-xl font-semibold text-[#0b1c30]">Solicitud enviada</h3>
          <p className="text-sm text-[#565e74] leading-relaxed max-w-sm">
            Si existe una cuenta desactivada asociada a este correo, te hemos enviado un enlace para
            reactivarla. Revisa también tu carpeta de spam o correo no deseado.
          </p>
          <Link
            to="/login"
            className="mt-4 w-full bg-[#0b1c30] text-white font-medium py-3 rounded-lg hover:bg-[#1a2d45] transition-colors text-center"
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
            className="w-full bg-[#0b1c30] text-white font-medium py-3 rounded-lg hover:bg-[#1a2d45] transition-colors mt-2 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading && <Spinner />}
            Solicitar reactivación
          </button>

          <p className="text-sm text-center text-[#565e74] mt-2">
            ¿Recordaste tus datos?{' '}
            <Link to="/login" className="text-[#0b1c30] font-medium hover:underline">
              Inicia sesión
            </Link>
          </p>
        </form>
      )}
    </div>
  );
};
