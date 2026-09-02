import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHomes } from '../features/home/hooks/useHomes';
import {
  HomeCard,
  HomeTabs,
  EmptyHomesState,
  CreateHomeModal,
  JoinHomeModal,
  InviteMembersModal,
  ConfirmLeaveModal,
  ConfirmArchiveModal,
  type HomeResponseDto,
} from '../features/home';
import { Plus, KeyRound, Search, Sparkles } from 'lucide-react';
import { Spinner } from '../components/feedback/Spinner';
import { MainLayout } from '../layouts/MainLayout';

export const HomesPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    homes,
    statusFilter,
    setStatusFilter,
    isLoading,
    error,
    counts,
    createHome,
    joinHome,
    leaveHome,
    archiveHome,
    unarchiveHome,
  } = useHomes('ACTIVE');

  // Filtro de búsqueda local
  const [searchQuery, setSearchQuery] = useState('');

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [inviteModalHome, setInviteModalHome] = useState<HomeResponseDto | null>(null);
  const [leaveModalHome, setLeaveModalHome] = useState<HomeResponseDto | null>(null);
  const [archiveModalHome, setArchiveModalHome] = useState<HomeResponseDto | null>(null);

  const filteredHomes = useMemo(() => {
    if (!searchQuery.trim()) return homes;
    const q = searchQuery.toLowerCase();
    return homes.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.invitationCode.toLowerCase().includes(q)
    );
  }, [homes, searchQuery]);

  const handleOpenDetail = (id: string) => {
    navigate(`/homes/${id}`);
  };

  const handleCreateSubmit = async (data: { name: string }) => {
    const newHome = await createHome(data);
    navigate(`/homes/${newHome.id}`);
  };

  const handleJoinSubmit = async (data: { invitationCode: string }) => {
    const joined = await joinHome(data);
    navigate(`/homes/${joined.id}`);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-surface py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
        {/* Encabezado de Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                Mis Hogares
              </h1>
              <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full border border-primary/20">
                <Sparkles className="w-3 h-3" />
                Comunidad
              </span>
            </div>
            <p className="text-xs sm:text-sm text-secondary mt-1">
              Gestiona tus grupos de convivencia, invita a compañeros y organiza tu piso.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsJoinOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-surface border border-outline-variant hover:bg-surface-container text-on-surface rounded-xl text-xs font-semibold transition-colors"
            >
              <KeyRound className="w-4 h-4 text-primary" />
              <span>Unirse con código</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Hogar</span>
            </button>
          </div>
        </div>

        {/* Pestañas y Buscador */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <HomeTabs
              activeTab={statusFilter}
              onChangeTab={setStatusFilter}
              counts={counts}
            />

            {/* Barra de búsqueda */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o código..."
                className="w-full pl-9 pr-3.5 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* Estado de Error */}
        {error && (
          <div className="p-4 bg-error-container/40 border border-error/20 rounded-2xl text-xs text-error font-medium text-center">
            {error}
          </div>
        )}

        {/* Listado de Hogares */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner />
          </div>
        ) : filteredHomes.length === 0 ? (
          <EmptyHomesState
            status={statusFilter}
            onCreateHome={() => setIsCreateOpen(true)}
            onJoinHome={() => setIsJoinOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredHomes.map((home) => (
              <HomeCard
                key={home.id}
                home={home}
                onOpenDetail={handleOpenDetail}
                onInvite={(h) => setInviteModalHome(h)}
                onLeave={(h) => setLeaveModalHome(h)}
                onArchive={(h) => setArchiveModalHome(h)}
                onUnarchive={async (h) => await unarchiveHome(h.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modales */}
      <CreateHomeModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <JoinHomeModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onSubmit={handleJoinSubmit}
      />

      {inviteModalHome && (
        <InviteMembersModal
          isOpen={!!inviteModalHome}
          onClose={() => setInviteModalHome(null)}
          homeName={inviteModalHome.name}
          invitationCode={inviteModalHome.invitationCode}
          isAdmin={inviteModalHome.myRole === 'ADMIN'}
        />
      )}

      {leaveModalHome && (
        <ConfirmLeaveModal
          isOpen={!!leaveModalHome}
          onClose={() => setLeaveModalHome(null)}
          homeName={leaveModalHome.name}
          isSoleActiveMember={leaveModalHome.totalActiveMembers === 1}
          isOnlyAdminWithOtherMembers={
            leaveModalHome.myRole === 'ADMIN' && leaveModalHome.totalActiveMembers > 1
          }
          onConfirmLeave={async () => {
            await leaveHome(leaveModalHome.id);
            setLeaveModalHome(null);
          }}
          onOpenTransferAdmin={() => {
            navigate(`/homes/${leaveModalHome.id}?tab=settings`);
          }}
        />
      )}

      {archiveModalHome && (
        <ConfirmArchiveModal
          isOpen={!!archiveModalHome}
          onClose={() => setArchiveModalHome(null)}
          homeName={archiveModalHome.name}
          onConfirmArchive={async () => {
            await archiveHome(archiveModalHome.id);
            setArchiveModalHome(null);
          }}
        />
      )}
      </div>
    </MainLayout>
  );
};
