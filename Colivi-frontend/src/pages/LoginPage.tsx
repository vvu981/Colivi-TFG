import { AuthLayout } from "../layouts/AuthLayout";
import { LoginForm } from "../features/auth";

export const LoginPage = () => {
  return (
    <AuthLayout
      title="Inicia sesión en tu cuenta"
      subtitle="Introduce tus datos para acceder a tu panel de hogar o reservas."
    >
      <LoginForm />
    </AuthLayout>
  );
};