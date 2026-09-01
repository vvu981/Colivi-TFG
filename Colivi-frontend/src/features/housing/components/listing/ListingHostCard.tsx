import React from 'react';
import { Link } from 'react-router-dom';
import { Award, ExternalLink } from 'lucide-react';

export interface ListingHostCardProps {
  hostId?: string | undefined;
  hostNickname: string;
  hostProfilePicUrl?: string | undefined;
  createdAt: string;
}

/**
 * Host presentation card.
 * Single Responsibility: Displaying host credentials and identity trust markers.
 */
export const ListingHostCard: React.FC<ListingHostCardProps> = ({
  hostId,
  hostNickname,
  hostProfilePicUrl,
  createdAt,
}) => {
  const initial = hostNickname ? hostNickname.charAt(0).toUpperCase() : 'A';
  const formattedDate = new Date(createdAt).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <section className="py-6 border-b border-outline-variant">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-2xs">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Avatar with Photo or Initials */}
          {hostProfilePicUrl ? (
            <img
              src={hostProfilePicUrl}
              alt={hostNickname || 'Foto de perfil del anfitrión'}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-full object-cover shadow-sm border border-outline-variant flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-primary text-on-primary font-bold text-xl flex items-center justify-center flex-shrink-0 shadow-sm select-none">
              {initial}
            </div>
          )}

          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-on-surface truncate">
                Publicado por {hostNickname || 'Anfitrión'}
              </h3>
            </div>

            <p className="text-xs text-on-surface-variant mt-0.5">
              Anfitrión en Colivi desde {formattedDate}
            </p>

            <div className="flex items-center gap-3 mt-2.5 text-xs text-on-surface-variant flex-wrap">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-surface-container text-on-surface-variant font-medium">
                <Award size={13} className="text-primary" />
                <span>Anfitrión Colivi</span>
              </div>
            </div>
          </div>
        </div>

        {/* View Public Profile Link Button */}
        {hostId && (
          <Link
            to={`/users/${hostId}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container border border-outline-variant text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors shrink-0"
          >
            <span>Ver perfil</span>
            <ExternalLink size={13} className="text-primary" />
          </Link>
        )}
      </div>
    </section>
  );
};
