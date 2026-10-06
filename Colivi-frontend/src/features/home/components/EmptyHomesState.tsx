import React from 'react';
import type { HomeMemberStatus } from '../types';
import { Home, Plus, KeyRound, Archive, History } from 'lucide-react';

interface EmptyHomesStateProps {
  status: HomeMemberStatus;
  onCreateHome: () => void;
  onJoinHome: () => void;
}

export const EmptyHomesState: React.FC<EmptyHomesStateProps> = ({
  status,
  onCreateHome,
  onJoinHome,
}) => {
  if (status === 'LEFT') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-surface rounded-2xl border border-outline-variant/40">
        <div className="w-16 h-16 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mb-4">
          <History className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-on-surface mb-1">
          Sin historial de hogares abandonados
        </h3>
        <p className="text-sm text-secondary max-w-md">
          Cuando salgas de un hogar, aparecerá aquí como lectura para que puedas consultar su historial y auditar registros pasados.
        </p>
      </div>
    );
  }

  if (status === 'ARCHIVED') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-surface rounded-2xl border border-outline-variant/40">
        <div className="w-16 h-16 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mb-4">
          <Archive className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-on-surface mb-1">
          No tienes hogares archivados
        </h3>
        <p className="text-sm text-secondary max-w-md">
          Los hogares pasados que decidas archivar se guardarán aquí para no saturar tu historial principal.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-surface rounded-2xl border border-outline-variant/40">
      <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
        <Home className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-on-surface mb-2">
        Aún no perteneces a ningún hogar
      </h3>
      <p className="text-sm text-secondary max-w-md mb-6">
        Organiza la convivencia con tus compañeros de piso. Crea un nuevo hogar o únete a uno existente usando un código de invitación.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onCreateHome}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-container transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Crear un Hogar
        </button>
        <button
          type="button"
          onClick={onJoinHome}
          className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-high text-on-surface text-sm font-semibold rounded-xl hover:bg-surface-container transition-colors border border-outline-variant"
        >
          <KeyRound className="w-4 h-4 text-primary" />
          Unirme con código
        </button>
      </div>
    </div>
  );
};
