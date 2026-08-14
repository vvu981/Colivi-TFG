import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <main
      className="antialiased"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      {/* ── Columna Izquierda ── */}
      <div
        className="flex flex-col justify-center bg-[#FAF8F5]"
        style={{ padding: "3rem 4rem" }}
      >
        <div style={{ maxWidth: "28rem", width: "100%", margin: "0 auto" }}>
          {/* Logo */}
          <div style={{ marginBottom: "2.5rem" }}>
            <span
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "#9f3c16",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Colivi
            </span>
          </div>

          {/* Títulos */}
          <div style={{ marginBottom: "2rem" }}>
            <h1
              style={{
                fontSize: "2.25rem",
                fontWeight: 700,
                color: "#0b1c30",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
                marginBottom: "0.75rem",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontSize: "1rem",
                color: "#565e74",
                lineHeight: 1.6,
                fontFamily: "Inter, sans-serif",
              }}
            >
              {subtitle}
            </p>
          </div>

          {/* Formulario */}
          {children}
        </div>
      </div>

      {/* ── Columna Derecha (imagen) ── */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        <img
          alt="Sala de estar moderna de un coliving"
          src="/img/high_quality_background_Auth.png"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "1.5rem 0 0 1.5rem",
          }}
        />
        {/* Tarjeta flotante */}
        <div
          style={{
            position: "absolute",
            bottom: "3rem",
            left: "3rem",
            right: "3rem",
            maxWidth: "22rem",
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.6)",
            borderRadius: "0.75rem",
            padding: "1.5rem",
            boxShadow: "0 4px 20px rgba(15,23,42,0.10)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
            <div
              style={{
                padding: "0.625rem",
                background: "#eff4ff",
                borderRadius: "9999px",
                color: "#9f3c16",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                groups
              </span>
            </div>
            <p
              style={{
                fontSize: "0.9375rem",
                color: "#0b1c30",
                fontWeight: 500,
                lineHeight: 1.6,
                fontFamily: "Inter, sans-serif",
              }}
            >
              "Más de 2.000 inquilinos ya han encontrado su hogar ideal sin papeleos"
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};