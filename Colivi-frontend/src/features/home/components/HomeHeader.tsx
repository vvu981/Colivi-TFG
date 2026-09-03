import React from 'react';
import type { HomeDetailResponseDto } from '../types';
import {
  Shield,
  Users,
  Calendar,
  UserPlus,
  LogOut,
  Archive,
  Undo2,
  ChevronLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface HomeHeaderProps {
  home: HomeDetailResponseDto;
  onOpenInvite: () => void;
  onOpenLeave: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  home,
  onOpenInvite,
  onOpenLeave,
  onArchive,
  onUnarchive,
}) => {
  const isAdmin = home.myRole === 'ADMIN';
  const isActive = home.myStatus === 'ACTIVE';
  const isLeft = home.myStatus === 'LEFT';
  const isArchived = home.myStatus === 'ARCHIVED';

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 sm:p-8 mb-6 shadow-xs">
      {/* Botón Volver a Hogares */}
      <Link
        to="/homes"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-primary mb-4 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Volver a Mis Hogares</span>
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight truncate">
              {home.name}
            </h1>

            {isAdmin ? (
              <span className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold">
                <Shield className="w-3.5 h-3.5" />
                Administrador
              </span>
            ) : (
              <span className="px-3 py-1 bg-surface-container text-secondary rounded-full text-xs font-medium">
                Miembro
              </span>
            )}

            {isLeft && (
              <span className="px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full text-xs font-bold">
                Salido / Historial
              </span>
            )}

            {isArchived && (
              <span className="px-3 py-1 bg-neutral-200 text-neutral-700 rounded-full text-xs font-bold">
                Archivado
              </span>
            )}
          </div>

          <div className="flex items-center gap-5 text-xs text-secondary flex-wrap">
            <div className="flex items-center gap-1.5 text-on-surface font-medium">
              <Users className="w-4 h-4 text-primary" />
              <span>
                {home.totalActiveMembers} {home.totalActiveMembers === 1 ? 'miembro activo' : 'miembros activos'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>
                Creado el {new Date(home.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Botones de acción principales */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {isActive && (
            <>
              <button
                type="button"
                onClick={onOpenInvite}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-container transition-colors shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invitar</span>
              </button>

              <button
                type="button"
                onClick={onOpenLeave}
                title="Salir del hogar"
                className="flex items-center gap-2 px-3.5 py-2.5 bg-surface-container text-secondary hover:text-error hover:bg-error-container/30 border border-outline-variant/60 rounded-xl text-xs font-semibold transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </>
          )}

          {isLeft && (
            <button
              type="button"
              onClick={onArchive}
              className="flex items-center gap-2 px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant rounded-xl text-xs font-semibold transition-colors"
            >
              <Archive className="w-4 h-4" />
              <span>Archivar Hogar</span>
            </button>
          )}

          {isArchived && (
            <button
              type="button"
              onClick={onUnarchive}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-semibold transition-colors"
            >
              <Undo2 className="w-4 h-4" />
              <span>Desarchivar Hogar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
