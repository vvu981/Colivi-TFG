import React, { useEffect, useState, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Search, Map, MessageSquare, Home, User, LogIn, Shield } from 'lucide-react';
import { useAuth } from '../../features/auth/context/AuthContext';
import { messagingApi } from '../../features/messaging/api/messagingApi';

export const BottomNav: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const isAdmin = user?.role === 'ADMIN';

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    try {
      const res = await messagingApi.getUnreadMessagesCount();
      setUnreadCount(res.unreadCount || 0);
    } catch {
      // Fallo silencioso puntual de red
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount, location.pathname]);

  return (
    <nav
      aria-label="Navegación inferior móvil"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-surface/95 backdrop-blur-md border-t border-outline-variant/60 shadow-[0_-2px_10px_rgba(15,23,42,0.06)]"
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {/* Explorar */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 text-[11px] transition-colors ${
              isActive ? 'text-primary font-bold' : 'text-secondary hover:text-on-surface'
            }`
          }
        >
          <Search size={20} className="mb-0.5" />
          <span>Explorar</span>
        </NavLink>

        {/* Mapa */}
        <NavLink
          to="/map"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 text-[11px] transition-colors ${
              isActive ? 'text-primary font-bold' : 'text-secondary hover:text-on-surface'
            }`
          }
        >
          <Map size={20} className="mb-0.5" />
          <span>Mapa</span>
        </NavLink>

        {/* Mensajes (autenticado, no admin) */}
        {isAuthenticated && !isAdmin && (
          <NavLink
            to="/messages"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 text-[11px] relative transition-colors ${
                isActive ? 'text-primary font-bold' : 'text-secondary hover:text-on-surface'
              }`
            }
          >
            <div className="relative mb-0.5">
              <MessageSquare size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-2 flex items-center justify-center px-1 text-[9px] font-bold text-on-primary bg-primary rounded-full min-w-3.5 h-3.5 ring-2 ring-surface">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <span>Mensajes</span>
          </NavLink>
        )}

        {/* Hogares (autenticado, no admin) */}
        {isAuthenticated && !isAdmin && (
          <NavLink
            to="/homes"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 text-[11px] transition-colors ${
                isActive ? 'text-primary font-bold' : 'text-secondary hover:text-on-surface'
              }`
            }
          >
            <Home size={20} className="mb-0.5" />
            <span>Hogares</span>
          </NavLink>
        )}

        {/* Admin Moderación (si es admin) */}
        {isAuthenticated && isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 text-[11px] transition-colors ${
                isActive ? 'text-error font-bold' : 'text-secondary hover:text-on-surface'
              }`
            }
          >
            <Shield size={20} className="mb-0.5" />
            <span>Panel</span>
          </NavLink>
        )}

        {/* Perfil o Iniciar sesión */}
        {isAuthenticated ? (
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 text-[11px] transition-colors ${
                isActive ? 'text-primary font-bold' : 'text-secondary hover:text-on-surface'
              }`
            }
          >
            <User size={20} className="mb-0.5" />
            <span>Perfil</span>
          </NavLink>
        ) : (
          <NavLink
            to="/login"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 text-[11px] transition-colors ${
                isActive ? 'text-primary font-bold' : 'text-secondary hover:text-on-surface'
              }`
            }
          >
            <LogIn size={20} className="mb-0.5" />
            <span>Entrar</span>
          </NavLink>
        )}
      </div>
    </nav>
  );
};
