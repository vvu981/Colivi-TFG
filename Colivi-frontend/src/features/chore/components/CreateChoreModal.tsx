import React, { useState, useMemo, useEffect } from 'react';
import { isAxiosError } from 'axios';
import type { HomeMemberResponseDto } from '../../home/types';
import type { CreateChoreRequest, RecurrenceType, RotationType } from '../types';
import { Select, type SelectOption } from '../../../components/ui/Select';
import { DatePicker } from '../../../components/ui/DatePicker';
import { getUserInitial } from '../../home/utils/userDisplay';
import { X, Sparkles, Calendar, User as UserIcon, Repeat, RotateCcw, Users } from 'lucide-react';

interface CreateChoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: HomeMemberResponseDto[];
  onSubmit: (data: CreateChoreRequest) => Promise<void>;
  isSubmitting?: boolean;
}

export const CreateChoreModal: React.FC<CreateChoreModalProps> = ({
  isOpen,
  onClose,
  members,
  onSubmit,
  isSubmitting,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const activeMembers = useMemo(() => {
    return members.filter((m) => (m.status ? m.status === 'ACTIVE' : true));
  }, [members]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState(activeMembers[0]?.userId || '');
  const [basePoints, setBasePoints] = useState(10);
  const [dueDate, setDueDate] = useState(tomorrowStr);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('NONE');
  const [occurrences, setOccurrences] = useState(7);
  const [customDays, setCustomDays] = useState<number[]>([1, 2, 4]); // Lunes, Martes, Jueves
  const [assignmentMode, setAssignmentMode] = useState<RotationType>('FIXED');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(() =>
    activeMembers.map((m) => m.userId)
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setAssigneeId(activeMembers[0]?.userId || '');
      setBasePoints(10);
      setDueDate(tomorrowStr);
      setRecurrence('NONE');
      setOccurrences(7);
      setCustomDays([1, 2, 4]);
      setAssignmentMode('FIXED');
      setSelectedParticipants(activeMembers.map((m) => m.userId));
      setErrorMessage(null);
    }
  }, [isOpen, activeMembers, tomorrowStr]);

  const DAYS_OF_WEEK = [
    { value: 1, label: 'Lunes', short: 'L' },
    { value: 2, label: 'Martes', short: 'M' },
    { value: 3, label: 'Miércoles', short: 'X' },
    { value: 4, label: 'Jueves', short: 'J' },
    { value: 5, label: 'Viernes', short: 'V' },
    { value: 6, label: 'Sábado', short: 'S' },
    { value: 7, label: 'Domingo', short: 'D' },
  ];

  const assigneeOptions: SelectOption[] = useMemo(() => {
    return activeMembers.map((member) => ({
      value: member.userId,
      label: member.fullName,
      icon: member.profilePicUrl ? (
        <img
          src={member.profilePicUrl}
          alt={member.fullName}
          className="w-5 h-5 rounded-full object-cover shrink-0 border border-outline-variant/60"
        />
      ) : (
        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
          {getUserInitial(member.fullName)}
        </span>
      ),
    }));
  }, [activeMembers]);

  const recurrenceOptions: SelectOption[] = useMemo(
    () => [
      { value: 'NONE', label: 'No repetir (única)' },
      { value: 'DAILY', label: 'Diariamente' },
      { value: 'WEEKLY', label: 'Semanalmente' },
      { value: 'MONTHLY', label: 'Mensualmente' },
      { value: 'CUSTOM', label: 'Días específicos de la semana' },
    ],
    []
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (activeMembers.length === 0) {
      setErrorMessage('No hay miembros activos disponibles en este hogar para asignar tareas.');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('El título de la tarea es obligatorio.');
      return;
    }

    const isRotating = recurrence !== 'NONE' && assignmentMode === 'ROUND_ROBIN';

    if (isRotating) {
      if (selectedParticipants.length === 0) {
        setErrorMessage('Debes seleccionar al menos un compañero para la rueda rotativa.');
        return;
      }
    } else {
      if (!assigneeId) {
        setErrorMessage('Debes seleccionar un miembro responsable.');
        return;
      }
    }

    if (recurrence === 'CUSTOM' && customDays.length === 0) {
      setErrorMessage('Debes seleccionar al menos un día de la semana para la repetición personalizada.');
      return;
    }

    try {
      const effectiveAssigneeId = isRotating ? selectedParticipants[0] : assigneeId;

      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        assigneeId: effectiveAssigneeId,
        basePoints,
        dueDate,
        recurrence,
        occurrences: recurrence !== 'NONE' ? occurrences : 1,
        customDaysOfWeek: recurrence === 'CUSTOM' ? customDays : undefined,
        rotationType: isRotating ? 'ROUND_ROBIN' : 'FIXED',
        rotationUserIds: isRotating ? selectedParticipants : (effectiveAssigneeId ? [effectiveAssigneeId] : []),
      });

      // Reset form
      setTitle('');
      setDescription('');
      setBasePoints(10);
      setRecurrence('NONE');
      setAssignmentMode('FIXED');
      setSelectedParticipants(activeMembers.map((m) => m.userId));
      setCustomDays([1, 2, 4]);
      onClose();
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? (err.response?.data?.message || err.message || 'Error al crear la tarea')
        : err instanceof Error
          ? err.message
          : 'Error al crear la tarea';
      setErrorMessage(msg);
    }
  };

  const pointOptions = [5, 10, 15, 20, 30];

  const isRotating = recurrence !== 'NONE' && assignmentMode === 'ROUND_ROBIN';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in">
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl max-w-lg w-full p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">Nueva Tarea Doméstica</h3>
              <p className="text-xs text-secondary">
                Organiza las responsabilidades y asigna puntos gamificados
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-secondary hover:text-on-surface rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-error-container/40 border border-error/50 rounded-2xl text-xs text-error font-medium">
            {errorMessage}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface">
              Título de la tarea <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={150}
              placeholder="Ej: Fregar platos, Limpiar baño..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-xs text-on-surface focus:outline-hidden focus:border-primary transition-all"
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface">
              Descripción o notas (opcional)
            </label>
            <textarea
              rows={2}
              maxLength={1000}
              placeholder="Detalles sobre cómo realizar la tarea o recordatorios..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/60 rounded-xl text-xs text-on-surface focus:outline-hidden focus:border-primary transition-all resize-none"
            />
          </div>

          {/* Miembro asignado y Fecha Límite */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {isRotating ? (
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface flex items-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5 text-primary" />
                  <span>Primer turno para</span>
                </label>
                <div className="px-3 py-2 bg-surface-container-low border border-outline-variant/60 rounded-xl text-xs text-on-surface flex items-center gap-2 min-h-[38px]">
                  {selectedParticipants.length > 0 ? (
                    (() => {
                      const firstMember = activeMembers.find((m) => m.userId === selectedParticipants[0]);
                      if (!firstMember) return <span className="text-secondary text-[11px]">Sin participante</span>;
                      return (
                        <>
                          {firstMember.profilePicUrl ? (
                            <img
                              src={firstMember.profilePicUrl}
                              alt={firstMember.fullName}
                              className="w-5 h-5 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                              {getUserInitial(firstMember.fullName)}
                            </span>
                          )}
                          <span className="font-semibold truncate">{firstMember.fullName}</span>
                          <span className="ml-auto text-[10px] bg-primary/15 text-primary font-bold px-1.5 py-0.5 rounded">
                            Turno 1
                          </span>
                        </>
                      );
                    })()
                  ) : (
                    <span className="text-error font-medium text-[11px]">Selecciona participantes abajo</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <label htmlFor="assignee-select" className="text-xs font-bold text-on-surface flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5 text-secondary" />
                  <span>Asignar a <span className="text-primary">*</span></span>
                </label>
                <Select
                  id="assignee-select"
                  value={assigneeId}
                  onChange={setAssigneeId}
                  options={assigneeOptions}
                  placeholder="Selecciona miembro"
                  aria-label="Asignar a"
                  className="!py-2 !text-xs !bg-surface-container-low"
                />
              </div>
            )}

            {/* Fecha Límite con componente reutilizado DatePicker */}
            <div className="space-y-1">
              <label htmlFor="chore-due-date" className="text-xs font-bold text-on-surface flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-secondary" />
                <span>
                  {recurrence === 'NONE' ? 'Fecha límite' : 'Fecha de inicio / 1º turno'}{' '}
                  <span className="text-primary">*</span>
                </span>
              </label>
              <DatePicker
                id="chore-due-date"
                value={dueDate}
                onChange={setDueDate}
                min={todayStr}
                className="!py-2 !text-xs !bg-surface-container-low"
              />
            </div>
          </div>

          {/* Puntos de Recompensa (manual + presets) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="base-points-input" className="text-xs font-bold text-on-surface">
                Puntos de recompensa por completar <span className="text-primary">*</span>
              </label>
              <span className="text-xs font-bold text-primary">+{basePoints} pts</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-24">
                <input
                  id="base-points-input"
                  type="number"
                  min={1}
                  max={1000}
                  required
                  value={basePoints}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    setBasePoints(isNaN(parsed) ? 1 : Math.max(1, Math.min(1000, parsed)));
                  }}
                  className="w-full px-3 py-1.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-xs font-bold text-on-surface focus:outline-hidden focus:border-primary transition-all text-center"
                  aria-label="Puntos de recompensa"
                />
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {pointOptions.map((pts) => (
                  <button
                    key={pts}
                    type="button"
                    onClick={() => setBasePoints(pts)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      basePoints === pts
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-container text-secondary hover:text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    +{pts} pts
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-secondary">
              Introduce cualquier cantidad de puntos o pulsa un atajo predefinido.
            </p>
          </div>

          {/* Recurrencia */}
          <div className="p-3.5 bg-surface-container-low rounded-2xl border border-outline-variant/40 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="recurrence-select" className="text-xs font-bold text-on-surface flex items-center gap-1.5 shrink-0">
                <Repeat className="w-3.5 h-3.5 text-primary" />
                <span>Repetir tarea automáticamente</span>
              </label>
              <div className="w-56">
                <Select
                  id="recurrence-select"
                  value={recurrence}
                  onChange={(val) => setRecurrence(val as RecurrenceType)}
                  options={recurrenceOptions}
                  aria-label="Repetir tarea automáticamente"
                  direction="up"
                  className="!py-1.5 !text-xs !bg-surface-container-lowest"
                />
              </div>
            </div>

            {recurrence !== 'NONE' && (
              <>
                {/* Modo de Asignación de la Serie */}
                <div className="pt-2 border-t border-outline-variant/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-primary" />
                      <span>Modo de asignación</span>
                    </span>
                    <span className="text-[11px] text-secondary">
                      {assignmentMode === 'ROUND_ROBIN' ? 'Rueda rotativa por turnos' : 'Mismo responsable siempre'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAssignmentMode('FIXED')}
                      className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                        assignmentMode === 'FIXED'
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-surface-container-lowest text-secondary border-outline-variant/60 hover:text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>Responsable fijo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAssignmentMode('ROUND_ROBIN');
                        if (selectedParticipants.length === 0) {
                          setSelectedParticipants(activeMembers.map((m) => m.userId));
                        }
                      }}
                      className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                        assignmentMode === 'ROUND_ROBIN'
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-surface-container-lowest text-secondary border-outline-variant/60 hover:text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Rueda rotativa</span>
                    </button>
                  </div>
                </div>

                {/* Participantes de la Rueda Rotativa (Regla A.2: Selección Explícita) */}
                {assignmentMode === 'ROUND_ROBIN' && (
                  <div className="pt-2 border-t border-outline-variant/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-primary" />
                          <span>Participantes en la rueda</span>
                          <span className="text-primary font-bold text-xs">
                            ({selectedParticipants.length}/{activeMembers.length})
                          </span>
                        </span>
                        <p className="text-[11px] text-secondary">
                          Marca los miembros que participan en la rotación (orden determinista)
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedParticipants(activeMembers.map((m) => m.userId))}
                          className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                        >
                          Todos
                        </button>
                        <span className="text-outline-variant text-[10px]">|</span>
                        <button
                          type="button"
                          onClick={() => setSelectedParticipants([])}
                          className="text-[11px] font-semibold text-secondary hover:text-on-surface cursor-pointer"
                        >
                          Ninguno
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {activeMembers.map((member) => {
                        const isSelected = selectedParticipants.includes(member.userId);
                        const orderIndex = selectedParticipants.indexOf(member.userId);

                        const toggleParticipant = () => {
                          setSelectedParticipants((prev) =>
                            isSelected
                              ? prev.filter((id) => id !== member.userId)
                              : [...prev, member.userId]
                          );
                        };

                        return (
                          <label
                            key={member.userId}
                            htmlFor={`participant-${member.userId}`}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer select-none ${
                              isSelected
                                ? 'bg-primary/10 border-primary/40 text-on-surface shadow-xs'
                                : 'bg-surface-container-lowest border-outline-variant/50 text-secondary hover:bg-surface-container-high/40'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                id={`participant-${member.userId}`}
                                checked={isSelected}
                                onChange={toggleParticipant}
                                className="rounded border-outline-variant text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                                aria-label={`Seleccionar a ${member.fullName}`}
                              />
                              {member.profilePicUrl ? (
                                <img
                                  src={member.profilePicUrl}
                                  alt={member.fullName}
                                  className="w-5 h-5 rounded-full object-cover shrink-0 border border-outline-variant/60"
                                />
                              ) : (
                                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {getUserInitial(member.fullName)}
                                </span>
                              )}
                              <span className="text-xs font-medium truncate">{member.fullName}</span>
                            </div>

                            {isSelected && (
                              <span className="px-1.5 py-0.5 rounded-md bg-primary text-white text-[10px] font-bold shrink-0">
                                {orderIndex === 0 ? '1º Turno' : `${orderIndex + 1}º`}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {recurrence === 'CUSTOM' && (
              <div className="pt-2 border-t border-outline-variant/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface">
                    Días de la semana <span className="text-primary">*</span>
                  </span>
                  <span className="text-[11px] text-secondary font-medium">
                    {customDays.length === 0
                      ? 'Selecciona al menos 1 día'
                      : customDays
                          .map((d) => DAYS_OF_WEEK.find((day) => day.value === d)?.label)
                          .join(', ')}
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = customDays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => {
                          setCustomDays((prev) =>
                            isSelected
                              ? prev.filter((d) => d !== day.value)
                              : [...prev, day.value].sort((a, b) => a - b)
                          );
                        }}
                        className={`h-8 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                          isSelected
                            ? 'bg-primary text-white shadow-xs'
                            : 'bg-surface-container text-secondary hover:text-on-surface hover:bg-surface-container-high'
                        }`}
                        title={day.label}
                        aria-pressed={isSelected}
                        aria-label={day.label}
                      >
                        {day.short}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {recurrence !== 'NONE' && (
              <div className="pt-2 border-t border-outline-variant/30 flex items-center justify-between gap-3">
                <span className="text-xs text-secondary">
                  Número de repeticiones:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={2}
                    max={60}
                    value={occurrences}
                    onChange={(e) => setOccurrences(Math.max(2, Math.min(60, Number(e.target.value))))}
                    className="w-16 px-2 py-1 bg-surface-container-lowest border border-outline-variant/60 rounded-lg text-xs text-center font-bold text-on-surface"
                  />
                  <span className="text-xs text-secondary font-medium">veces</span>
                </div>
              </div>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-secondary hover:text-on-surface transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary-container disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'Creando...' : 'Crear Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
