import React, { useState } from 'react';
import { AdminHeader, type AdminTab } from '../features/admin/components/AdminHeader';
import { AdminReportFilters } from '../features/admin/components/reports/AdminReportFilters';
import { AdminReportsTable } from '../features/admin/components/reports/AdminReportsTable';
import { AdminReportDetailModal } from '../features/admin/components/reports/AdminReportDetailModal';
import { AdminMostReportedRanking } from '../features/admin/components/reports/AdminMostReportedRanking';
import { AdminListingFiltersComponent } from '../features/admin/components/listings/AdminListingFilters';
import { AdminListingsTable } from '../features/admin/components/listings/AdminListingsTable';
import { AdminUsersTable } from '../features/admin/components/users/AdminUsersTable';
import { useAdminReports } from '../features/admin/hooks/useAdminReports';
import { useAdminListings } from '../features/admin/hooks/useAdminListings';
import { useAdminUsers } from '../features/admin/hooks/useAdminUsers';
import {
  FileText,
  Home,
  Users,
  AlertCircle,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('reports');

  // Reports state & actions
  const reportsHook = useAdminReports(10);

  // Listings state & actions
  const listingsHook = useAdminListings(10);

  // Users state & actions
  const usersHook = useAdminUsers(10);

  // Cross-navigation handlers
  const handleInspectListing = (listingId: string) => {
    setActiveTab('listings');
    listingsHook.setAllFilters({ title: listingId });
  };

  const handleInspectUser = (userId: string) => {
    setActiveTab('users');
    usersHook.setQuery(userId);
    usersHook.inspectUser(userId);
  };

  const handleFilterByTarget = (targetId: string, type: 'LISTING' | 'USER') => {
    setActiveTab('reports');
    reportsHook.resetFilters();
    reportsHook.setFilter('targetId', targetId);
    reportsHook.setFilter('targetType', type);
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col font-sans">
      {/* Admin Top Header */}
      <AdminHeader activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Title & Dashboard Summary */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0b1c30] tracking-tight">
              Portal de Moderación y Administración
            </h1>
            <p className="text-xs sm:text-sm text-[#565e74] mt-1">
              Supervisión de contenido, resolución de quejas y gestión de sanciones en tiempo real.
            </p>
          </div>

          {/* Quick Dashboard Stat Pills */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2 bg-white rounded-xl border border-[#dec0b7] shadow-xs">
              <FileText size={16} className="text-[#9f3c16]" />
              <div className="text-xs">
                <span className="text-[#565e74] block">Total Denuncias</span>
                <strong className="text-[#0b1c30] font-bold">
                  {reportsHook.pageInfo?.totalElements ?? '...'}
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2 bg-white rounded-xl border border-[#dec0b7] shadow-xs">
              <Home size={16} className="text-blue-600" />
              <div className="text-xs">
                <span className="text-[#565e74] block">Anuncios</span>
                <strong className="text-[#0b1c30] font-bold">
                  {listingsHook.pageInfo?.totalElements ?? '...'}
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2 bg-white rounded-xl border border-[#dec0b7] shadow-xs">
              <Users size={16} className="text-purple-600" />
              <div className="text-xs">
                <span className="text-[#565e74] block">Usuarios</span>
                <strong className="text-[#0b1c30] font-bold">
                  {usersHook.pageInfo?.totalElements ?? '...'}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Tab 1: Denuncias */}
        {activeTab === 'reports' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {reportsHook.error && (
              <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{reportsHook.error}</span>
              </div>
            )}

            {/* Filters Bar */}
            <AdminReportFilters
              filters={reportsHook.filters}
              onFilterChange={reportsHook.setFilter}
              onReset={reportsHook.resetFilters}
            />

            {/* Reports Table */}
            <AdminReportsTable
              reports={reportsHook.reports}
              pageInfo={reportsHook.pageInfo}
              page={reportsHook.page}
              size={reportsHook.size}
              isLoading={reportsHook.isLoading}
              selectedIds={reportsHook.selectedIds}
              onPageChange={reportsHook.setPage}
              onSizeChange={reportsHook.setSize}
              onToggleSelect={reportsHook.toggleSelect}
              onToggleSelectAll={reportsHook.toggleSelectAll}
              onSelectReport={reportsHook.setActiveReport}
              onBulkUpdate={reportsHook.updateBulkStatus}
            />

            {/* Report Dossier Detail Modal */}
            <AdminReportDetailModal
              report={reportsHook.activeReport}
              isOpen={!!reportsHook.activeReport}
              onClose={() => reportsHook.setActiveReport(null)}
              onStatusUpdate={async (id, status, notes) => {
                await reportsHook.updateSingleStatus(id, status, notes);
              }}
              onInspectListing={handleInspectListing}
              onInspectUser={handleInspectUser}
            />
          </div>
        )}

        {/* Tab 2: Anuncios */}
        {activeTab === 'listings' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {listingsHook.error && (
              <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{listingsHook.error}</span>
              </div>
            )}

            {/* Listings Filters */}
            <AdminListingFiltersComponent
              filters={listingsHook.filters}
              onFilterChange={listingsHook.setFilter}
              onReset={listingsHook.resetFilters}
            />

            {/* Listings Table */}
            <AdminListingsTable
              listings={listingsHook.listings}
              pageInfo={listingsHook.pageInfo}
              page={listingsHook.page}
              size={listingsHook.size}
              isLoading={listingsHook.isLoading}
              onPageChange={listingsHook.setPage}
              onSizeChange={listingsHook.setSize}
              onBanListing={listingsHook.banListing}
              onUnbanListing={listingsHook.unbanListing}
              onHardDeleteListing={listingsHook.hardDeleteListing}
              onRecoverListing={async (id) => {
                await listingsHook.recoverListing(id);
              }}
              onInspectUser={handleInspectUser}
            />
          </div>
        )}

        {/* Tab 3: Usuarios */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {usersHook.error && (
              <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{usersHook.error}</span>
              </div>
            )}

            <AdminUsersTable
              users={usersHook.users}
              pageInfo={usersHook.pageInfo}
              query={usersHook.query}
              role={usersHook.role}
              banned={usersHook.banned}
              deleted={usersHook.deleted}
              page={usersHook.page}
              size={usersHook.size}
              isLoading={usersHook.isLoading}
              onQueryChange={usersHook.setQuery}
              onRoleChange={usersHook.setRole}
              onBannedChange={usersHook.setBanned}
              onDeletedChange={usersHook.setDeleted}
              onPageChange={usersHook.setPage}
              onSizeChange={usersHook.setSize}
              onBanUser={usersHook.banUser}
              onUnbanUser={usersHook.unbanUser}
              onHardDeleteUser={usersHook.hardDeleteUser}
              onSetAdmin={usersHook.setAdmin}
            />
          </div>
        )}

        {/* Tab 4: Estadísticas & Rankings */}
        {activeTab === 'stats' && (
          <div className="animate-in fade-in duration-200">
            <AdminMostReportedRanking
              onInspectListing={handleInspectListing}
              onInspectUser={handleInspectUser}
              onFilterByTarget={handleFilterByTarget}
            />
          </div>
        )}
      </main>
    </div>
  );
};
export default AdminPage;
