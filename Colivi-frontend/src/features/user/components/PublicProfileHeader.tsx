import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Flag, Edit3, UserCheck, Home } from 'lucide-react';
import type { PublicUserProfile } from '../types/user.types';

export interface PublicProfileHeaderProps {
  user: PublicUserProfile;
  isSelf: boolean;
  isHost?: boolean;
  onReportClick: () => void;
}

/**
 * Public profile presentation header.
 * Single Responsibility: Identity presentation and primary user-level actions.
 * Only presents authentic, real data from the platform.
 */
export const PublicProfileHeader: React.FC<PublicProfileHeaderProps> = ({
  user,
  isSelf,
  isHost = false,
  onReportClick,
}) => {
  const { firstName, lastName1, lastName2, nickname, profilePicUrl, createdAt } = user;

  const fullName = [firstName, lastName1, lastName2].filter(Boolean).join(' ');
  const initial = (firstName || nickname || 'U').charAt(0).toUpperCase();

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString('es-ES', {
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="w-full bg-surface-container-lowest rounded-3xl border border-outline-variant/60 p-6 md:p-8 shadow-xs">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
        {/* Avatar with image or initials */}
        <div className="relative shrink-0">
          {profilePicUrl ? (
            <img
              src={profilePicUrl}
              alt={fullName || nickname}
              className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover shadow-md border-4 border-surface"
            />
          ) : (
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-primary text-on-primary font-bold text-4xl flex items-center justify-center shadow-md border-4 border-surface select-none">
              {initial}
            </div>
          )}
        </div>

        {/* User Info & Identity */}
        <div className="flex flex-col items-center md:items-start flex-1 min-w-0 text-center md:text-left gap-2.5">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 flex-wrap justify-center md:justify-start">
            <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
              {fullName || nickname}
            </h1>
            {nickname && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-surface-container-high text-on-surface-variant">
                @{nickname}
              </span>
            )}
          </div>

          {/* Member since metadata (Real date) */}
          {formattedDate && (
            <div className="flex items-center gap-1.5 text-body-sm text-on-surface-variant">
              <Calendar size={15} className="text-primary shrink-0" />
              <span>Miembro de Colivi desde <strong className="font-semibold text-on-surface">{formattedDate}</strong></span>
            </div>
          )}

          {/* Real Community Status Badges */}
          <div className="flex items-center gap-2.5 flex-wrap justify-center md:justify-start mt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 text-primary text-xs font-semibold">
              {isHost ? <Home size={14} /> : <UserCheck size={14} />}
              {isHost ? 'Anfitrión Colivi' : 'Coliver'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface-container text-on-surface-variant text-xs font-medium">
              <UserCheck size={14} className="text-primary" />
              Cuenta activa
            </span>
          </div>
        </div>

        {/* Action Button: Edit Profile (if self) or Report (if other) */}
        <div className="shrink-0 flex items-center justify-center w-full md:w-auto pt-2 md:pt-0">
          {isSelf ? (
            <Link
              to="/profile"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-on-primary font-bold text-label-md hover:bg-on-primary-fixed-variant transition-colors shadow-xs w-full md:w-auto"
            >
              <Edit3 size={16} />
              <span>Editar mi perfil</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={onReportClick}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-outline-variant text-on-surface-variant hover:text-error hover:border-error/30 hover:bg-error/5 text-xs font-semibold transition-colors cursor-pointer w-full md:w-auto"
              title="Denunciar usuario"
            >
              <Flag size={14} />
              <span>Denunciar usuario</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
