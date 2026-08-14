import { MainLayout } from "../layouts/MainLayout";

export const HomePage = () => {
  return (
    <MainLayout>
      <div className="w-full px-margin-mobile md:px-margin-desktop py-xl">
        <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-lg">
          Explorar Coliving
        </h1>
        <p className="text-on-surface-variant font-body-lg text-body-lg">
          Página de búsqueda en construcción...
        </p>
      </div>
    </MainLayout>
  );
};