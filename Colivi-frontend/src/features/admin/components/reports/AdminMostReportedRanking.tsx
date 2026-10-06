import React from 'react';
import { useAdminStats } from '../../hooks/useAdminStats';
import { CopyIdButton } from '../common/CopyIdButton';
import { BarChart3, Home, User, ShieldAlert, RefreshCw, Eye } from 'lucide-react';

interface AdminMostReportedRankingProps {
  onInspectListing?: (id: string) => void;
  onInspectUser?: (id: string) => void;
  onFilterByTarget?: (targetId: string, type: 'LISTING' | 'USER') => void;
}

export const AdminMostReportedRanking: React.FC<AdminMostReportedRankingProps> = ({
  onInspectListing,
  onInspectUser,
  onFilterByTarget,
}) => {
  const { mostReportedListings, mostReportedUsers, isLoading, error, refetch } = useAdminStats();

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <BarChart3 size={20} className="text-primary" />
            <span>Ranking de Elementos Más Denunciados</span>
          </h2>
          <p className="text-xs text-secondary mt-0.5">
            Detección rápida de infractores reincidentes y anuncios problemáticos activos con denuncias pendientes (excluye elementos ya moderados o baneados).
          </p>
        </div>
        <button
          onClick={refetch}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-secondary hover:text-on-surface bg-surface-container-lowest border border-outline-variant rounded-xl hover:bg-surface-container-low transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          <span>Actualizar</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-error-container text-on-error-container text-xs rounded-xl border border-error/20">
          {error}
        </div>
      )}

      {/* Two columns: Top Listings & Top Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Listings */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/40 mb-4">
            <div className="flex items-center gap-2 font-bold text-sm text-on-surface">
              <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <Home size={16} />
              </div>
              <span>Top Anuncios Denunciados</span>
            </div>
            <span className="text-xs text-secondary font-medium">Top 10 Activos</span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-secondary">
              <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
              <p>Calculando ranking...</p>
            </div>
          ) : mostReportedListings.length === 0 ? (
            <div className="py-12 text-center text-xs text-secondary">
              <ShieldAlert size={28} className="mx-auto text-secondary/40 mb-1" />
              <p>No hay anuncios con denuncias acumuladas.</p>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/30">
              {mostReportedListings.map((item, index) => {
                const pending = item.pendingCount ?? item.reportCount ?? 0;
                const total = item.totalCount ?? item.reportCount ?? pending;

                return (
                  <div
                    key={item.targetId}
                    onClick={() => onInspectListing && onInspectListing(item.targetId)}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-surface-container-low px-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        index === 0 ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                        index === 1 ? 'bg-surface-container text-secondary' :
                        index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-surface-container-low text-secondary'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="truncate">
                        <div onClick={(e) => e.stopPropagation()}>
                          <CopyIdButton id={item.targetId} truncate maxTruncateWidth="max-w-[150px]" />
                        </div>
                        <span className="text-[11px] text-secondary block mt-0.5">Anuncio (Listing)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <div className="text-right">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-error-container text-error border border-error/20 inline-block">
                          {pending} {pending === 1 ? 'pendiente' : 'pendientes'}
                        </span>
                        <span className="text-[11px] text-secondary block mt-0.5">
                          {total} total histórico
                        </span>
                      </div>
                      {onFilterByTarget && (
                        <button
                          onClick={() => onFilterByTarget(item.targetId, 'LISTING')}
                          className="p-1.5 text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                          title="Ver todas las denuncias"
                        >
                          <Eye size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Users */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/40 mb-4">
            <div className="flex items-center gap-2 font-bold text-sm text-on-surface">
              <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                <User size={16} />
              </div>
              <span>Top Usuarios Denunciados</span>
            </div>
            <span className="text-xs text-secondary font-medium">Top 10 Activos</span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-secondary">
              <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
              <p>Calculando ranking...</p>
            </div>
          ) : mostReportedUsers.length === 0 ? (
            <div className="py-12 text-center text-xs text-secondary">
              <ShieldAlert size={28} className="mx-auto text-secondary/40 mb-1" />
              <p>No hay usuarios con denuncias acumuladas.</p>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/30">
              {mostReportedUsers.map((item, index) => {
                const pending = item.pendingCount ?? item.reportCount ?? 0;
                const total = item.totalCount ?? item.reportCount ?? pending;

                return (
                  <div
                    key={item.targetId}
                    onClick={() => onInspectUser && onInspectUser(item.targetId)}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-surface-container-low px-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        index === 0 ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                        index === 1 ? 'bg-surface-container text-secondary' :
                        index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-surface-container-low text-secondary'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="truncate">
                        <div onClick={(e) => e.stopPropagation()}>
                          <CopyIdButton id={item.targetId} truncate maxTruncateWidth="max-w-[150px]" />
                        </div>
                        <span className="text-[11px] text-secondary block mt-0.5">Usuario (User)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <div className="text-right">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-error-container text-error border border-error/20 inline-block">
                          {pending} {pending === 1 ? 'pendiente' : 'pendientes'}
                        </span>
                        <span className="text-[11px] text-secondary block mt-0.5">
                          {total} total histórico
                        </span>
                      </div>
                      {onFilterByTarget && (
                        <button
                          onClick={() => onFilterByTarget(item.targetId, 'USER')}
                          className="p-1.5 text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                          title="Ver todas las denuncias"
                        >
                          <Eye size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
