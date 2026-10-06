import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { authService } from '../services/authService';

interface UseResetPasswordResult {
  isLoading: boolean;
  success: boolean;
  error: string | null;
  token: string | null;
  submitResetPassword: (password: string) => Promise<void>;
}

export const useResetPassword = (): UseResetPasswordResult => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitResetPassword = async (password: string) => {
    setError(null);
    setSuccess(false);

    if (!token) {
      setError('El enlace de recuperación es inválido o falta el token.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      if (isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            'No se ha podido restablecer la contraseña. El enlace puede haber expirado o ser inválido.'
        );
      } else {
        setError('Ocurrió un error inesperado al intentar restablecer la contraseña.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, success, error, token, submitResetPassword };
};
