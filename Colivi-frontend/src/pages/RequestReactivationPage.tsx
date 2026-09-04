import { AuthLayout } from '../layouts/AuthLayout';
import { RequestReactivationForm } from '../features/auth/components/RequestReactivationForm';

export const RequestReactivationPage = () => {
  return (
    <AuthLayout
      title="Reactiva tu cuenta"
      subtitle="Introduce tu correo electrónico para recibir el enlace de reactivación."
    >
      <RequestReactivationForm />
    </AuthLayout>
  );
};

export default RequestReactivationPage;
