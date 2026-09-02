import React from 'react';
import type { HomeMemberStatus } from '../types';
import { Home, History } from 'lucide-react';

interface HomeTabsProps {
  activeTab: HomeMemberStatus;
  onChangeTab: (tab: HomeMemberStatus) => void;
  counts: Record<HomeMemberStatus, number>;
}

export const HomeTabs: React.FC<HomeTabsProps> = ({
  activeTab,
  onChangeTab,
  counts,
}) => {
  const tabs: { id: HomeMemberStatus; label: string; icon: React.ReactNode }[] = [
    {
      id: 'ACTIVE',
      label: 'Mis Hogares',
      icon: <Home className="w-4 h-4" />,
    },
    {
      id: 'LEFT',
      label: 'Salidos / Historial',
      icon: <History className="w-4 h-4" />,
    },
  ];

  return (
    <div className="flex border-b border-outline-variant/60 w-full overflow-x-auto no-scrollbar gap-2 sm:gap-4">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const count = counts[tab.id] ?? 0;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChangeTab(tab.id)}
            className={`flex items-center gap-2 py-3 px-4 font-medium text-sm transition-all border-b-2 whitespace-nowrap focus:outline-none ${
              isActive
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-secondary hover:text-on-surface hover:border-outline-variant'
            }`}
            aria-selected={isActive}
            role="tab"
          >
            {tab.icon}
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'bg-surface-container text-secondary'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
