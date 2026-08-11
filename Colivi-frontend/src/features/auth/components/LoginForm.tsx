import React, { useState } from "react";
import { Link } from "react-router-dom";

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt:", { email, password });
    // TODO: Implement actual login logic with useAuth
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-lg">
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
          <div className="flex items-center justify-between mb-xs">
            <label className="block font-label-md text-label-md text-on-surface" htmlFor="password">
              Contraseña
            </label>
            <a href="#" className="font-label-sm text-label-sm text-primary hover:underline transition-all">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          <input
            className="block w-full rounded-lg border border-outline-variant py-2 px-3 text-on-surface shadow-sm focus:border-on-surface focus:ring-2 focus:ring-surface-variant focus:ring-offset-0 sm:text-body-md transition-colors bg-surface-container-lowest"
            id="password"
            type="password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            className="flex w-full justify-center rounded-lg bg-primary px-4 py-3 font-label-md text-label-md font-semibold text-on-primary shadow-sm hover:bg-surface-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors duration-200"
          >
            Iniciar sesión
          </button>
        </div>
      </form>

      {/* Footer Log In Link */}
      <p className="mt-xl text-center font-body-md text-body-md text-on-surface-variant">
        ¿No tienes cuenta?{" "}
        <Link to="/register" className="font-semibold text-primary hover:text-surface-tint transition-colors">
          Regístrate
        </Link>
      </p>
    </div>
  );
};
