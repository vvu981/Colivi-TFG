import { useState } from 'react';
import { authService } from '../services/authService';

interface UseForgotPasswordResult {
  isLoading: boolean;
  success: boolean;
  error: string | null;
  resetState: () => void;
  submitForgotPassword: (email: string) => Promise<void>;
}

export const useForgotPassword = (): UseForgotPasswordResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setSuccess(false);
    setError(null);
  };

  const submitForgotPassword = async (email: string) => {
    resetState();
    setIsLoading(true);

    try {
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      console.error('Forgot password failed', err);
      let msg =
        'No se ha podido enviar el correo de recuperación. Verifica que la dirección es correcta.';
      if (err.response?.data?.message) {
        msg = err.response.data.message;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, success, error, resetState, submitForgotPassword };
};
