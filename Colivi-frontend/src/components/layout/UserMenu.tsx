import { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';

export const UserMenu = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-[0_8px_24px_rgba(15,23,42,0.10)] overflow-hidden z-50">
          {/* BLOQUE INFORMATIVO */}
          <div className="px-4 py-3 bg-[#FAF8F5] border-b border-slate-200">
            <p className="text-sm font-bold text-[#0b1c30] truncate">{user?.nickname}</p>
            <p className="text-xs text-[#565e74] truncate">{user?.email}</p>
          </div>
          
          <div className="py-1">
            {/* BLOQUE CUENTA */}
            <div className="py-1">
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#0b1c30] hover:bg-slate-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#565e74]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Mi perfil
              </Link>
            </div>

            <div className="border-t border-slate-200"></div>

            {/* BLOQUE GESTIÓN */}
            <div className="py-1">
              <Link
                to="/my-accommodations"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#0b1c30] hover:bg-slate-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#565e74]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Mis alojamientos
              </Link>
              <Link
                to="/my-listings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#0b1c30] hover:bg-slate-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#565e74]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Mis anuncios
              </Link>
            </div>

            <div className="border-t border-slate-200"></div>

            {/* BLOQUE SALIDA */}
            <div className="py-1">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
