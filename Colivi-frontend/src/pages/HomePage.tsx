import { MainLayout } from "../layouts/MainLayout";
import { RecommendedListings } from "../features/housing/components/RecommendedListings";
import { SearchBar } from "../features/housing/components/SearchBar";
import { useRecommendations } from "../features/housing/hooks/useRecommendations";

export const HomePage = () => {
  const { data, isLoading, error, search, reset } = useRecommendations();

  return (
    <MainLayout>
      <div className="w-full px-[var(--spacing-margin-mobile)] md:px-[var(--spacing-margin-desktop)] py-10 flex flex-col gap-10">
        {/* Hero heading */}
        <div>
          <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-3">
            Explorar Coliving
          </h1>
          <p className="text-body-lg text-[#565e74]">
            Encuentra tu próximo hogar compartido entre miles de anuncios verificados.
          </p>
        </div>

        {/* Search bar — triggers active search or reset for the current session */}
        <SearchBar onSearch={search} onReset={reset} />

        {/* Recommendations section */}
        <RecommendedListings
          data={data}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </MainLayout>
  );
};