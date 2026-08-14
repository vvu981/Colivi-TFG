import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const LoginForm = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleResponse = async (response: any) => {
    setError("");
    setIsLoading(true);
    try {
      await loginWithGoogle(response.credential);
      navigate("/");
    } catch (err: any) {
      console.error("Google login failed", err);
      setError(
        err.response?.data?.message ||
          "Error al iniciar sesión con Google. Inténtalo de nuevo."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const existingScript = document.getElementById("google-gsi-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initGoogleSignIn();
      };
      document.body.appendChild(script);
    } else {
      initGoogleSignIn();
    }

    function initGoogleSignIn() {
      if ((window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: "107294184753-qo7cnr52fmvavskavnhugpekb2nsge6n.apps.googleusercontent.com",
          callback: handleGoogleResponse,
        });

        const container = document.getElementById("google-btn-container");
        if (container) {
          (window as any).google.accounts.id.renderButton(container, {
            type: "standard",
            theme: "outline",
            size: "large",
            width: container.offsetWidth || 350,
          });
        }
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login({ email, password });
      navigate("/");
    } catch (err: any) {
      console.error("Login attempt failed", err);
      setError(
        err.response?.data?.message ||
          "Credenciales inválidas. Por favor, inténtalo de nuevo."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {/* ── Botones SSO ──────────────────────────────────────── */}
      <div className="flex flex-col gap-3 mb-6">
        <div
          className="relative w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-[#dec0b7] rounded-lg hover:bg-[#eff4ff] transition-all duration-200 focus-within:ring-2 focus-within:ring-[#9f3c16] overflow-hidden"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="text-sm font-medium text-[#0b1c30]">Continuar con Google</span>
          
          <div 
            id="google-btn-container" 
            className="absolute inset-0 opacity-0 cursor-pointer [&_*]:cursor-pointer [&_iframe]:w-full [&_iframe]:h-full"
          />
        </div>
      </div>

      {/* ── Separador ────────────────────────────────────────── */}
      <div className="flex items-center mb-6">
        <div className="flex-grow border-t border-[#dec0b7]" />
        <span className="mx-3 text-xs font-semibold tracking-wide text-[#565e74] bg-[#FAF8F5]">
          o con tu correo electrónico
        </span>
        <div className="flex-grow border-t border-[#dec0b7]" />
      </div>

      {/* ── Formulario ───────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#0b1c30]" htmlFor="email">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            placeholder="ejemplo@correo.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white border border-[#dec0b7] text-[#0b1c30] text-sm rounded-lg py-3 px-4 focus:border-[#0b1c30] focus:ring-2 focus:ring-[#dae2fd] focus:outline-none placeholder-[#565e74]/60 transition-all duration-200"
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#0b1c30]" htmlFor="password">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              required
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
        </div>

        {/* Recordar + ¿Olvidaste? */}
        <div className="flex items-center justify-between mt-1 mb-2">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-[#9f3c16] border-[#dec0b7] rounded focus:ring-[#9f3c16] focus:ring-offset-0 bg-white cursor-pointer transition-colors"
            />
            <span className="text-sm text-[#565e74] group-hover:text-[#0b1c30] transition-colors">
              Recordar sesión
            </span>
          </label>
          <a
            href="#"
            className="text-sm font-medium text-[#9f3c16] hover:text-[#bf542c] hover:underline underline-offset-4 transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-6 bg-[#9f3c16] text-white text-sm font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-[#9f3c16]/20 ${
            isLoading
              ? "opacity-70 cursor-not-allowed"
              : "hover:bg-[#bf542c]"
          }`}
        >
          {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-8 text-center text-sm text-[#565e74]">
        ¿Aún no tienes cuenta?{" "}
        <Link
          to="/register"
          className="font-semibold text-[#9f3c16] hover:text-[#bf542c] hover:underline underline-offset-4 transition-colors"
        >
          Regístrate gratis
        </Link>
      </p>
    </div>
  );
};