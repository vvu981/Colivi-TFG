import React from "react";
import { ColiviPhoneInput } from "../../../components/ui/ColiviPhoneInput";
import { type Value as PhoneValue } from "react-phone-number-input";

interface UserInfo {
  email: string;
  nickname: string;
  firstName: string;
  lastName1: string | null;
  lastName2: string | null;
  phone: string | null;
}

interface ProfilePersonalInfoFormProps {
  user: UserInfo;
  isEditing: boolean;
  formData: {
    nickname: string;
    firstName: string;
    lastName1: string;
    lastName2: string;
    phone: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhoneChange: (value: PhoneValue | undefined) => void;
}

export const ProfilePersonalInfoForm: React.FC<ProfilePersonalInfoFormProps> = ({
  user,
  isEditing,
  formData,
  onChange,
  onPhoneChange,
}) => {
  return (
    <section className="w-full max-w-3xl mb-10">
      <div className="bg-surface rounded-xl border border-outline-variant p-6 md:p-10 ambient-shadow transition-all-200 hover-ambient-shadow">
        <h3 className="font-headline-sm text-headline-sm mb-6 text-on-surface border-b border-surface-container pb-4">
          Información Personal
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nickname */}
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-outline mb-1">Nickname</span>
            {isEditing ? (
              <input
                type="text"
                name="nickname"
                value={formData.nickname}
                onChange={onChange}
                className="border border-outline-variant rounded px-2 py-1 bg-surface-container-lowest text-on-surface focus:outline-primary"
              />
            ) : (
              <span className="font-body-md text-body-md text-on-surface">
                {user.nickname || "-"}
              </span>
            )}
          </div>

          {/* Nombre */}
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-outline mb-1">Nombre</span>
            {isEditing ? (
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={onChange}
                className="border border-outline-variant rounded px-2 py-1 bg-surface-container-lowest text-on-surface focus:outline-primary"
              />
            ) : (
              <span className="font-body-md text-body-md text-on-surface">
                {user.firstName || "-"}
              </span>
            )}
          </div>

          {/* Primer Apellido */}
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-outline mb-1">Primer Apellido</span>
            {isEditing ? (
              <input
                type="text"
                name="lastName1"
                value={formData.lastName1}
                onChange={onChange}
                className="border border-outline-variant rounded px-2 py-1 bg-surface-container-lowest text-on-surface focus:outline-primary"
              />
            ) : (
              <span className="font-body-md text-body-md text-on-surface">
                {user.lastName1 || "-"}
              </span>
            )}
          </div>

          {/* Segundo Apellido */}
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-outline mb-1">Segundo Apellido</span>
            {isEditing ? (
              <input
                type="text"
                name="lastName2"
                value={formData.lastName2}
                onChange={onChange}
                className="border border-outline-variant rounded px-2 py-1 bg-surface-container-lowest text-on-surface focus:outline-primary"
              />
            ) : (
              <span className="font-body-md text-body-md text-on-surface">
                {user.lastName2 || "-"}
              </span>
            )}
          </div>

          {/* Email (Read-only) */}
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-outline mb-1">Email</span>
            <span className="font-body-md text-body-md text-on-surface">
              {user.email}
            </span>
          </div>

          {/* Teléfono */}
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-outline mb-1">Teléfono</span>
            {isEditing ? (
              <ColiviPhoneInput
                id="phone"
                value={formData.phone as PhoneValue}
                onChange={onPhoneChange}
              />
            ) : (
              <span className="font-body-md text-body-md text-on-surface">
                {user.phone || "No especificado"}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
