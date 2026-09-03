import React from 'react';
import { useHomeActivities } from '../hooks/useHomeActivities';
import type { ActivityType } from '../types';
import {
  Sparkles,
  UserPlus,
  LogOut,
  UserMinus,
  Shield,
  Trash2,
  Receipt,
  CheckCircle2,
  ArrowRightLeft,
  Clock,
  ChevronLeft,
  ChevronRight,
  Activity,
} from 'lucide-react';

interface HomeActivityFeedProps {
  homeId: string;
}

const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case 'HOME_CREATED':
      return {
        icon: <Sparkles className="w-4 h-4 text-emerald-600" />,
        bg: 'bg-emerald-500/10 border-emerald-500/20',
      };
    case 'MEMBER_JOINED':
      return {
        icon: <UserPlus className="w-4 h-4 text-primary" />,
        bg: 'bg-primary/10 border-primary/20',
      };
    case 'MEMBER_LEFT':
      return {
        icon: <LogOut className="w-4 h-4 text-amber-600" />,
        bg: 'bg-amber-500/10 border-amber-500/20',
      };
    case 'MEMBER_EXPELLED':
      return {
        icon: <UserMinus className="w-4 h-4 text-error" />,
        bg: 'bg-error-container border-error/20',
      };
    case 'ADMIN_TRANSFERRED':
      return {
        icon: <Shield className="w-4 h-4 text-indigo-600" />,
        bg: 'bg-indigo-500/10 border-indigo-500/20',
      };
    case 'HOME_DELETED':
      return {
        icon: <Trash2 className="w-4 h-4 text-error" />,
        bg: 'bg-error-container border-error/20',
      };
    case 'EXPENSE_CREATED':
    case 'EXPENSE_DELETED':
      return {
        icon: <Receipt className="w-4 h-4 text-sky-600" />,
        bg: 'bg-sky-500/10 border-sky-500/20',
      };
    case 'DEBT_SETTLED':
      return {
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
        bg: 'bg-emerald-500/10 border-emerald-500/20',
      };
    case 'PAYMENT_RECORDED':
      return {
        icon: <ArrowRightLeft className="w-4 h-4 text-teal-600" />,
        bg: 'bg-teal-500/10 border-teal-500/20',
      };
    default:
      return {
        icon: <Activity className="w-4 h-4 text-secondary" />,
        bg: 'bg-surface-container border-outline-variant',
      };
  }
};

export const HomeActivityFeed: React.FC<HomeActivityFeedProps> = ({ homeId }) => {
  const { activities, pageData, currentPage, isLoading, error, setPage } =
    useHomeActivities(homeId);

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="flex gap-3 items-center animate-pulse">
            <div className="w-9 h-9 rounded-full bg-surface-container shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 bg-surface-container rounded w-3/4" />
              <div className="h-3 bg-surface-container/60 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center bg-error-container/20 border border-error/20 rounded-2xl text-xs text-error">
        {error}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="p-10 text-center bg-surface border border-outline-variant/40 rounded-2xl">
        <Activity className="w-8 h-8 text-secondary/40 mx-auto mb-2" />
        <p className="text-sm font-semibold text-on-surface">No hay actividad registrada</p>
        <p className="text-xs text-secondary mt-0.5">
          Los eventos del hogar y cambios de miembros aparecerán aquí en orden cronológico.
        </p>
      </div>
    );
  }

  const totalPages = pageData?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Timeline de Actividades */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.75 before:top-3 before:bottom-3 before:w-0.5 before:bg-outline-variant/50">
        {activities.map((activity) => {
          const style = getActivityIcon(activity.activityType);
          const date = new Date(activity.createdAt);

          return (
            <div key={activity.id} className="relative flex items-start gap-3.5 group">
              {/* Icono del Timeline */}
              <div
                className={`absolute -left-6 top-0 w-6 h-6 rounded-full border flex items-center justify-center bg-surface-container-lowest shadow-2xs ${style.bg}`}
              >
                {style.icon}
              </div>

              {/* Contenido del evento */}
              <div className="flex-1 min-w-0 bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-3.5 hover:border-outline-variant transition-all">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-on-surface">
                    {activity.description}
                  </p>
                  {activity.metadata?.amount != null && (
                    <span className="shrink-0 inline-flex items-center text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">
                      {Number(activity.metadata.amount).toFixed(2)} €
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-secondary mt-1">
                  <span>Por: <strong>{activity.actorFullName}</strong></span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {date.toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-outline-variant/40">
          <button
            type="button"
            onClick={() => setPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-secondary hover:text-on-surface disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>
          <span className="text-xs text-secondary">
            Página {currentPage + 1} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-secondary hover:text-on-surface disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <span>Siguiente</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
