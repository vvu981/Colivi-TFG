import { useRef, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import { bookingRequestService } from '../../features/housing/api/bookingRequestService';

export const UserMenu = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchPendingCount = useCallback(async () => {
    if (!user || user.role === 'ADMIN') return;
    try {
      const count = await bookingRequestService.getPendingRequestsCount();
      setPendingCount(count);
    } catch {
      // Ignoramos silenciosamente si el usuario no tiene permisos o hay fallo puntual
    }
  }, [user]);

  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount, location.pathname]);

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

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 focus:outline-none group relative"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {/* Avatar */}
        <div className="relative">
          {user?.profilePicUrl ? (
            <img
              src={user.profilePicUrl}
              alt={user.nickname}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover border-2 border-[#dec0b7] group-hover:border-[#9f3c16] transition-colors"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#9f3c16] flex items-center justify-center text-white text-sm font-bold border-2 border-[#dec0b7] group-hover:border-[#9f3c16] transition-colors">
              {user?.nickname?.charAt(0).toUpperCase() ?? '?'}
            </div>
          )}
          {pendingCount > 0 && !isAdmin && (
            <span
              className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse"
              title={`${pendingCount} solicitudes pendientes`}
            >
              {pendingCount > 99 ? '99+' : pendingCount}
            </span>
          )}
        </div>
        {/* Nickname & Role */}
        <div className="hidden md:flex flex-col items-start text-left">
          <span className="text-sm font-medium text-[#0b1c30] group-hover:text-[#9f3c16] transition-colors">
            {user?.nickname}
          </span>
          {isAdmin && (
            <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.2 rounded">
              ADMIN
            </span>
          )}
        </div>
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
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-[#0b1c30] truncate">{user?.nickname}</p>
              {isAdmin && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-800 rounded border border-red-200">
                  ADMIN
                </span>
              )}
            </div>
            <p className="text-xs text-[#565e74] truncate">{user?.email}</p>
          </div>
          
          <div className="py-1">
            {isAdmin ? (
              /* MENU EXCLUSIVO PARA ADMINISTRADOR */
              <div className="py-1">
                <Link
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-[#9f3c16] hover:bg-orange-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#9f3c16]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Panel de Moderación
                </Link>
              </div>
            ) : (
              /* MENU PARA USUARIOS ESTANDAR */
              <>
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

                <div className="py-1">
                  <Link
                    to="/my-requests"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#0b1c30] hover:bg-slate-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#565e74]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Mis solicitudes
                  </Link>
                  <Link
                    to="/received-requests"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between px-4 py-2.5 text-sm text-[#0b1c30] hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#565e74]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span>Solicitudes recibidas</span>
                    </div>
                    {pendingCount > 0 && (
                      <span className="flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-5 h-5">
                        {pendingCount > 99 ? '99+' : pendingCount}
                      </span>
                    )}
                  </Link>
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
              </>
            )}

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
