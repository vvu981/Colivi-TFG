import React from "react";
import { AuthLayout } from "../layouts/AuthLayout";
import { LoginForm } from "../features/auth";

export const LoginPage = () => {
  return (
    <AuthLayout 
      title="Inicia sesión en tu cuenta"
      subtitle="Bienvenido de nuevo a la comunidad Colivi."
    >
      <LoginForm />
    </AuthLayout>
  );
};