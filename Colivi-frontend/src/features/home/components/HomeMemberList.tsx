import React, { useState, useRef, useEffect } from 'react';
import type { HomeMemberResponseDto } from '../types';
import { Shield, MoreVertical, ShieldAlert, UserMinus, UserCheck, Calendar, Clock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HomeMemberListProps {
  members: HomeMemberResponseDto[];
  isAdmin: boolean;
  currentUserId?: string;
  onTransferAdmin?: (member: HomeMemberResponseDto) => void;
  onExpelMember?: (member: HomeMemberResponseDto) => void;
}

export const HomeMemberList: React.FC<HomeMemberListProps> = ({
  members,
  isAdmin,
  currentUserId,
  onTransferAdmin,
  onExpelMember,
}) => {
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuUserId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeMembers = members.filter((m) => m.status === 'ACTIVE');
  const pastMembers = members.filter((m) => m.status === 'LEFT' || m.status === 'ARCHIVED');

  const renderMemberItem = (member: HomeMemberResponseDto) => {
    const isCurrentUser = member.userId === currentUserId;
    const isMemberAdmin = member.role === 'ADMIN';
    const isActive = member.status === 'ACTIVE';

    return (
      <div
        key={member.userId}
        className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant/60 rounded-2xl hover:border-outline-variant transition-all"
      >
        <div className="flex items-center gap-3 min-w-0">
          {member.profilePicUrl ? (
            <img
              src={member.profilePicUrl}
              alt={member.fullName}
              className="w-10 h-10 rounded-full object-cover border border-outline-variant/60 shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
                const sibling = (e.currentTarget as HTMLElement).nextElementSibling as HTMLElement;
                if (sibling) sibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className={`w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0 ${
              member.profilePicUrl ? 'hidden' : ''
            }`}
          >
            {member.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-on-surface truncate">
                {member.fullName}
              </span>
              {isCurrentUser && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-secondary/10 text-secondary rounded">
                  Tú
                </span>
              )}
              {isMemberAdmin ? (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full">
                  <Shield className="w-2.5 h-2.5" />
                  Admin
                </span>
              ) : (
                <span className="text-[10px] font-medium px-2 py-0.5 bg-surface-container text-secondary rounded-full">
                  Miembro
                </span>
              )}
              {!isActive && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full">
                  {member.status === 'ARCHIVED' ? 'Archivado' : 'Salió'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-secondary mt-0.5">
              <span>{member.email}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Unido el {new Date(member.joinedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              {member.leftAt && (
                <span className="hidden sm:flex items-center gap-1 text-neutral-500">
                  <Clock className="w-3 h-3" />
                  Salió el {new Date(member.leftAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Menú de Acciones */}
        <div className="relative shrink-0 flex items-center gap-1">
          <Link
            to={`/users/${member.userId}`}
            title="Ver perfil público"
            className="p-2 text-secondary hover:text-primary hover:bg-surface-container rounded-xl transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>

          {isAdmin && isActive && !isCurrentUser && (
            <div ref={activeMenuUserId === member.userId ? menuRef : null}>
              <button
                type="button"
                onClick={() =>
                  setActiveMenuUserId((prev) =>
                    prev === member.userId ? null : member.userId
                  )
                }
                className="p-2 text-secondary hover:text-on-surface hover:bg-surface-container rounded-xl transition-colors"
                aria-label={`Acciones para ${member.fullName}`}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {activeMenuUserId === member.userId && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg overflow-hidden z-20 py-1 animate-in fade-in duration-150">
                  {!isMemberAdmin && onTransferAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMenuUserId(null);
                        onTransferAdmin(member);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-on-surface hover:bg-surface-container font-medium text-left transition-colors"
                    >
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      <span>Transferir Admin</span>
                    </button>
                  )}

                  {onExpelMember && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMenuUserId(null);
                        onExpelMember(member);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-error hover:bg-error-container/30 font-medium text-left transition-colors"
                    >
                      <UserMinus className="w-4 h-4 text-error" />
                      <span>Expulsar Miembro</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sección de Miembros Activos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-on-surface">
              Miembros Activos ({activeMembers.length})
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {activeMembers.map(renderMemberItem)}
        </div>
      </div>

      {/* Sección de Miembros Históricos (si hay) */}
      {pastMembers.length > 0 && (
        <div className="pt-4 border-t border-outline-variant/40">
          <h3 className="text-sm font-bold text-secondary mb-3">
            Antiguos Miembros ({pastMembers.length})
          </h3>
          <div className="grid grid-cols-1 gap-2.5 opacity-80">
            {pastMembers.map(renderMemberItem)}
          </div>
        </div>
      )}
    </div>
  );
};
