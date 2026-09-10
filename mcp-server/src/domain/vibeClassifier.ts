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

    // 1. Detección de indicadores de estilo de vida y ambiente
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
      description.includes("social") ||
      description.includes("vida juntos") ||
      description.includes("eventos") ||
      description.includes("comunidad");

    const hasQuiet =
      amenities.includes("WORK_ZONE") ||
      amenities.includes("DESK") ||
      amenities.includes("SILENT_AREA") ||
      description.includes("tranquilo") ||
      description.includes("estudio") ||
      description.includes("quiet") ||
      description.includes("concentracion") ||
      description.includes("silencio");

    // 2. Prevalencia de estilos de vida distintivos (DOM-01)
    if (hasExplicitTidy && !hasSocial && !hasQuiet) {
      return "TIDY";
    }

    if (hasSocial && !hasQuiet) {
      return "SOCIAL";
    }

    if (hasQuiet && !hasSocial) {
      return "QUIET";
    }

    if (hasSocial) {
      return "SOCIAL";
    }

    if (hasQuiet) {
      return "QUIET";
    }

    if (hasExplicitTidy) {
      return "TIDY";
    }

    // 3. Electrodomésticos convencionales como indicador secundario de equipamiento
    if (amenities.includes("DISHWASHER") || amenities.includes("WASHING_MACHINE")) {
      return "TIDY";
    }

    // Fallback por defecto equilibrado
    return "TIDY";
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
