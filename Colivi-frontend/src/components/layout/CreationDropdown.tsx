import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

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
        className="flex items-center gap-1.5 px-3 py-2 bg-[#FAF8F5] text-[#9f3c16] hover:bg-[#dec0b7] hover:text-[#0b1c30] rounded-lg transition-colors font-medium text-sm border border-[#dec0b7]"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Nuevo
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-[0_8px_24px_rgba(15,23,42,0.10)] overflow-hidden z-50">
          <ul className="py-1">
            <li>
              <Link
                to="/create-accommodation"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#0b1c30] hover:bg-slate-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#565e74]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Crear alojamiento
              </Link>
            </li>
            <li>
              <Link
                to="/create-listing"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#0b1c30] hover:bg-slate-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#565e74]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
                Publicar anuncio
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
