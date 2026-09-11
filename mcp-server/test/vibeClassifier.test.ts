import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { VibeClassifier, VibeType } from "../src/domain/vibeClassifier.js";
import { AccommodationListingItem } from "../src/clients/listingClient.js";

describe("VibeClassifier Suite", () => {
  const baseListing: AccommodationListingItem = {
    id: "lst-1",
    title: "Habitación luminosa",
    description: "Espacio agradable para convivir",
    pricePerMonth: 500,
    rentalType: "ROOM",
    status: "ACTIVE",
    accommodation: {
      id: "acc-1",
      address: "Calle Mayor 1",
      city: "Madrid",
      country: "Spain",
      totalRooms: 3,
      freeRooms: 1,
      amenities: []
    }
  };

  it("should classify as TIDY when CLEANING_SERVICE amenity is present", () => {
    const listing: AccommodationListingItem = {
      ...baseListing,
      accommodation: {
        ...baseListing.accommodation!,
        amenities: ["CLEANING_SERVICE"]
      }
    };
    assert.equal(VibeClassifier.classify(listing), "TIDY");
  });

  it("should classify as TIDY when description mentions 'orden', 'limpieza' or 'tidy'", () => {
    assert.equal(VibeClassifier.classify({ ...baseListing, description: "Buscamos orden en casa" }), "TIDY");
    assert.equal(VibeClassifier.classify({ ...baseListing, description: "Piso con mucha limpieza semanal" }), "TIDY");
    assert.equal(VibeClassifier.classify({ ...baseListing, description: "Keep it tidy and organized" }), "TIDY");
  });

  it("should classify as SOCIAL when TERRACE or COMMON_ROOM amenity is present", () => {
    const listingWithTerrace: AccommodationListingItem = {
      ...baseListing,
      accommodation: {
        ...baseListing.accommodation!,
        amenities: ["TERRACE"]
      }
    };
    assert.equal(VibeClassifier.classify(listingWithTerrace), "SOCIAL");

    const listingWithCommonRoom: AccommodationListingItem = {
      ...baseListing,
      accommodation: {
        ...baseListing.accommodation!,
        amenities: ["COMMON_ROOM"]
      }
    };
    assert.equal(VibeClassifier.classify(listingWithCommonRoom), "SOCIAL");
  });

  it("should classify as SOCIAL when description mentions social keywords", () => {
    assert.equal(VibeClassifier.classify({ ...baseListing, description: "Ambiente muy social y activo" }), "SOCIAL");
    assert.equal(VibeClassifier.classify({ ...baseListing, description: "Nos gusta hacer vida juntos" }), "SOCIAL");
    assert.equal(VibeClassifier.classify({ ...baseListing, description: "Organizamos eventos gastronómicos" }), "SOCIAL");
  });

  it("should classify as QUIET when DESK or SILENT_AREA amenity is present", () => {
    const listingDesk: AccommodationListingItem = {
      ...baseListing,
      accommodation: {
        ...baseListing.accommodation!,
        amenities: ["DESK"]
      }
    };
    assert.equal(VibeClassifier.classify(listingDesk), "QUIET");

    const listingSilent: AccommodationListingItem = {
      ...baseListing,
      accommodation: {
        ...baseListing.accommodation!,
        amenities: ["SILENT_AREA"]
      }
    };
    assert.equal(VibeClassifier.classify(listingSilent), "QUIET");
  });

  it("should classify as QUIET when description mentions quiet keywords", () => {
    assert.equal(VibeClassifier.classify({ ...baseListing, description: "Lugar muy tranquilo" }), "QUIET");
    assert.equal(VibeClassifier.classify({ ...baseListing, description: "Ideal para estudio y concentración" }), "QUIET");
    assert.equal(VibeClassifier.classify({ ...baseListing, description: "Very quiet neighborhood" }), "QUIET");
  });

  it("should default to ANY fallback when no specific keywords or amenities match (F-18)", () => {
    const genericListing: AccommodationListingItem = {
      ...baseListing,
      title: "Habitación",
      description: "Disponible",
      accommodation: {
        ...baseListing.accommodation!,
        amenities: ["WIFI", "HEATING"]
      }
    };
    assert.equal(VibeClassifier.classify(genericListing), "ANY");
  });

  it("should handle null/missing accommodation and amenities gracefully by returning ANY (F-18)", () => {
    const noAccListing: AccommodationListingItem = {
      ...baseListing,
      accommodation: undefined
    };
    assert.equal(VibeClassifier.classify(noAccListing), "ANY");
  });

  it("should handle null or undefined description and title gracefully by returning ANY (F-18)", () => {
    const nullTextListing = {
      ...baseListing,
      title: undefined as unknown as string,
      description: undefined as unknown as string
    };
    assert.equal(VibeClassifier.classify(nullTextListing), "ANY");
  });

  it("should classify as QUIET when official backend WORK_ZONE amenity is present", () => {
    const listingWorkZone: AccommodationListingItem = {
      ...baseListing,
      accommodation: {
        ...baseListing.accommodation!,
        amenities: ["WORK_ZONE"]
      }
    };
    assert.equal(VibeClassifier.classify(listingWorkZone), "QUIET");
  });

  it("should classify as SOCIAL when official backend BALCONY or SWIMMING_POOL is present", () => {
    const listingBalcony: AccommodationListingItem = {
      ...baseListing,
      accommodation: {
        ...baseListing.accommodation!,
        amenities: ["BALCONY"]
      }
    };
    assert.equal(VibeClassifier.classify(listingBalcony), "SOCIAL");
  });

  it("should classify as TIDY when official backend DISHWASHER or WASHING_MACHINE is present", () => {
    const listingDishwasher: AccommodationListingItem = {
      ...baseListing,
      accommodation: {
        ...baseListing.accommodation!,
        amenities: ["DISHWASHER"]
      }
    };
    assert.equal(VibeClassifier.classify(listingDishwasher), "TIDY");
  });

  it("should prioritize SOCIAL or QUIET over generic WASHING_MACHINE / DISHWASHER (DOM-01)", () => {
    const socialWithWasher: AccommodationListingItem = {
      ...baseListing,
      description: "Piso para compartir con amigos",
      accommodation: {
        ...baseListing.accommodation!,
        amenities: ["WASHING_MACHINE", "SWIMMING_POOL", "TERRACE"]
      }
    };
    assert.equal(VibeClassifier.classify(socialWithWasher), "SOCIAL");

    const quietWithDishwasher: AccommodationListingItem = {
      ...baseListing,
      description: "Ambiente silencioso para opositores",
      accommodation: {
        ...baseListing.accommodation!,
        amenities: ["DISHWASHER", "WORK_ZONE", "DESK"]
      }
    };
    assert.equal(VibeClassifier.classify(quietWithDishwasher), "QUIET");
  });

  it("enrichAndFilter: should score 1.0 when vibe matches or is ANY, and 0.5 when mismatched", () => {
    const listings: AccommodationListingItem[] = [
      {
        ...baseListing,
        id: "tidy-1",
        description: "Orden y limpieza"
      },
      {
        ...baseListing,
        id: "social-1",
        description: "Vida juntos y social"
      },
      {
        ...baseListing,
        id: "quiet-1",
        description: "Estudio y tranquilo"
      }
    ];

    // Filter by SOCIAL - only matching listings are returned when requiredVibe != 'ANY'
    const socialEnriched = VibeClassifier.enrichAndFilter(listings, "SOCIAL");
    assert.equal(socialEnriched.length, 1);
    assert.equal(socialEnriched[0].id, "social-1");
    assert.equal(socialEnriched[0].computedVibe, "SOCIAL");
    assert.equal(socialEnriched[0].vibeMatchScore, 1.0);

    // Filter by ANY
    const anyEnriched = VibeClassifier.enrichAndFilter(listings, "ANY");
    assert.ok(anyEnriched.every((l) => l.vibeMatchScore === 1.0));

    // Without requiredVibe
    const defaultEnriched = VibeClassifier.enrichAndFilter(listings);
    assert.ok(defaultEnriched.every((l) => l.vibeMatchScore === 1.0));
  });

  it("should classify as QUIET and not SOCIAL when description contains event/party prohibitions (BUG-04)", () => {
    const listingWithProhibition: AccommodationListingItem = {
      id: "no-party-1",
      title: "Habitación céntrica para opositores",
      description: "Piso de estudio silencioso. Prohibido organizar eventos o fiestas.",
      pricePerMonth: 500,
      rentalType: "ROOM",
      status: "ACTIVE",
      accommodation: {
        id: "acc-np",
        address: "Calle Mayor 1",
        city: "Madrid",
        country: "Spain",
        totalRooms: 3,
        freeRooms: 1,
        amenities: []
      }
    };

    const vibe = VibeClassifier.classify(listingWithProhibition);
    assert.equal(vibe, "QUIET");
  });

  it("should not classify dwelling type 'estudio' as QUIET when no study context is present (DOM-01)", () => {
    const studioApartment: AccommodationListingItem = {
      id: "studio-1",
      title: "Estudio moderno en alquiler",
      description: "Acogedor estudio recién reformado con baño privado y cocina equipada.",
      pricePerMonth: 650,
      rentalType: "STUDIO",
      status: "ACTIVE",
      accommodation: {
        id: "acc-studio",
        address: "Calle Atocha 10",
        city: "Madrid",
        country: "Spain",
        totalRooms: 1,
        freeRooms: 1,
        amenities: ["WIFI", "AIR_CONDITIONING"]
      }
    };

    const vibe = VibeClassifier.classify(studioApartment);
    assert.notEqual(vibe, "QUIET");
    assert.equal(vibe, "ANY");
  });
});
