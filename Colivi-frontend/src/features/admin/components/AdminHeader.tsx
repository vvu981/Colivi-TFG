import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { Shield, FileText, Home, Users, BarChart3, LogOut } from 'lucide-react';

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
    { id: 'reports', label: 'Denuncias', icon: <FileText size={18} /> },
    { id: 'listings', label: 'Anuncios', icon: <Home size={18} /> },
    { id: 'users', label: 'Usuarios', icon: <Users size={18} /> },
    { id: 'stats', label: 'Estadísticas & Ranking', icon: <BarChart3 size={18} /> },
  ];

  return (
    <header className="bg-white border-b border-[#dec0b7] sticky top-0 z-40 shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Admin Badge */}
          <div className="flex items-center gap-3">
            <Link to="/admin" className="flex items-center gap-2 text-xl font-bold tracking-tight text-[#9f3c16]">
              <img src="/favicon.png" alt="Colivi" className="h-7 w-7 object-contain" />
              <span>Colivi</span>
            </Link>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full border border-red-200">
              <Shield size={13} className="text-red-700" />
              <span>MODERACIÓN</span>
            </div>
          </div>

          {/* Nav Tabs (Desktop) */}
          <nav className="hidden md:flex space-x-1 lg:space-x-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-[#9f3c16] text-white shadow-sm'
                      : 'text-[#565e74] hover:text-[#0b1c30] hover:bg-[#eff4ff]'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-[#0b1c30] truncate max-w-[150px]">
                {user?.nickname || 'Administrador'}
              </span>
              <span className="text-xs text-[#565e74] truncate max-w-[150px]">{user?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
              title="Cerrar sesión"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex overflow-x-auto py-2 border-t border-[#dec0b7]/50 gap-1.5 no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? 'bg-[#9f3c16] text-white'
                    : 'text-[#565e74] hover:bg-[#eff4ff]'
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
