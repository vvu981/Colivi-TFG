import React, { useState } from 'react';
import type { HomeResponseDto } from '../types';
import { Users, Shield, Copy, Check, UserPlus, LogOut, Archive, Undo2, ArrowRight } from 'lucide-react';

interface HomeCardProps {
  home: HomeResponseDto;
  onOpenDetail: (id: string) => void;
  onInvite?: (home: HomeResponseDto) => void;
  onLeave?: (home: HomeResponseDto) => void;
  onArchive?: (home: HomeResponseDto) => void;
  onUnarchive?: (home: HomeResponseDto) => void;
}

export const HomeCard: React.FC<HomeCardProps> = ({
  home,
  onOpenDetail,
  onInvite,
  onLeave,
  onArchive,
  onUnarchive,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(home.invitationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAdmin = home.myRole === 'ADMIN';
  const isActive = home.myStatus === 'ACTIVE';
  const isLeft = home.myStatus === 'LEFT';
  const isArchived = home.myStatus === 'ARCHIVED';

  return (
    <div
      onClick={() => onOpenDetail(home.id)}
      className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-5 hover:border-primary/40 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition-all duration-200 cursor-pointer flex flex-col justify-between group relative"
    >
      <div>
        {/* Header de la tarjeta */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-on-surface truncate group-hover:text-primary transition-colors">
              {home.name}
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              Creado el {new Date(home.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>

          {/* Badge de Rol */}
          {isAdmin ? (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold shrink-0">
              <Shield className="w-3 h-3" />
              Admin
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-surface-container text-secondary rounded-full text-xs font-medium shrink-0">
              Miembro
            </span>
          )}
        </div>

        {/* Métricas y Datos rápidos */}
        <div className="flex items-center gap-4 py-3 my-2 border-y border-outline-variant/30 text-xs text-secondary">
          <div className="flex items-center gap-1.5 font-medium text-on-surface">
            <Users className="w-4 h-4 text-primary" />
            <span>
              {home.totalActiveMembers} {home.totalActiveMembers === 1 ? 'miembro' : 'miembros'}
            </span>
          </div>

          {isActive && (
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-secondary">Código:</span>
              <button
                type="button"
                onClick={handleCopyCode}
                title="Copiar código de invitación"
                className="flex items-center gap-1 font-mono font-bold bg-surface-container px-2 py-0.5 rounded text-on-surface hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <span>{home.invitationCode}</span>
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Acciones del pie */}
      <div className="flex items-center justify-between gap-2 mt-4 pt-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(home.id);
          }}
          className="flex items-center gap-1.5 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform"
        >
          <span>{isActive ? 'Entrar al Hogar' : 'Ver Historial'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {isActive && onInvite && (
            <button
              type="button"
              onClick={() => onInvite(home)}
              title="Invitar miembros"
              className="p-1.5 text-secondary hover:text-primary hover:bg-surface-container rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          )}

          {isActive && onLeave && (
            <button
              type="button"
              onClick={() => onLeave(home)}
              title="Salir del hogar"
              className="p-1.5 text-secondary hover:text-error hover:bg-error-container/30 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          {isLeft && onArchive && (
            <button
              type="button"
              onClick={() => onArchive(home)}
              title="Archivar hogar"
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-secondary hover:text-on-surface bg-surface-container hover:bg-surface-container-high rounded-lg transition-colors font-medium"
            >
              <Archive className="w-3.5 h-3.5" />
              Archivar
            </button>
          )}

          {isArchived && onUnarchive && (
            <button
              type="button"
              onClick={() => onUnarchive(home)}
              title="Desarchivar hogar"
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-primary hover:text-primary/80 bg-primary/10 rounded-lg transition-colors font-medium"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Desarchivar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
