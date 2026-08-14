import { useState } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { useUser } from "../hooks/useUser";
import { Spinner } from "../../../components/feedback/Spinner";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { type Value as PhoneValue } from "react-phone-number-input";
import { ProfileHeader } from "./ProfileHeader";
import { ProfilePersonalInfoForm } from "./ProfilePersonalInfoForm";
export const Profile = () => {
  const { logout } = useAuth();
  const { user, updateProfile, updateProfilePicture } = useUser();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nickname: "",
    firstName: "",
    lastName1: "",
    lastName2: "",
    phone: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="flex justify-center items-center h-full w-full">
        <Spinner />
      </div>
    );
  }



  const handleEditClick = () => {
    setFormData({
      nickname: user.nickname || "",
      firstName: user.firstName || "",
      lastName1: user.lastName1 || "",
      lastName2: user.lastName2 || "",
      phone: user.phone || "",
    });
    setError(null);
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setError(null);
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhoneChange = (value: PhoneValue | undefined) => {
    setFormData({ ...formData, phone: value || "" });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      await updateProfilePicture(file);
    } catch (error) {
      console.error("Error uploading profile picture", error);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      
      // Basic frontend validations
      if (!formData.firstName.trim()) {
        setError("El nombre es obligatorio.");
        return;
      }
      if (!formData.nickname.trim()) {
        setError("El nickname es obligatorio.");
        return;
      }

      setIsSaving(true);
      await updateProfile({
        nickname: formData.nickname,
        firstName: formData.firstName,
        lastName1: formData.lastName1,
        lastName2: formData.lastName2,
        phone: formData.phone,
      });
      setIsEditing(false);
    } catch (err: any) {
      console.error("Error updating profile", err);
      let msg = "No se pudo actualizar el perfil. Verifica los datos o si el nickname ya está en uso.";
      if (err.response?.data?.message) {
         msg = err.response.data.message;
      } else if (err.response?.data?.error) {
         msg = err.response.data.error;
      } else if (Array.isArray(err.response?.data?.errors) && err.response.data.errors.length > 0) {
         msg = err.response.data.errors[0].defaultMessage || err.response.data.errors[0].msg || msg;
      }
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <ProfileHeader 
        user={user}
        isUploadingPhoto={isUploadingPhoto} 
        onPhotoChange={handlePhotoChange}
      />

      <ProfilePersonalInfoForm
        user={user}
        isEditing={isEditing}
        formData={formData}
        onChange={handleChange}
        onPhoneChange={handlePhoneChange}
      />

      {error && (
        <div className="w-full max-w-3xl mt-md">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
            {error}
          </div>
        </div>
      )}

      {/* Actions Section */}
      <section className="w-full max-w-3xl flex flex-col md:flex-row items-center justify-between gap-md mt-lg">
        <div className="flex flex-col md:flex-row gap-md w-full md:w-auto">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-primary text-on-primary font-label-md text-label-md px-xl py-md rounded-lg transition-colors duration-200 hover:bg-on-primary-fixed-variant flex items-center justify-center gap-sm w-full md:w-auto disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">save</span>
                {isSaving ? "Guardando..." : "Guardar Cambios"}
              </button>
              <button
                onClick={handleCancelClick}
                disabled={isSaving}
                className="bg-surface-variant text-on-surface-variant font-label-md text-label-md px-xl py-md rounded-lg transition-colors duration-200 hover:bg-surface-dim flex items-center justify-center gap-sm w-full md:w-auto"
              >
                <span className="material-symbols-outlined text-[20px]">cancel</span>
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleEditClick}
                className="bg-primary text-on-primary font-label-md text-label-md px-xl py-md rounded-lg transition-colors duration-200 hover:bg-on-primary-fixed-variant flex items-center justify-center gap-sm w-full md:w-auto"
              >
                <span className="material-symbols-outlined text-[20px]">edit</span>
                Editar Información
              </button>
              <button 
                onClick={() => setIsChangePasswordModalOpen(true)}
                className="bg-surface text-on-surface font-label-md text-label-md px-xl py-md rounded-lg border border-outline-variant transition-colors duration-200 hover:bg-surface-container-low flex items-center justify-center gap-sm w-full md:w-auto"
              >
                <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                Cambiar Contraseña
              </button>
            </>
          )}
        </div>
        {!isEditing && (
          <button
            onClick={logout}
            className="text-error font-label-md text-label-md px-lg py-md rounded-lg hover:bg-error-container transition-colors duration-200 flex items-center justify-center gap-sm w-full md:w-auto mt-md md:mt-0"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Cerrar sesión
          </button>
        )}
      </section>

      <ChangePasswordModal 
        isOpen={isChangePasswordModalOpen} 
        onClose={() => setIsChangePasswordModalOpen(false)} 
      />
    </div>
  );
};
