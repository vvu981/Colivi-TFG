import React from 'react';
import { BedDouble, Bath, Maximize2, Users, DoorOpen } from 'lucide-react';
import type { AccommodationResponse } from '../../types/accommodation.types';
import type { RentalType } from '../../types/listing.types';

export interface ListingSpecsProps {
  accommodation: AccommodationResponse;
  rentalType: RentalType | string;
}

/**
 * Key property and coliving specifications cards.
 * Single Responsibility: Presenting space and room metrics cleanly.
 */
export const ListingSpecs: React.FC<ListingSpecsProps> = ({ accommodation, rentalType }) => {
  const { totalRooms, freeRooms, totalBathrooms, squareMeters } = accommodation;
  const isRoom = rentalType === 'ROOM';

  const specs = [
    {
      icon: <BedDouble size={20} className="text-primary" />,
      label: 'Habitaciones',
      value: `${totalRooms} ${totalRooms === 1 ? 'habitación' : 'habitaciones'}`,
      description: isRoom
        ? `${freeRooms} ${freeRooms === 1 ? 'disponible' : 'disponibles'}`
        : 'Alojamiento entero',
    },
    {
      icon: <Bath size={20} className="text-primary" />,
      label: 'Baños',
      value: `${totalBathrooms} ${totalBathrooms === 1 ? 'baño' : 'baños'}`,
      description: isRoom ? 'Compartido o privado' : 'De uso exclusivo',
    },
    {
      icon: <Maximize2 size={20} className="text-primary" />,
      label: 'Superficie',
      value: `${squareMeters} m²`,
      description: 'Espacio total construido',
    },
    {
      icon: isRoom ? <Users size={20} className="text-primary" /> : <DoorOpen size={20} className="text-primary" />,
      label: 'Modalidad',
      value: isRoom ? 'Co-living' : 'Entero',
      description: isRoom ? 'Habitación en piso compartido' : 'Sin otros inquilinos',
    },
  ];

  return (
    <section className="py-6 border-y border-outline-variant">
      <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-4">
        Características principales
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {specs.map((item, index) => (
          <div
            key={index}
            className="flex flex-col gap-1 p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant shadow-2xs"
          >
            <div className="flex items-center gap-2">
              {item.icon}
              <span className="text-xs text-on-surface-variant font-medium">{item.label}</span>
            </div>
            <span className="text-sm font-bold text-on-surface mt-1">{item.value}</span>
            <span className="text-[11px] text-on-surface-variant leading-tight">{item.description}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
