import { AuthLayout } from "../layouts/AuthLayout";
import { ResetPasswordForm } from "../features/auth/components/ResetPasswordForm";

export const ResetPasswordPage = () => {
  return (
    <AuthLayout 
      title="Restablecer contraseña"
      subtitle="Elige una nueva contraseña segura para tu cuenta."
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
};
