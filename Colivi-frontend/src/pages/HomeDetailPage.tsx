import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';
import { useHomeDetail } from '../features/home/hooks/useHomeDetail';
import {
  HomeHeader,
  HomeMemberList,
  HomeActivityFeed,
  HomeSettingsPanel,
  InviteMembersModal,
  TransferAdminModal,
  ExpelMemberModal,
  ConfirmLeaveModal,
  ConfirmArchiveModal,
  ConfirmDeleteHomeModal,
  HomeExpensesTab,
  type HomeMemberResponseDto,
} from '../features/home';
import { Users, Receipt, Activity, Settings, ChevronLeft } from 'lucide-react';
import { Spinner } from '../components/feedback/Spinner';
import { MainLayout } from '../layouts/MainLayout';

type HomeDetailTab = 'members' | 'expenses' | 'activities' | 'settings';

export const HomeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const {
    home,
    isLoading,
    error,
    isAdmin,
    isActiveMember,
    activeMembers,
    isSoleActiveMember,
    isOnlyAdminWithOtherMembers,
    regenerateInvitationCode,
    transferAdmin,
    expelMember,
    forceExpelMember,
    leaveHome,
    deleteHome,
    archiveHome,
    unarchiveHome,
  } = useHomeDetail(id);

  const requestedTab = (searchParams.get('tab') as HomeDetailTab) || 'members';
  const activeTab: HomeDetailTab =
    requestedTab === 'settings' && (!isAdmin || !isActiveMember)
      ? 'members'
      : requestedTab === 'expenses' || requestedTab === 'activities' || requestedTab === 'settings'
        ? requestedTab
        : 'members';

  // Modales
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [expelTargetMember, setExpelTargetMember] = useState<HomeMemberResponseDto | null>(null);

  const handleTabChange = (tab: HomeDetailTab) => {
    setSearchParams({ tab });
  };

  const handleLeaveConfirm = async () => {
    await leaveHome();
    navigate('/homes');
  };

  const handleDeleteConfirm = async () => {
    await deleteHome();
    navigate('/homes');
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Spinner />
        </div>
      </MainLayout>
    );
  }

  if (error || !home) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full p-8 bg-surface-container-lowest border border-outline-variant/60 rounded-3xl space-y-4">
            <h2 className="text-xl font-bold text-on-surface">No se pudo cargar el hogar</h2>
            <p className="text-xs text-secondary">
              {error || 'El hogar solicitado no existe o no tienes permisos de acceso.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/homes')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-container transition-colors shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Volver a Mis Hogares</span>
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-surface py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
        {/* Encabezado del Hogar */}
        <HomeHeader
          home={home}
          onOpenInvite={() => setIsInviteOpen(true)}
          onOpenLeave={() => setIsLeaveOpen(true)}
          onArchive={() => setIsArchiveOpen(true)}
          onUnarchive={unarchiveHome}
        />

        {/* Sub-navegación por Pestañas */}
        <div className="flex border-b border-outline-variant/60 gap-4 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => handleTabChange('members')}
            className={`flex items-center gap-2 py-3 px-3 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'members'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-secondary hover:text-on-surface'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Miembros ({home.members.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('expenses')}
            className={`flex items-center gap-2 py-3 px-3 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'expenses'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-secondary hover:text-on-surface'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Gastos</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('activities')}
            className={`flex items-center gap-2 py-3 px-3 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'activities'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-secondary hover:text-on-surface'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Actividad y Auditoría</span>
          </button>

          {isAdmin && isActiveMember && (
            <button
              type="button"
              onClick={() => handleTabChange('settings')}
              className={`flex items-center gap-2 py-3 px-3 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Ajustes del Hogar</span>
            </button>
          )}
        </div>

        {/* Contenido de la pestaña */}
        <div className="mt-6">
          {activeTab === 'members' && (
            <div className="space-y-6">
              <HomeMemberList
                members={home.members}
                isAdmin={isAdmin}
                currentUserId={user?.id}
                onTransferAdmin={() => setIsTransferOpen(true)}
                onExpelMember={(member) => setExpelTargetMember(member)}
              />
            </div>
          )}

          {activeTab === 'expenses' && (
            <HomeExpensesTab
              home={home}
              isAdmin={isAdmin}
              isActiveMember={isActiveMember}
              currentUserId={user?.id}
            />
          )}

          {activeTab === 'activities' && (
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 sm:p-8">
              <div className="mb-6">
                <h3 className="text-base font-bold text-on-surface">Historial de Actividad</h3>
                <p className="text-xs text-secondary">
                  Registro cronológico e inmutable de todos los eventos del grupo.
                </p>
              </div>
              <HomeActivityFeed homeId={home.id} />
            </div>
          )}

          {activeTab === 'settings' && isAdmin && isActiveMember && (
            <HomeSettingsPanel
              home={home}
              isSoleActiveMember={isSoleActiveMember}
              onRegenerateCode={regenerateInvitationCode}
              onOpenDeleteModal={() => setIsDeleteOpen(true)}
              onOpenTransferAdminModal={() => setIsTransferOpen(true)}
            />
          )}
        </div>
      </div>

      {/* Modales */}
      <InviteMembersModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        homeName={home.name}
        invitationCode={home.invitationCode}
        isAdmin={isAdmin}
        onRegenerateCode={regenerateInvitationCode}
      />

      <TransferAdminModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        activeMembers={activeMembers}
        currentUserId={user?.id}
        onTransfer={transferAdmin}
      />

      {expelTargetMember && (
        <ExpelMemberModal
          isOpen={!!expelTargetMember}
          onClose={() => setExpelTargetMember(null)}
          member={expelTargetMember}
          homeId={home.id}
          onExpel={expelMember}
          onForceExpel={forceExpelMember}
        />
      )}

      <ConfirmLeaveModal
        isOpen={isLeaveOpen}
        onClose={() => setIsLeaveOpen(false)}
        homeName={home.name}
        homeId={home.id}
        currentUserId={user?.id}
        isSoleActiveMember={isSoleActiveMember}
        isOnlyAdminWithOtherMembers={isOnlyAdminWithOtherMembers}
        onConfirmLeave={handleLeaveConfirm}
        onOpenTransferAdmin={() => {
          handleTabChange('settings');
          setIsTransferOpen(true);
        }}
      />

      <ConfirmArchiveModal
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        homeName={home.name}
        onConfirmArchive={archiveHome}
      />

      <ConfirmDeleteHomeModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        homeName={home.name}
        onConfirmDelete={handleDeleteConfirm}
      />
      </div>
    </MainLayout>
  );
};
