import React, { useMemo } from 'react';
import type { HomeMemberResponseDto } from '../../home/types';
import { Select, type SelectOption } from '../../../components/ui/Select';
import { getUserInitial } from '../../home/utils/userDisplay';
import { Users } from 'lucide-react';

export interface ChoreUserFilterProps {
  members: HomeMemberResponseDto[];
  selectedUserId: string | null;
  onSelectUser: (userId: string | null) => void;
  pendingCountsByUserId?: Record<string, number>;
}

export const ChoreUserFilter: React.FC<ChoreUserFilterProps> = ({
  members,
  selectedUserId,
  onSelectUser,
  pendingCountsByUserId = {},
}) => {
  const activeMembers = members.filter((m) => m.status === 'ACTIVE');

  const totalPending = Object.values(pendingCountsByUserId).reduce(
    (acc, val) => acc + val,
    0
  );

  const options: SelectOption[] = useMemo(() => {
    const allOption: SelectOption = {
      value: 'ALL',
      label: 'Todos los miembros',
      icon: (
        <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Users className="w-3.5 h-3.5" />
        </div>
      ),
      badge: totalPending > 0 ? (
        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-surface-container-high text-secondary">
          {totalPending}
        </span>
      ) : undefined,
    };

    const memberOptions: SelectOption[] = activeMembers.map((member) => {
      const pending = pendingCountsByUserId[member.userId] ?? 0;
      return {
        value: member.userId,
        label: member.fullName,
        icon: (
          <div className="relative shrink-0">
            {member.profilePicUrl ? (
              <img
                src={member.profilePicUrl}
                alt={member.fullName}
                className="w-5 h-5 rounded-full object-cover border border-outline-variant/60"
              />
            ) : (
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center">
                {getUserInitial(member.fullName)}
              </span>
            )}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-1 ring-surface-container"
              style={{ backgroundColor: member.color || '#4F46E5' }}
            />
          </div>
        ),
        badge: pending > 0 ? (
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-surface-container-high text-secondary">
            {pending}
          </span>
        ) : undefined,
      };
    });

    return [allOption, ...memberOptions];
  }, [activeMembers, pendingCountsByUserId, totalPending]);

  return (
    <div className="w-48 sm:w-56">
      <Select
        id="chore-user-filter"
        value={selectedUserId || 'ALL'}
        onChange={(val) => onSelectUser(val === 'ALL' ? null : val)}
        options={options}
        placeholder="Filtrar miembro"
        aria-label="Filtrar por miembro"
        className="!py-1.5 !text-xs !bg-surface"
      />
    </div>
  );
};
