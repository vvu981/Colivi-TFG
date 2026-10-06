import { MainLayout } from "../layouts/MainLayout";
import { Profile } from "../features/user/components/Profile";

export const ProfilePage = () => {
  return (
    <MainLayout>
      <div className="w-full px-margin-mobile md:px-margin-desktop py-10 flex flex-col items-center">
        <Profile />
      </div>
    </MainLayout>
  );
};
