import { AccommodationListingItem } from "../clients/listingClient.js";

export type VibeType = "TIDY" | "SOCIAL" | "QUIET" | "ANY";

export interface ListingWithVibe extends AccommodationListingItem {
  computedVibe: VibeType;
  vibeMatchScore: number;
}

export class VibeClassifier {
  /**
   * Determina el ambiente de convivencia proyectado a partir de amenidades y características.
   */
  public static classify(listing: AccommodationListingItem): VibeType {
    const amenities = listing.accommodation?.amenities?.map((a) => a.toUpperCase()) ?? [];
    const description = `${listing.description ?? ""} ${listing.title ?? ""}`.toLowerCase();

    // 1. Detección de indicadores de estilo de vida y ambiente con control de polaridad léxica (BUG-04)
    const hasSocialNegation =
      /(?:prohibid[oa]s?|no\s+(?:se\s+)?permiten?|sin|cero)\s+(?:celebrar\s+|organizar\s+)?(?:fiestas?|eventos?|ruidos?|juergas?)/i.test(
        description
      );

    const hasExplicitTidy =
      amenities.includes("CLEANING_SERVICE") ||
      description.includes("orden") ||
      description.includes("limpieza") ||
      description.includes("tidy") ||
      description.includes("organizado");

    const hasSocial =
      amenities.includes("TERRACE") ||
      amenities.includes("BALCONY") ||
      amenities.includes("SWIMMING_POOL") ||
      amenities.includes("COMMON_ROOM") ||
      (!hasSocialNegation &&
        (description.includes("social") ||
          description.includes("vida juntos") ||
          description.includes("eventos") ||
          description.includes("comunidad")));

    const hasQuiet =
      amenities.includes("WORK_ZONE") ||
      amenities.includes("DESK") ||
      amenities.includes("SILENT_AREA") ||
      description.includes("tranquilo") ||
      description.includes("estudio") ||
      description.includes("quiet") ||
      description.includes("concentracion") ||
      description.includes("silencio") ||
      hasSocialNegation;

    // 2. Prevalencia de estilos de vida distintivos (DOM-01 y DOM-02)
    if (hasSocial && !hasQuiet) {
      return "SOCIAL";
    }

    if (hasQuiet && !hasSocial) {
      return "QUIET";
    }

    if (hasSocial && hasQuiet) {
      // Desempate de ambientes híbridos por recuento de amenidades dedicadas
      const socialAmenitiesCount = amenities.filter((a) =>
        ["TERRACE", "BALCONY", "SWIMMING_POOL", "COMMON_ROOM"].includes(a)
      ).length;
      const quietAmenitiesCount = amenities.filter((a) =>
        ["WORK_ZONE", "DESK", "SILENT_AREA"].includes(a)
      ).length;

      return socialAmenitiesCount >= quietAmenitiesCount ? "SOCIAL" : "QUIET";
    }

    if (hasExplicitTidy) {
      return "TIDY";
    }

    // Electrodomesticos convencionales como indicador secundario de hogar ordenado
    if (amenities.includes("DISHWASHER") || amenities.includes("WASHING_MACHINE")) {
      return "TIDY";
    }

    // F-18: Fallback "ANY" para anuncios sin amenidades clasificables.
    // El fallback anterior era "TIDY" (sesgado), lo que causaba que anuncios
    // sin datos de amenidades aparecieran como TIDY y fueran excluidos al buscar
    // QUIET o SOCIAL, generando falsos negativos en la busqueda.
    // Con "ANY", estos anuncios no se filtran y el LLM puede indicar que la
    // clasificacion no es determinable para ese anuncio.
    return "ANY";
  }

  public static enrichAndFilter(
    listings: AccommodationListingItem[],
    requiredVibe?: VibeType
  ): ListingWithVibe[] {
    const enriched = listings.map((item) => {
      const computedVibe = this.classify(item);
      const vibeMatchScore =
        !requiredVibe || requiredVibe === "ANY" || computedVibe === requiredVibe ? 1.0 : 0.5;

      return {
        ...item,
        computedVibe,
        vibeMatchScore
      };
    });

    if (!requiredVibe || requiredVibe === "ANY") {
      return enriched;
    }

    return enriched.filter((item) => item.computedVibe === requiredVibe);
  }
}
