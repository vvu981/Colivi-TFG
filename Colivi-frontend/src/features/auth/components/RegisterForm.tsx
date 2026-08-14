import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";
import PhoneInput, { type Value as PhoneValue } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { PhoneCountrySelect } from "../../../components/ui/PhoneCountrySelect";

export const RegisterForm = () => {
  const { register, logout } = useAuth();
  const navigate = useNavigate();

  const [nickname, setNickname] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName1, setLastName1] = useState("");
  const [lastName2, setLastName2] = useState("");
  const [phone, setPhone] = useState<PhoneValue | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePhoto(file);
    const reader = new FileReader();
    reader.onload = (ev) => setProfilePhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await register({
        nickname,
        firstName,
        lastName1: lastName1 || undefined,
        lastName2: lastName2 || undefined,
        phone: phone || undefined,
        email,
        password,
      });

      // Si hay foto, la subimos (el token ya está en localStorage tras register)
      if (profilePhoto) {
        try {
          await authService.uploadProfilePicture(profilePhoto);
        } catch {
          // La foto falla silenciosamente: el usuario ya está registrado
          console.warn('Profile picture upload failed, continuing...');
        }
      }

      logout();
      navigate('/login');
    } catch (err: any) {
      console.error("Registration failed", err);
      setError(
        err.response?.data?.message || "Error al crear la cuenta. Inténtalo de nuevo."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = Math.min(Math.floor(password.length / 3), 4);
  const strengthColors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-400"];

  return (
    <div className="w-full">
      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Foto de perfil */}
      <div className="flex flex-col items-center gap-3 mb-2">
        <button
          type="button"
          onClick={() => photoInputRef.current?.click()}
          className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-[#dec0b7] hover:border-[#9f3c16] transition-colors group focus:outline-none"
          aria-label="Subir foto de perfil"
        >
          {profilePhotoPreview ? (
            <img src={profilePhotoPreview} alt="Vista previa" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#FAF8F5] flex flex-col items-center justify-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-[#dec0b7] group-hover:text-[#9f3c16] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
          )}
          {/* Overlay al hover */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
        </button>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />
        <p className="text-xs text-[#565e74]">
          {profilePhotoPreview ? "Cambiar foto" : "Foto de perfil (opcional)"}
        </p>
      </div>

      {/* Nickname */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#0b1c30]" htmlFor="nickname">
            Apodo de usuario <span className="text-[#9f3c16]">*</span>
          </label>
          <input
            id="nickname"
            type="text"
            placeholder="juanca99"
            required
            autoComplete="username"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full bg-white border border-[#dec0b7] text-[#0b1c30] text-sm rounded-lg py-3 px-4 focus:border-[#0b1c30] focus:ring-2 focus:ring-[#dae2fd] focus:outline-none placeholder-[#565e74]/60 transition-all duration-200"
          />
        </div>

        {/* Nombre + Primer Apellido */}
        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-sm font-medium text-[#0b1c30]" htmlFor="first-name">
              Nombre <span className="text-[#9f3c16]">*</span>
            </label>
            <input
              id="first-name"
              type="text"
              placeholder="Juan"
              required
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full bg-white border border-[#dec0b7] text-[#0b1c30] text-sm rounded-lg py-3 px-4 focus:border-[#0b1c30] focus:ring-2 focus:ring-[#dae2fd] focus:outline-none placeholder-[#565e74]/60 transition-all duration-200"
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-sm font-medium text-[#0b1c30]" htmlFor="last-name-1">
              Primer apellido
            </label>
            <input
              id="last-name-1"
              type="text"
              placeholder="Pérez"
              autoComplete="family-name"
              value={lastName1}
              onChange={(e) => setLastName1(e.target.value)}
              className="w-full bg-white border border-[#dec0b7] text-[#0b1c30] text-sm rounded-lg py-3 px-4 focus:border-[#0b1c30] focus:ring-2 focus:ring-[#dae2fd] focus:outline-none placeholder-[#565e74]/60 transition-all duration-200"
            />
          </div>
        </div>

        {/* Segundo Apellido + Teléfono */}
        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-sm font-medium text-[#0b1c30]" htmlFor="last-name-2">
              Segundo apellido
            </label>
            <input
              id="last-name-2"
              type="text"
              placeholder="García (opcional)"
              autoComplete="additional-name"
              value={lastName2}
              onChange={(e) => setLastName2(e.target.value)}
              className="w-full bg-white border border-[#dec0b7] text-[#0b1c30] text-sm rounded-lg py-3 px-4 focus:border-[#0b1c30] focus:ring-2 focus:ring-[#dae2fd] focus:outline-none placeholder-[#565e74]/60 transition-all duration-200"
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-sm font-medium text-[#0b1c30]" htmlFor="phone">
              Teléfono
            </label>
            <PhoneInput
              id="phone"
              international
              defaultCountry="ES"
              value={phone}
              onChange={setPhone}
              countrySelectComponent={PhoneCountrySelect}
              className="phone-input-colivi"
              placeholder="+34 600 000 000"
            />
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#0b1c30]" htmlFor="reg-email">
            Correo electrónico <span className="text-[#9f3c16]">*</span>
          </label>
          <input
            id="reg-email"
            type="email"
            placeholder="juan@ejemplo.com"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white border border-[#dec0b7] text-[#0b1c30] text-sm rounded-lg py-3 px-4 focus:border-[#0b1c30] focus:ring-2 focus:ring-[#dae2fd] focus:outline-none placeholder-[#565e74]/60 transition-all duration-200"
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#0b1c30]" htmlFor="reg-password">
            Contraseña <span className="text-[#9f3c16]">*</span>
          </label>
          <div className="relative">
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              placeholder="Mín. 8 caracteres"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-[#dec0b7] text-[#0b1c30] text-sm rounded-lg py-3 px-4 pr-12 focus:border-[#0b1c30] focus:ring-2 focus:ring-[#dae2fd] focus:outline-none placeholder-[#565e74]/60 transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#565e74] hover:text-[#0b1c30] transition-colors focus:outline-none"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          {/* Barra de fortaleza */}
          {password.length > 0 && (
            <div className="flex gap-1 mt-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                    i < passwordStrength ? strengthColors[passwordStrength - 1] : "bg-[#dec0b7]"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Términos */}
        <div className="flex items-start gap-3 mt-1">
          <input
            id="terms"
            type="checkbox"
            required
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-[#9f3c16] border-[#dec0b7] rounded focus:ring-[#9f3c16] focus:ring-offset-0 bg-white cursor-pointer"
          />
          <label className="text-sm text-[#565e74] cursor-pointer" htmlFor="terms">
            Acepto los{" "}
            <a href="#" className="text-[#9f3c16] hover:underline font-medium">
              Términos de servicio
            </a>{" "}
            y la{" "}
            <a href="#" className="text-[#9f3c16] hover:underline font-medium">
              Política de privacidad
            </a>
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-6 bg-[#9f3c16] text-white text-sm font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-[#9f3c16]/20 mt-2 ${
            isLoading ? "opacity-70 cursor-not-allowed" : "hover:bg-[#bf542c]"
          }`}
        >
          {isLoading ? "Creando cuenta..." : "Crear cuenta gratis"}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-8 text-center text-sm text-[#565e74]">
        ¿Ya tienes cuenta?{" "}
        <Link
          to="/login"
          className="font-semibold text-[#9f3c16] hover:text-[#bf542c] hover:underline underline-offset-4 transition-colors"
        >
          Inicia sesión
        </Link>
      </p>
    </div>
  );
};
