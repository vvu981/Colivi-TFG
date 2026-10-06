import { useState } from 'react';
import { isAxiosError } from 'axios';
import { authService } from '../services/authService';

interface UseRequestReactivationResult {
  isLoading: boolean;
  success: boolean;
  error: string | null;
  resetState: () => void;
  submitRequestReactivation: (email: string) => Promise<void>;
}

export const useRequestReactivation = (): UseRequestReactivationResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setSuccess(false);
    setError(null);
  };

  const submitRequestReactivation = async (email: string) => {
    resetState();
    setIsLoading(true);

    try {
      await authService.requestReactivation(email);
      setSuccess(true);
    } catch (err) {
      if (isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            'No se ha podido procesar la solicitud de reactivación. Verifica la dirección introducida.'
        );
      } else {
        setError('Ocurrió un error inesperado al intentar solicitar la reactivación.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, success, error, resetState, submitRequestReactivation };
};
