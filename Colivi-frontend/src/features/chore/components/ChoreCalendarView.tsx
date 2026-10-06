import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ChoreResponseDto } from '../types';
import { getChorePillStyles } from '../utils/userColor';
import { ChevronLeft, ChevronRight, CheckCircle2, LifeBuoy, AlertTriangle } from 'lucide-react';

interface ChoreCalendarViewProps {
  chores: ChoreResponseDto[];
  selectedUserId: string | null;
  onComplete: (chore: ChoreResponseDto) => void;
  onDelete: (chore: ChoreResponseDto) => void;
  currentUserId?: string;
}

export const ChoreCalendarView: React.FC<ChoreCalendarViewProps> = ({
  chores,
  selectedUserId,
  onComplete,
  onDelete,
  currentUserId,
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayChores, setSelectedDayChores] = useState<{
    dateStr: string;
    chores: ChoreResponseDto[];
  } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Calcular días de la cuadrícula
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // En España la semana empieza en Lunes (0 = Domingo en JS)
  const startingDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
  const totalDays = lastDayOfMonth.getDate();

  // Filtrar tareas por miembro seleccionado si aplica
  const visibleChores = selectedUserId
    ? chores.filter((chore) => chore.assigneeId === selectedUserId)
    : chores;

  // Mapear tareas por fecha YYYY-MM-DD
  const choresByDate: Record<string, ChoreResponseDto[]> = {};
  for (const chore of visibleChores) {
    if (!choresByDate[chore.dueDate]) {
      choresByDate[chore.dueDate] = [];
    }
    choresByDate[chore.dueDate].push(chore);
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  return (
    <div className="space-y-4">
      {/* Controles de Navegación del Calendario */}
      <div className="flex items-center justify-between gap-3 border-b border-outline-variant/40 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-on-surface capitalize">
            {monthNames[month]} {year}
          </h3>
          <button
            type="button"
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-surface-container text-secondary hover:text-on-surface transition-colors"
          >
            Hoy
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-secondary transition-colors"
            title="Mes anterior"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-secondary transition-colors"
            title="Mes siguiente"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-secondary py-1">
        <span>Lun</span>
        <span>Mar</span>
        <span>Mié</span>
        <span>Jue</span>
        <span>Vie</span>
        <span>Sáb</span>
        <span>Dom</span>
      </div>

      {/* Cuadrícula de Días */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {/* Huecos vacíos del inicio */}
        {Array.from({ length: startingDayIndex }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="min-h-[85px] sm:min-h-[105px] p-1.5 rounded-2xl bg-surface-container-low/30 border border-transparent opacity-40"
          />
        ))}

        {/* Días del mes */}
        {Array.from({ length: totalDays }).map((_, dayIndex) => {
          const day = dayIndex + 1;
          const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = dayStr === todayStr;
          const dayChores = choresByDate[dayStr] || [];

          return (
            <div
              key={dayStr}
              onClick={() => {
                if (dayChores.length > 0) {
                  setSelectedDayChores({ dateStr: dayStr, chores: dayChores });
                }
              }}
              className={`min-h-[85px] sm:min-h-[105px] p-1.5 rounded-2xl border transition-all flex flex-col justify-between ${
                isToday
                  ? 'bg-primary/5 border-primary shadow-xs'
                  : 'bg-surface-container-lowest border-outline-variant/40 hover:border-outline-variant hover:bg-surface-container-low/30'
              } ${dayChores.length > 0 ? 'cursor-pointer' : ''}`}
            >
              {/* Número del día */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                    isToday
                      ? 'bg-primary text-on-primary'
                      : 'text-on-surface'
                  }`}
                >
                  {day}
                </span>

                {dayChores.length > 0 && (
                  <span className="text-[10px] font-bold text-secondary">
                    {dayChores.length} {dayChores.length === 1 ? 'tarea' : 'tareas'}
                  </span>
                )}
              </div>

              {/* Lista de mini-pills de tareas */}
              <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                {dayChores.slice(0, 3).map((chore) => {
                  const isFilteredAssignee =
                    selectedUserId === null || chore.assigneeId === selectedUserId;
                  const isLate = chore.isLate;
                  const choreColor = chore.assigneeColor || '#4F46E5';

                  return (
                    <div
                      key={chore.id}
                      className={`text-[10px] px-1.5 py-0.5 rounded-md truncate font-medium flex items-center justify-between gap-1 border transition-opacity ${
                        isFilteredAssignee ? 'opacity-100' : 'opacity-30'
                      } ${
                        chore.status === 'COMPLETED'
                          ? 'line-through opacity-60'
                          : chore.status === 'LATE_COMPLETED'
                            ? 'opacity-75'
                            : isLate
                              ? 'font-bold ring-1 ring-error animate-pulse'
                              : ''
                      }`}
                      style={getChorePillStyles(choreColor)}
                    >
                      <span className="truncate flex items-center gap-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: choreColor }}
                        />
                        {chore.title}
                      </span>
                      <span className="shrink-0 font-bold text-[9px]">
                        +{chore.basePoints}
                      </span>
                    </div>
                  );
                })}

                {dayChores.length > 3 && (
                  <div className="text-[9px] text-secondary text-center font-medium">
                    +{dayChores.length - 3} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal / Diálogo de detalle de tareas del día seleccionado */}
      {selectedDayChores && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in">
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
              <div>
                <h4 className="text-sm font-bold text-on-surface">
                  Tareas del {selectedDayChores.dateStr}
                </h4>
                <p className="text-xs text-secondary">
                  {selectedDayChores.chores.length} tareas programadas
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayChores(null)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-secondary transition-colors"
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {selectedDayChores.chores.map((chore) => {
                const isAssignee = currentUserId === chore.assigneeId;
                const canRescue = chore.canRescue;
                const canComplete = chore.canComplete;
                const choreColor = chore.assigneeColor || '#4F46E5';

                return (
                  <div
                    key={chore.id}
                    className="p-3.5 rounded-2xl border border-outline-variant/40 bg-surface-container-low/40 space-y-2.5"
                    style={{ borderLeftWidth: '4px', borderLeftColor: choreColor }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h5 className="text-xs font-bold text-on-surface">
                            {chore.title}
                          </h5>
                          {chore.isLate && chore.status === 'PENDING' && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-error/10 text-error text-[9px] font-bold">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              ¡Atrasada!
                            </span>
                          )}
                        </div>
                        {chore.description && (
                          <p className="text-[11px] text-secondary mt-0.5">
                            {chore.description}
                          </p>
                        )}
                      </div>

                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                        {chore.basePoints} pts
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-secondary border-t border-outline-variant/30 pt-2">
                      <Link
                        to={`/users/${chore.assigneeId}`}
                        className="flex items-center gap-1.5 hover:text-primary transition-colors group"
                        title={`Ver perfil de ${chore.assigneeName}`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 group-hover:ring-1 group-hover:ring-primary"
                          style={{ backgroundColor: choreColor }}
                        />
                        <span>Asignada a: <strong className="text-on-surface group-hover:text-primary group-hover:underline">{chore.assigneeName}</strong></span>
                      </Link>

                      {/* Acciones de Completar / Rescatar */}
                      <div className="flex items-center gap-2">
                        {canRescue ? (
                          <button
                            type="button"
                            onClick={() => {
                              onComplete(chore);
                              setSelectedDayChores(null);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-tertiary text-white rounded-xl text-xs font-bold shadow-xs hover:bg-tertiary-container transition-colors cursor-pointer"
                          >
                            <LifeBuoy className="w-3.5 h-3.5 shrink-0" />
                            <span>Rescatar (+{chore.basePoints} pts)</span>
                          </button>
                        ) : canComplete ? (
                          <button
                            type="button"
                            onClick={() => {
                              onComplete(chore);
                              setSelectedDayChores(null);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary text-white rounded-xl text-xs font-bold shadow-xs hover:bg-primary-container transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Completar</span>
                          </button>
                        ) : chore.status === 'COMPLETED' ? (
                          <span className="text-secondary text-xs font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-secondary shrink-0" />
                            <span>
                              Hecha por{' '}
                              {chore.completedById ? (
                                <Link
                                  to={`/users/${chore.completedById}`}
                                  className="text-on-surface hover:text-primary hover:underline transition-colors font-bold"
                                  title={`Ver perfil de ${chore.completedByName}`}
                                >
                                  {chore.completedByName}
                                </Link>
                              ) : (
                                <strong>{chore.completedByName}</strong>
                              )}
                            </span>
                          </span>
                        ) : chore.status === 'LATE_COMPLETED' ? (
                          <span className="text-tertiary text-xs font-semibold inline-flex items-center gap-1">
                            <LifeBuoy className="w-3.5 h-3.5 text-tertiary shrink-0" />
                            <span>
                              Rescatada por{' '}
                              {chore.completedById ? (
                                <Link
                                  to={`/users/${chore.completedById}`}
                                  className="text-on-surface hover:text-primary hover:underline transition-colors font-bold"
                                  title={`Ver perfil de ${chore.completedByName}`}
                                >
                                  {chore.completedByName}
                                </Link>
                              ) : (
                                <strong>{chore.completedByName}</strong>
                              )}
                            </span>
                          </span>
                        ) : null}

                        {chore.status === 'PENDING' && (isAssignee || currentUserId) && (
                          <button
                            type="button"
                            onClick={() => {
                              onDelete(chore);
                              setSelectedDayChores(null);
                            }}
                            className="text-xs text-error hover:underline px-1"
                          >
                            Borrar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
