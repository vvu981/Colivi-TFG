import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Building2, Megaphone, Home } from 'lucide-react';

export const CreationDropdown: React.FC = () => {
  const [open, setOpen] = useState(false);
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

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all font-semibold text-xs border border-primary/20 shadow-xs"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Plus className="w-4 h-4" />
        <span>Nuevo</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-[0_8px_24px_rgba(15,23,42,0.10)] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          <ul className="py-1">
            <li>
              <Link
                to="/create-accommodation"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container hover:text-primary transition-colors"
              >
                <Building2 className="w-4 h-4 text-secondary" />
                <span>Crear alojamiento</span>
              </Link>
            </li>
            <li>
              <Link
                to="/create-listing"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container hover:text-primary transition-colors"
              >
                <Megaphone className="w-4 h-4 text-secondary" />
                <span>Publicar anuncio</span>
              </Link>
            </li>
            <li>
              <Link
                to="/homes"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container hover:text-primary transition-colors"
              >
                <Home className="w-4 h-4 text-secondary" />
                <span>Mis hogares</span>
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

