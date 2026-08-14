import api from '../../../lib/api';

// ── DTOs de petición ──────────────────────────────────────────────

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  nickname: string;
  email: string;
  password: string;
  firstName: string;
  lastName1?: string;
  lastName2?: string;
  phone?: string;
}

// ── DTOs de respuesta ────────────────────────────────────────────

/** Respuesta de /auth/login y /auth/register (AuthResponse del backend) */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ── Servicio ──────────────────────────────────────────────────────

export const authService = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  loginWithGoogle: async (idToken: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/google', { idToken });
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await api.post('/auth/reset-password', { token, newPassword });
  },
};
