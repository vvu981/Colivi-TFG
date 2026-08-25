import React from 'react';
import { Wifi, Thermometer, Wind, PawPrint, Building2, Sunset } from 'lucide-react';
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
};

export const ALL_AMENITIES = Object.keys(AMENITY_CONFIG) as AmenityType[];
