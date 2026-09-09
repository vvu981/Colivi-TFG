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

  it("should default to TIDY fallback when no specific keywords or amenities match", () => {
    const genericListing: AccommodationListingItem = {
      ...baseListing,
      title: "Habitación",
      description: "Disponible",
      accommodation: {
        ...baseListing.accommodation!,
        amenities: ["WIFI", "HEATING"]
      }
    };
    assert.equal(VibeClassifier.classify(genericListing), "TIDY");
  });

  it("should handle null/missing accommodation and amenities gracefully", () => {
    const noAccListing: AccommodationListingItem = {
      ...baseListing,
      accommodation: undefined
    };
    assert.equal(VibeClassifier.classify(noAccListing), "TIDY");
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
});
