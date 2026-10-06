import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { AuthLayout } from '../layouts/AuthLayout';
import { useAuth } from '../features/auth/context/AuthContext';
import { Spinner } from '../components/feedback/Spinner';

export const ReactivateAccountPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { reactivateAccount } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    token ? 'loading' : 'error'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(
    token ? null : 'No se ha proporcionado un token de reactivación en el enlace.'
  );

  const hasExecutedRef = useRef(false);

  useEffect(() => {
    if (!token) return;
    if (hasExecutedRef.current) return;
    hasExecutedRef.current = true;

    const performReactivation = async () => {
      try {
        setStatus('loading');
        setErrorMessage(null);
        await reactivateAccount(token);
        setStatus('success');
      } catch (err) {
        setStatus('error');
        if (isAxiosError(err)) {
          setErrorMessage(
            err.response?.data?.message ||
              'El enlace de reactivación no es válido o ha caducado. Por favor, solicita uno nuevo.'
          );
        } else {
          setErrorMessage('Ocurrió un error inesperado al reactivar la cuenta.');
        }
      }
    };

    performReactivation();
  }, [token, reactivateAccount]);

  return (
    <AuthLayout
      title="Reactivación de Cuenta"
      subtitle="Restableciendo el acceso a tu perfil de Colivi."
    >
      <div className="w-full flex flex-col items-center text-center gap-6">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Spinner />
            <p className="text-sm font-medium text-[#565e74]">
              Validando enlace y reactivando tu cuenta...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-[#ebf3ed] text-[#4b9861] rounded-full flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-[32px]">check_circle</span>
            </div>
            <h3 className="text-xl font-semibold text-[#0b1c30]">¡Cuenta reactivada con éxito!</h3>
            <p className="text-sm text-[#565e74] leading-relaxed max-w-sm">
              Tu cuenta vuelve a estar activa y tu sesión ha sido iniciada correctamente. Ya puedes
              continuar explorando Colivi.
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mt-4 w-full bg-[#0b1c30] text-white font-medium py-3 rounded-lg hover:bg-[#1a2d45] transition-colors cursor-pointer"
            >
              Ir a la página principal
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300 w-full">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-[32px]">error</span>
            </div>
            <h3 className="text-xl font-semibold text-[#0b1c30]">No se pudo reactivar la cuenta</h3>
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 w-full leading-relaxed">
              {errorMessage}
            </p>
            <div className="flex flex-col gap-3 w-full mt-2">
              <Link
                to="/reactivate-request"
                className="w-full bg-[#0b1c30] text-white font-medium py-3 rounded-lg hover:bg-[#1a2d45] transition-colors text-center"
              >
                Solicitar nuevo enlace de reactivación
              </Link>
              <Link
                to="/login"
                className="text-sm text-[#565e74] hover:text-[#0b1c30] hover:underline"
              >
                Volver a inicio de sesión
              </Link>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default ReactivateAccountPage;
