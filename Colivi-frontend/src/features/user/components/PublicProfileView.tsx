import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import { usePublicProfile } from '../hooks/usePublicProfile';
import { useAuth } from '../../auth/context/AuthContext';
import { PublicProfileHeader } from './PublicProfileHeader';
import { PublicProfileStats } from './PublicProfileStats';
import { PublicProfileListings } from './PublicProfileListings';
import { ReportUserModal } from '../../report/components/ReportUserModal';
import { Spinner } from '../../../components/feedback/Spinner';

export interface PublicProfileViewProps {
  userId?: string;
}

/**
 * Main orchestrator component for the Public User Profile view.
 * Single Responsibility: Composition of user identity header, credibility stats, and published catalog.
 */
export const PublicProfileView: React.FC<PublicProfileViewProps> = ({ userId }) => {
  const navigate = useNavigate();
  const { user, listings, isLoading, error, isSelf, refetch } = usePublicProfile(userId);
  const { user: authUser } = useAuth();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const isAdmin = authUser?.role === 'ADMIN';

  // Loading State
  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-10 flex flex-col items-center justify-center gap-4 min-h-[60vh]">
        <Spinner />
        <p className="text-body-md text-on-surface-variant animate-pulse font-medium">
          Cargando perfil de usuario…
        </p>
      </div>
    );
  }

  // Error / Not Found State
  if (error || !user) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-16 flex flex-col items-center justify-center text-center gap-4 min-h-[60vh]">
        <div className="w-16 h-16 rounded-full bg-error-container text-error flex items-center justify-center shadow-xs">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-2xl font-bold text-on-surface">
          Perfil no disponible
        </h1>
        <p className="text-body-md text-on-surface-variant">
          {error || 'El usuario que buscas no existe o ya no está disponible en Colivi.'}
        </p>
        <div className="flex items-center gap-3 mt-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-surface-container border border-outline-variant text-on-surface text-label-md font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Volver</span>
          </button>
          <button
            type="button"
            onClick={refetch}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-on-primary text-label-md font-bold hover:bg-on-primary-fixed-variant transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw size={16} />
            <span>Reintentar</span>
          </button>
        </div>
      </div>
    );
  }

  const fullName = [user.firstName, user.lastName1, user.lastName2].filter(Boolean).join(' ');

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 flex flex-col gap-8">
      {/* Navigation & Self Indicator Banner */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Volver</span>
          </button>
        </div>

        {/* Banner shown if the user is looking at their own public profile */}
        {isSelf && (
          <div className="w-full p-4 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-on-surface animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <Eye size={18} className="text-primary shrink-0" />
              <span>
                <strong>Modo vista previa:</strong> Así es como otros miembros de la comunidad ven tu perfil público en Colivi.
              </span>
            </div>
            <Link
              to="/profile"
              className="font-bold text-primary hover:underline shrink-0"
            >
              Ir a ajustes de mi perfil →
            </Link>
          </div>
        )}
      </div>

      {/* Profile Header */}
      <PublicProfileHeader
        user={user}
        isSelf={isSelf}
        isHost={listings.length > 0}
        isAdmin={isAdmin}
        onReportClick={() => setIsReportModalOpen(true)}
      />

      {/* Trust & Stats Metrics */}
      <PublicProfileStats listingsCount={listings.length} createdAt={user.createdAt} />

      {/* Published Accommodations Catalog */}
      <PublicProfileListings
        listings={listings}
        userNickname={user.nickname}
        isSelf={isSelf}
      />

      {/* Report User Modal */}
      <ReportUserModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        userId={user.id}
        userNickname={user.nickname}
        userName={fullName}
      />
    </div>
  );
};
