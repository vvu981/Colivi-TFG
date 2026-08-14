import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';

// ── Menú de usuario autenticado ────────────────────────────────────────
const UserMenu = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 focus:outline-none group"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {/* Avatar */}
        {user?.profilePicUrl ? (
          <img
            src={user.profilePicUrl}
            alt={user.nickname}
            className="w-9 h-9 rounded-full object-cover border-2 border-[#dec0b7] group-hover:border-[#9f3c16] transition-colors"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-[#9f3c16] flex items-center justify-center text-white text-sm font-bold border-2 border-[#dec0b7] group-hover:border-[#9f3c16] transition-colors">
            {user?.nickname?.charAt(0).toUpperCase() ?? '?'}
          </div>
        )}
        {/* Nickname */}
        <span className="hidden md:block text-sm font-medium text-[#0b1c30] group-hover:text-[#9f3c16] transition-colors">
          {user?.nickname}
        </span>
        {/* Chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-4 h-4 text-[#565e74] transition-transform duration-200 hidden md:block ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#dec0b7] rounded-xl shadow-[0_8px_24px_rgba(15,23,42,0.10)] overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-[#dec0b7]">
            <p className="text-sm font-semibold text-[#0b1c30] truncate">{user?.nickname}</p>
            <p className="text-xs text-[#565e74] truncate">{user?.email}</p>
          </div>
          <ul className="py-1">
            <li>
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#0b1c30] hover:bg-[#FAF8F5] transition-colors"
              >
                Mi perfil
              </Link>
            </li>
            <li>
              <Link
                to="/my-listings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#0b1c30] hover:bg-[#FAF8F5] transition-colors"
              >
                Mis anuncios
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Cerrar sesión
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

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
          <Link to="/" className="text-[#9f3c16] border-b-2 border-[#9f3c16] font-semibold pb-1 flex flex-col justify-center h-full opacity-80 transition-opacity text-sm">
            Explorar
          </Link>
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
            <UserMenu />
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