import React, { useRef } from "react";
import { Spinner } from "../../../components/feedback/Spinner";

interface ProfileHeaderProps {
  user: {
    nickname: string;
    role: string;
    createdAt: string;
    profilePicUrl: string | null;
  };
  isUploadingPhoto: boolean;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, isUploadingPhoto, onPhotoChange }) => {
  const photoInputRef = useRef<HTMLInputElement>(null);

  const memberSince = new Date(user.createdAt).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });
  const formattedMemberSince = memberSince.charAt(0).toUpperCase() + memberSince.slice(1);

  const roleLabel =
    user.role === "TENANT"
      ? "Tenant"
      : user.role === "OWNER"
      ? "Propietario"
      : "Admin";

  return (
    <section className="flex flex-col items-center mb-16 w-full max-w-2xl text-center">
      <div className="relative mb-6 group">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-surface shadow-sm relative bg-surface-variant flex items-center justify-center">
          {isUploadingPhoto ? (
            <div className="flex justify-center items-center h-full w-full bg-surface-variant">
              <Spinner />
            </div>
          ) : user.profilePicUrl ? (
            <img
              alt="Avatar"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              src={user.profilePicUrl}
            />
          ) : (
            <div className="w-full h-full bg-primary/10 text-primary flex items-center justify-center text-4xl font-extrabold font-display">
              {user.nickname?.charAt(0).toUpperCase() ?? '?'}
            </div>
          )}
        </div>
        <button
          onClick={() => photoInputRef.current?.click()}
          disabled={isUploadingPhoto}
          className="absolute bottom-0 right-0 bg-surface text-on-surface p-2 rounded-full border border-outline-variant shadow-sm hover:bg-surface-container-low transition-colors duration-200 group-hover:scale-110 flex items-center justify-center disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[20px]">photo_camera</span>
        </button>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPhotoChange}
        />
      </div>
      <h2 className="font-headline-md text-headline-md mb-1 text-on-surface">
        {user.nickname}
      </h2>
      
      {user.role === "ADMIN" && (
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="bg-error-container text-on-error-container font-label-sm text-label-sm px-4 py-1 rounded-full inline-flex items-center gap-1 border border-error">
            {roleLabel}
          </span>
        </div>
      )}

      <p className="font-body-md text-body-md text-on-surface-variant mt-1 text-center w-full">
        Miembro desde<br />
        <span className="font-medium">{formattedMemberSince}</span>
      </p>
    </section>
  );
};
