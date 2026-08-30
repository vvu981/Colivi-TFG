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

/**
 * Full user profile data (private, accessible via /users/me).
 */
export interface UserProfile {
  id: string;
  email: string;
  phone: string | null;
  role: 'USER' | 'ADMIN' | 'TENANT' | 'OWNER';
  nickname: string;
  firstName: string;
  lastName1: string | null;
  lastName2: string | null;
  profilePicUrl: string | null;
  createdAt: string;
}

/**
 * Public user profile data (accessible via /users/:id).
 * Excludes sensitive personal information such as email and phone number.
 */
export interface PublicUserProfile {
  id: string;
  nickname: string;
  firstName: string;
  lastName1: string | null;
  lastName2: string | null;
  profilePicUrl: string | null;
  createdAt: string;
}
