import { AuthLayout } from "../layouts/AuthLayout";
import { ForgotPasswordForm } from "../features/auth/components/ForgotPasswordForm";

export const ForgotPasswordPage = () => {
  return (
    <AuthLayout 
      title="Recupera tu contraseña"
      subtitle="Introduce tu correo electrónico y te enviaremos las instrucciones."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
};
