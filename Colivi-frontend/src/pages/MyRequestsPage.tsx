import { MainLayout } from '../layouts/MainLayout';
import { MyRequests } from '../features/housing/components/MyRequests';

export const MyRequestsPage = () => {
  return (
    <MainLayout>
      <div className="w-full px-margin-mobile md:px-margin-desktop py-10 max-w-5xl mx-auto">
        <MyRequests />
      </div>
    </MainLayout>
  );
};
