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

/** Respuesta de GET /users/me (MyProfileResponse del backend) */
export interface UserProfile {
  id: string;
  email: string;
  phone: string | null;
  role: 'TENANT' | 'OWNER' | 'ADMIN';
  nickname: string;
  firstName: string;
  lastName1: string | null;
  lastName2: string | null;
  profilePicUrl: string | null;
  createdAt: string;
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

  uploadProfilePicture: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.patch<{ profilePicUrl: string }>(
      '/users/me/profile-picture',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.profilePicUrl;
  },

  getMe: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/users/me');
    return response.data;
  },
};
