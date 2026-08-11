import React, { useState } from "react";
import { Link } from "react-router-dom";

export const RegisterForm = () => {
  const [role, setRole] = useState<"tenant" | "owner">("tenant");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Register attempt:", { role, firstName, lastName, email, password, terms });
    // TODO: Implement actual registration logic
  };

  return (
    <div className="w-full">
      {/* Role Selector (Segmented Control) */}
      <div className="flex p-1 bg-surface-container-low rounded-lg mb-lg border border-outline-variant">
        <button
          type="button"
          onClick={() => setRole("tenant")}
          className={`flex-1 py-2 text-center rounded font-label-md text-label-md transition-all ${
            role === "tenant"
              ? "bg-surface shadow-sm text-on-surface border border-outline-variant"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Busco habitación (Inquilino)
        </button>
        <button
          type="button"
          onClick={() => setRole("owner")}
          className={`flex-1 py-2 text-center rounded font-label-md text-label-md transition-all ${
            role === "owner"
              ? "bg-surface shadow-sm text-on-surface border border-outline-variant"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Tengo un inmueble (Propietario)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-lg">
        {/* Name Row */}
        <div className="flex gap-md">
          <div className="flex-1">
            <label className="block font-label-md text-label-md text-on-surface mb-xs" htmlFor="first-name">
              Nombre
            </label>
            <input
              className="block w-full rounded-lg border border-outline-variant py-2 px-3 text-on-surface shadow-sm focus:border-on-surface focus:ring-2 focus:ring-surface-variant focus:ring-offset-0 sm:text-body-md transition-colors bg-surface-container-lowest"
              id="first-name"
              type="text"
              placeholder="Ej. Juan"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block font-label-md text-label-md text-on-surface mb-xs" htmlFor="last-name">
              Apellido
            </label>
            <input
              className="block w-full rounded-lg border border-outline-variant py-2 px-3 text-on-surface shadow-sm focus:border-on-surface focus:ring-2 focus:ring-surface-variant focus:ring-offset-0 sm:text-body-md transition-colors bg-surface-container-lowest"
              id="last-name"
              type="text"
              placeholder="Ej. Pérez"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block font-label-md text-label-md text-on-surface mb-xs" htmlFor="email">
            Correo electrónico
          </label>
          <input
            className="block w-full rounded-lg border border-outline-variant py-2 px-3 text-on-surface shadow-sm focus:border-on-surface focus:ring-2 focus:ring-surface-variant focus:ring-offset-0 sm:text-body-md transition-colors bg-surface-container-lowest"
            id="email"
            type="email"
            placeholder="juan@ejemplo.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div>
          <label className="block font-label-md text-label-md text-on-surface mb-xs" htmlFor="password">
            Contraseña
          </label>
          <input
            className="block w-full rounded-lg border border-outline-variant py-2 px-3 text-on-surface shadow-sm focus:border-on-surface focus:ring-2 focus:ring-surface-variant focus:ring-offset-0 sm:text-body-md transition-colors bg-surface-container-lowest mb-2"
            id="password"
            type="password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {/* Strength Bars (Dummy implementation based on HTML) */}
          <div className="flex gap-1 h-1 mt-2">
            <div className={`flex-1 rounded-full ${password.length > 0 ? "bg-primary" : "bg-outline-variant"}`}></div>
            <div className={`flex-1 rounded-full ${password.length > 4 ? "bg-primary" : "bg-surface-container-high"}`}></div>
            <div className={`flex-1 rounded-full ${password.length > 7 ? "bg-primary" : "bg-surface-container-high"}`}></div>
            <div className={`flex-1 rounded-full ${password.length > 10 ? "bg-primary" : "bg-surface-container-high"}`}></div>
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-1 text-right">Usa al menos 8 caracteres</p>
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-start">
          <div className="flex h-6 items-center">
            <input
              id="terms"
              type="checkbox"
              className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary focus:ring-offset-0"
              required
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
            />
          </div>
          <div className="ml-3">
            <label className="font-body-md text-body-md text-on-surface-variant" htmlFor="terms">
              Acepto los <a className="text-primary hover:underline" href="#">Términos de servicio</a> y la{" "}
              <a className="text-primary hover:underline" href="#">Política de privacidad</a>.
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            className="flex w-full justify-center rounded-lg bg-primary px-4 py-3 font-label-md text-label-md font-semibold text-on-primary shadow-sm hover:bg-surface-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors duration-200"
          >
            Crear cuenta
          </button>
        </div>
      </form>

      {/* Footer Log In Link */}
      <p className="mt-xl text-center font-body-md text-body-md text-on-surface-variant">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" className="font-semibold text-primary hover:text-surface-tint transition-colors">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
};
