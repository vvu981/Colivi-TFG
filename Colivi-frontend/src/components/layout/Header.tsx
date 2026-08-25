import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import { UserMenu } from './UserMenu';
import { CreationDropdown } from './CreationDropdown';
import { Map } from 'lucide-react';

// ── Header principal ───────────────────────────────────────────────────
export const Header: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <nav className="bg-white font-body-md text-body-md border-b border-[#dec0b7] z-50 sticky top-0 shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
      <div className="flex justify-between items-center w-full px-margin-desktop h-20">
        {/* Brand */}
        <Link to="/" className="text-xl font-bold tracking-tight text-[#9f3c16] flex-shrink-0">
          Colivi
        </Link>

        {/* Navigation Links (Desktop) */}
        <div className="hidden md:flex space-x-lg items-center h-full flex-grow justify-center">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive
                ? 'text-[#9f3c16] border-b-2 border-[#9f3c16] font-semibold pb-1 flex flex-col justify-center h-full text-sm'
                : 'text-[#565e74] hover:text-[#9f3c16] transition-colors duration-200 flex flex-col justify-center h-full text-sm'
            }
          >
            Explorar
          </NavLink>
          <NavLink
            to="/map"
            className={({ isActive }) =>
              isActive
                ? 'text-[#9f3c16] border-b-2 border-[#9f3c16] font-semibold pb-1 flex items-center gap-1.5 flex-col justify-center h-full text-sm'
                : 'text-[#565e74] hover:text-[#9f3c16] transition-colors duration-200 flex items-center gap-1.5 flex-col justify-center h-full text-sm'
            }
          >
            <span className="flex items-center gap-1.5">
              <Map size={14} />
              Mapa
            </span>
          </NavLink>
          <Link to="/community" className="text-[#565e74] hover:text-[#9f3c16] transition-colors duration-200 flex flex-col justify-center h-full text-sm">
            Comunidad
          </Link>
          <Link to="/help" className="text-[#565e74] hover:text-[#9f3c16] transition-colors duration-200 flex flex-col justify-center h-full text-sm">
            Ayuda
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {isLoading ? (
            <div className="w-9 h-9 rounded-full bg-[#dec0b7] animate-pulse" />
          ) : isAuthenticated ? (
            <>
              <CreationDropdown />
              <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
              <UserMenu />
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-[#565e74] hover:text-[#9f3c16] transition-colors hidden md:block"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                className="bg-[#9f3c16] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#bf542c] transition-colors duration-200"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
