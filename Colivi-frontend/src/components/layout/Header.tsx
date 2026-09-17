import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import { UserMenu } from './UserMenu';
import { CreationDropdown } from './CreationDropdown';
import { Map, Search, Shield, Home } from 'lucide-react';

// ── Header principal ───────────────────────────────────────────────────
export const Header: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <nav className="bg-surface-container-lowest font-body-md text-body-md border-b border-outline-variant z-50 sticky top-0 shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
      <div className="flex justify-between items-center w-full px-4 sm:px-6 md:px-margin-desktop h-16 sm:h-20">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 text-lg sm:text-xl font-bold tracking-tight text-primary flex-shrink-0">
          <img src="/favicon.png" alt="Colivi" className="h-7 w-7 sm:h-8 sm:w-8 object-contain" />
          <span>Colivi</span>
        </Link>

        {/* Navigation Links (Desktop) */}
        <div className="hidden md:flex space-x-6 items-center h-full flex-grow justify-center">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive
                ? 'text-primary border-b-2 border-primary font-semibold pb-1 flex flex-col justify-center h-full text-sm'
                : 'text-secondary hover:text-primary transition-colors duration-200 flex flex-col justify-center h-full text-sm'
            }
          >
            <span className="flex items-center gap-1.5">
              <Search size={14} />
              Explorar
            </span>
          </NavLink>
          <NavLink
            to="/map"
            className={({ isActive }) =>
              isActive
                ? 'text-primary border-b-2 border-primary font-semibold pb-1 flex items-center gap-1.5 flex-col justify-center h-full text-sm'
                : 'text-secondary hover:text-primary transition-colors duration-200 flex items-center gap-1.5 flex-col justify-center h-full text-sm'
            }
          >
            <span className="flex items-center gap-1.5">
              <Map size={14} />
              Mapa
            </span>
          </NavLink>
          {isAuthenticated && !isAdmin && (
            <NavLink
              to="/homes"
              className={({ isActive }) =>
                isActive
                  ? 'text-primary border-b-2 border-primary font-semibold pb-1 flex items-center gap-1.5 flex-col justify-center h-full text-sm'
                : 'text-secondary hover:text-primary transition-colors duration-200 flex items-center gap-1.5 flex-col justify-center h-full text-sm'
              }
            >
              <span className="flex items-center gap-1.5">
                <Home size={14} />
                Hogares
              </span>
            </NavLink>
          )}
        </div>

        {/* Actions & Context Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {isLoading ? (
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-outline-variant animate-pulse" />
          ) : isAuthenticated ? (
            <>
              {isAdmin ? (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl text-xs font-bold transition-all border border-primary/20 shadow-xs"
                  title="Acceder al Panel de Moderación"
                >
                  <Shield size={14} />
                  <span className="hidden xs:inline">Panel Moderación</span>
                </Link>
              ) : (
                <>
                  <CreationDropdown />
                  <div className="h-6 w-px bg-surface-container mx-0.5 sm:mx-1 hidden sm:block"></div>
                </>
              )}
              <UserMenu />
            </>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-3">
              <Link
                to="/login"
                className="text-xs sm:text-sm font-medium text-secondary hover:text-primary transition-colors px-2 py-1.5"
              >
                Entrar
              </Link>
              <Link
                to="/register"
                className="bg-primary text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-primary-container transition-colors duration-200 shadow-xs"
              >
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

