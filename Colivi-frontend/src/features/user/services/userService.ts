import api from '../../../lib/api';

export interface UpdateProfileData {
  nickname?: string;
  firstName?: string;
  lastName1?: string;
  lastName2?: string;
  phone?: string;
}

export interface UpdateSensibleData {
  currentPassword?: string;
  newEmail?: string;
  newPassword?: string;
}

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

export const userService = {
  getMe: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/users/me');
    return response.data;
  },

  getById: async (id: string): Promise<UserProfile> => {
    const response = await api.get<UserProfile>(`/users/${id}`);
    return response.data;
  },

  updateProfile: async (data: UpdateProfileData): Promise<UpdateProfileData> => {
    const response = await api.patch<UpdateProfileData>('/users/me/profile', data);
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

  updateCredentials: async (data: UpdateSensibleData): Promise<void> => {
    await api.patch('/users/me/credentials', data);
  },
};
