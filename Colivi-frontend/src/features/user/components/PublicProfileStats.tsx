import React from 'react';
import { Home, Calendar, UserCheck } from 'lucide-react';

export interface PublicProfileStatsProps {
  listingsCount: number;
  createdAt: string;
}

/**
 * Calculates human-friendly membership duration based strictly on real account creation date.
 */
const getMemberTenure = (createdAtStr: string): string => {
  if (!createdAtStr) return 'Reciente';
  const created = new Date(createdAtStr);
  const now = new Date();
  const diffMonths =
    (now.getFullYear() - created.getFullYear()) * 12 +
    (now.getMonth() - created.getMonth());

  if (diffMonths < 1) return '< 1 mes';
  if (diffMonths < 12) return `${diffMonths} ${diffMonths === 1 ? 'mes' : 'meses'}`;
  const years = Math.floor(diffMonths / 12);
  return `${years} ${years === 1 ? 'año' : 'años'}`;
};

/**
 * Public profile summary metrics component.
 * Single Responsibility: Displaying authentic, real calculated data from the platform.
 */
export const PublicProfileStats: React.FC<PublicProfileStatsProps> = ({
  listingsCount,
  createdAt,
}) => {
  const tenure = getMemberTenure(createdAt);
  const isHost = listingsCount > 0;

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Published Listings Stat */}
      <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-2xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Home size={22} />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-on-surface leading-tight">
            {listingsCount}
          </span>
          <span className="text-xs text-on-surface-variant font-medium">
            {listingsCount === 1 ? 'Alojamiento publicado' : 'Alojamientos publicados'}
          </span>
        </div>
      </div>

      {/* Membership Tenure Stat (Real calculated time) */}
      <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-2xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Calendar size={22} />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-on-surface leading-tight">
            {tenure}
          </span>
          <span className="text-xs text-on-surface-variant font-medium">
            Antigüedad en Colivi
          </span>
        </div>
      </div>

      {/* Community Role / Active Status Stat */}
      <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-2xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <UserCheck size={22} />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-on-surface leading-tight">
            {isHost ? 'Anfitrión' : 'Coliver'}
          </span>
          <span className="text-xs text-on-surface-variant font-medium">
            {isHost ? 'Con anuncios activos' : 'Miembro de la comunidad'}
          </span>
        </div>
      </div>
    </div>
  );
};
