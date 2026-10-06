import React from 'react';
import { Link } from 'react-router-dom';
import type { ChoreLeaderboardDto } from '../types';
import { Trophy, Medal, Award, Flame, ShieldAlert, Sparkles } from 'lucide-react';

interface ChoreLeaderboardProps {
  leaderboard: ChoreLeaderboardDto | undefined;
  period: 'WEEKLY' | 'MONTHLY';
  onPeriodChange: (period: 'WEEKLY' | 'MONTHLY') => void;
  isLoading?: boolean;
}

export const ChoreLeaderboard: React.FC<ChoreLeaderboardProps> = ({
  leaderboard,
  period,
  onPeriodChange,
  isLoading,
}) => {
  const scores = leaderboard?.scores ?? [];

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-4 h-4 text-primary" />;
      case 1:
        return <Medal className="w-4 h-4 text-secondary" />;
      case 2:
        return <Award className="w-4 h-4 text-tertiary" />;
      default:
        return <span className="w-4 text-center text-xs font-bold text-secondary">{index + 1}º</span>;
    }
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 shadow-xs space-y-4">
      {/* Header con Switch de Período */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/40 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 text-primary rounded-xl">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-on-surface">Tabla de Convivencia</h3>
            <p className="text-[11px] text-secondary">
              Puntos ganados y proyectados en este ciclo
            </p>
          </div>
        </div>

        {/* Switch Semanal / Mensual */}
        <div className="flex bg-surface-container rounded-xl p-1 gap-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onPeriodChange('WEEKLY')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              period === 'WEEKLY'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Semanal
          </button>
          <button
            type="button"
            onClick={() => onPeriodChange('MONTHLY')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              period === 'MONTHLY'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Mensual
          </button>
        </div>
      </div>

      {/* Lista del Leaderboard */}
      {isLoading ? (
        <div className="py-8 text-center text-xs text-secondary animate-pulse">
          Cargando puntuaciones del ciclo...
        </div>
      ) : scores.length === 0 ? (
        <div className="py-6 text-center text-xs text-secondary">
          No hay puntuaciones registradas en este período.
        </div>
      ) : (
        <div className="space-y-2.5">
          {scores.map((score, index) => {
            const hasRescues = score.rescuedCount > 0;
            const hasPenalties = score.penalizedCount > 0;
            const completionRatio =
              score.expectedPoints > 0
                ? Math.min(100, Math.max(0, Math.round((score.currentPoints / score.expectedPoints) * 100)))
                : 0;

            return (
              <div
                key={score.userId}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl border transition-all gap-3 ${
                  index === 0
                    ? 'bg-surface-container-low border-primary/30 shadow-xs'
                    : 'bg-surface-container-lowest border-outline-variant/40 hover:bg-surface-container-low/40'
                }`}
              >
                {/* Posición y Usuario */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 flex items-center justify-center shrink-0">
                    {getRankIcon(index)}
                  </div>

                  <Link
                    to={`/users/${score.userId}`}
                    className="relative shrink-0 hover:opacity-85 transition-opacity"
                    title={`Ver perfil de ${score.fullName}`}
                  >
                    {score.profilePicUrl ? (
                      <img
                        src={score.profilePicUrl}
                        alt={score.fullName}
                        className="w-9 h-9 rounded-full object-cover border border-outline-variant"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {score.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {index === 0 && (
                      <span className="absolute -top-1 -right-1 p-0.5 bg-primary text-white rounded-full">
                        <Sparkles className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </Link>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link
                        to={`/users/${score.userId}`}
                        className="text-xs font-bold text-on-surface truncate hover:text-primary hover:underline transition-colors"
                        title={`Ver perfil de ${score.fullName}`}
                      >
                        {score.fullName}
                      </Link>
                      <span className="text-[10px] text-secondary">
                        @{score.nickname}
                      </span>
                    </div>

                    {/* Badges de comportamiento gamificado */}
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {hasRescues && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-tertiary/10 text-tertiary text-[9px] font-bold">
                          <Flame className="w-2.5 h-2.5" />
                          {score.rescuedCount} {score.rescuedCount === 1 ? 'rescate' : 'rescates'}
                        </span>
                      )}
                      {hasPenalties && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-error/10 text-error text-[9px] font-bold">
                          <ShieldAlert className="w-2.5 h-2.5" />
                          {score.penalizedCount} {score.penalizedCount === 1 ? 'atraso' : 'atrasos'}
                        </span>
                      )}
                      <span className="text-[10px] text-secondary">
                        {score.completedCount} tareas hechas
                      </span>
                    </div>
                  </div>
                </div>

                {/* Métricas de Puntos (Actuales + Esperados) */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-outline-variant/30 pt-2 sm:pt-0 shrink-0">
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={`text-sm font-extrabold ${
                        score.currentPoints > 0
                          ? 'text-primary'
                          : score.currentPoints < 0
                            ? 'text-error'
                            : 'text-secondary'
                      }`}
                    >
                      {score.currentPoints > 0 ? `+${score.currentPoints}` : score.currentPoints} pts
                    </span>
                    <span className="text-[10px] text-secondary font-medium">
                      actuales
                    </span>
                  </div>

                  {/* Puntos Esperados con Barra de Progreso */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-secondary">
                      Esperados: <strong className="text-on-surface font-bold">{score.expectedPoints}</strong> pts
                    </span>
                    {score.expectedPoints > 0 && (
                      <div className="w-14 h-1.5 bg-surface-container rounded-full overflow-hidden shrink-0 hidden sm:block">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${completionRatio}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
