import api from '../../../lib/api';
import type {
  PublicUserProfile,
  UserProfile,
  UpdateProfileData,
  UpdateSensibleData,
} from '../types/user.types';

export type {
  PublicUserProfile,
  UserProfile,
  UpdateProfileData,
  UpdateSensibleData,
};

export const userService = {
  getMe: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/users/me');
    return response.data;
  },

  getById: async (id: string): Promise<PublicUserProfile> => {
    const response = await api.get<PublicUserProfile>(`/users/${id}`);
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

  deleteAccountSoft: async (): Promise<void> => {
    await api.patch('/users/me/delete/soft');
  },
};
