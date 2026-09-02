import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { Shield, FileText, Home, Users, BarChart3, LogOut, Compass } from 'lucide-react';

export type AdminTab = 'reports' | 'listings' | 'users' | 'stats';

interface AdminHeaderProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'reports', label: 'Denuncias', icon: <FileText size={17} /> },
    { id: 'listings', label: 'Anuncios', icon: <Home size={17} /> },
    { id: 'users', label: 'Usuarios', icon: <Users size={17} /> },
    { id: 'stats', label: 'Estadísticas & Ranking', icon: <BarChart3 size={17} /> },
  ];

  return (
    <header className="bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-40 shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Brand & Admin Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/admin" className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-primary hover:opacity-90 transition-opacity">
              <img src="/favicon.png" alt="Colivi" className="h-8 w-8 object-contain" />
              <span className="font-extrabold text-2xl tracking-tight text-primary">Colivi</span>
            </Link>
            <div className="h-6 w-px bg-outline-variant/60 hidden sm:block" />
            <div className="flex items-center gap-1.5 px-3 py-1 bg-error-container/70 text-error text-xs font-bold rounded-full border border-error/25 tracking-wide shadow-xs shrink-0">
              <Shield size={14} className="text-error" />
              <span>MODERACIÓN</span>
            </div>
          </div>

          {/* Nav Tabs (Desktop) - Segmented Control Pill */}
          <nav className="hidden md:flex items-center p-1.5 bg-surface-container-low rounded-2xl border border-outline-variant/60 shadow-xs gap-1.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-secondary hover:text-on-surface hover:bg-surface-container/70'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Actions: Context Switcher, User profile & Logout */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/"
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-secondary hover:text-primary hover:bg-primary/10 rounded-xl transition-all border border-outline-variant/60 hover:border-primary/30 shadow-xs"
              title="Ir al portal público en modo exploración"
            >
              <Compass size={16} className="text-primary shrink-0" />
              <span className="hidden sm:inline">Explorar Portal</span>
            </Link>

            <div className="h-6 w-px bg-outline-variant/60 hidden lg:block" />

            {/* User Profile Chip */}
            <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 bg-surface-container-low rounded-2xl border border-outline-variant/50">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs border border-primary/20 shrink-0">
                {user?.profilePicUrl ? (
                  <img src={user.profilePicUrl} alt={user.nickname} className="w-full h-full rounded-full object-cover" />
                ) : (
                  user?.nickname?.charAt(0).toUpperCase() || 'A'
                )}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-on-surface leading-tight truncate max-w-[130px]">
                  {user?.nickname || 'Administrador'}
                </span>
                <span className="text-[10px] text-secondary leading-tight truncate max-w-[130px]">
                  {user?.email || 'admin@colivi.com'}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-error hover:bg-error-container/60 rounded-xl transition-all border border-error/25 shadow-xs cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex overflow-x-auto py-2.5 border-t border-outline-variant/40 gap-2 no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-secondary bg-surface-container-low hover:bg-surface-container'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

