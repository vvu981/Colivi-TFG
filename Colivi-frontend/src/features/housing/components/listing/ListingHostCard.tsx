import React from 'react';
import { MessageSquare, Award } from 'lucide-react';

export interface ListingHostCardProps {
  hostNickname: string;
  hostProfilePicUrl?: string;
  createdAt: string;
}

/**
 * Host presentation card.
 * Single Responsibility: Displaying host credentials and identity trust markers.
 */
export const ListingHostCard: React.FC<ListingHostCardProps> = ({
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
      <div className="flex items-start gap-4 p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-2xs">
        {/* Avatar with Photo or Initials */}
        {hostProfilePicUrl ? (
          <img
            src={hostProfilePicUrl}
            alt={hostNickname || 'Foto de perfil del anfitrión'}
            className="w-14 h-14 rounded-full object-cover shadow-sm border border-outline-variant flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-primary text-on-primary font-bold text-xl flex items-center justify-center flex-shrink-0 shadow-sm">
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

          <div className="flex items-center gap-4 mt-3 text-xs text-on-surface-variant flex-wrap">
            <div className="flex items-center gap-1.5">
              <Award size={14} className="text-primary" />
              <span>Respuesta rápida</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageSquare size={14} className="text-primary" />
              <span>Soporte verificado</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
