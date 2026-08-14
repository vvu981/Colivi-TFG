import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
    } catch (err: any) {
      console.error('Reset password failed', err);
      let msg = 'No se ha podido restablecer la contraseña. El enlace puede haber expirado.';
      if (err.response?.data?.message) {
        msg = err.response.data.message;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, success, error, token, submitResetPassword };
};
