import { useAuth } from "../../auth/context/AuthContext";
import { userService, type UpdateProfileData } from "../services/userService";

export const useUser = () => {
  const { user, updateUserContextData } = useAuth();

  const updateProfile = async (data: UpdateProfileData) => {
    const updatedData = await userService.updateProfile(data);
    updateUserContextData(updatedData);
  };

  const updateProfilePicture = async (file: File) => {
    const newUrl = await userService.uploadProfilePicture(file);
    updateUserContextData({ profilePicUrl: newUrl });
  };

  return {
    user,
    updateProfile,
    updateProfilePicture,
  };
};
