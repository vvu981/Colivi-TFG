import { useAuth } from "../../auth/context/AuthContext";

export const useUser = () => {
  const { user, updateProfile, updateProfilePicture } = useAuth();

  return {
    user,
    updateProfile,
    updateProfilePicture,
  };
};
