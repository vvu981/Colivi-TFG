import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="flex w-full min-h-screen flex-col md:flex-row bg-background text-on-surface">
      {/* Left Column: Form Section */}
      <div className="flex flex-1 flex-col justify-center px-margin-mobile py-2xl sm:px-lg lg:flex-none lg:w-1/2 lg:px-margin-desktop bg-surface-container-lowest">
        <div className="mx-auto w-full max-w-md">
          {/* Brand */}
          <div className="flex items-center gap-2 mb-xl">
            <span className="font-headline-md text-headline-md font-bold text-primary">Colivi</span>
          </div>

          {/* Headings */}
          <h2 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-background mb-sm">
            {title}
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-xl">
            {subtitle}
          </p>

          {/* Injected Feature Form */}
          {children}
        </div>
      </div>

      {/* Right Column: Image & Testimonial */}
      <div className="relative hidden w-full flex-1 lg:flex bg-surface-container-low">
        <img
          alt="Living room setting with people"
          className="absolute inset-0 h-full w-full object-cover"
          src="/img/high_quality_background_Auth.png"
        />
        {/* Gradient Overlay for readability if needed, kept subtle */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>

        {/* Floating Testimonial Card */}
        <div className="absolute bottom-margin-desktop left-margin-desktop right-margin-desktop md:right-auto md:w-[400px]">
          <div className="bg-surface-container-lowest/95 backdrop-blur-sm p-lg rounded-xl border border-outline-variant ambient-shadow">
            <div className="flex items-start gap-4">
              <span className="text-primary text-3xl font-serif">"</span>
              <div>
                <p className="font-body-md text-body-md text-on-surface italic mb-4">
                  Colivi me permitió mudarme a Madrid en 48 horas sin complicaciones.
                </p>
                <p className="font-label-md text-label-md text-on-surface-variant font-semibold">
                  — Marta S.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};