import { AuthLayout } from "../layouts/AuthLayout";
import { RegisterForm } from "../features/auth";

export const RegisterPage = () => {
  return (
    <AuthLayout 
      title="Crea tu cuenta en Colivi"
      subtitle="Únete a la comunidad de coliving de forma rápida y segura."
    >
      <RegisterForm />
    </AuthLayout>
  );
};
