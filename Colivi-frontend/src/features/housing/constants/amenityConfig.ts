import React from 'react';
import {
  Wifi,
  Thermometer,
  Wind,
  PawPrint,
  Building2,
  Sunset,
  Car,
  WashingMachine,
  UtensilsCrossed,
  Sun,
  Waves,
  Laptop,
  Cigarette,
} from 'lucide-react';
import type { AmenityType } from '../types/accommodation.types';

export interface AmenityMetadata {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const AMENITY_CONFIG: Record<AmenityType, AmenityMetadata> = {
  WIFI: { label: 'WiFi', icon: Wifi },
  HEATING: { label: 'Calefacción', icon: Thermometer },
  AIR_CONDITIONING: { label: 'Aire acondicionado', icon: Wind },
  PETS_ALLOWED: { label: 'Mascotas', icon: PawPrint },
  ELEVATOR: { label: 'Ascensor', icon: Building2 },
  BALCONY: { label: 'Balcón', icon: Sunset },
  PARKING: { label: 'Aparcamiento', icon: Car },
  WASHING_MACHINE: { label: 'Lavadora', icon: WashingMachine },
  DISHWASHER: { label: 'Lavavajillas', icon: UtensilsCrossed },
  TERRACE: { label: 'Terraza', icon: Sun },
  SWIMMING_POOL: { label: 'Piscina', icon: Waves },
  WORK_ZONE: { label: 'Zona de trabajo', icon: Laptop },
  SMOKING_ALLOWED: { label: 'Permitido fumar', icon: Cigarette },
};

export const ALL_AMENITIES = Object.keys(AMENITY_CONFIG) as AmenityType[];
