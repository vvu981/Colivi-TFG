import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import type { CountryCode } from "libphonenumber-js";

interface CountryOption {
  value: CountryCode | undefined;
  label: string;
}

interface CountrySelectProps {
  value: CountryCode | undefined;
  onChange: (value: CountryCode | undefined) => void;
  options: CountryOption[];
  iconComponent: React.ComponentType<{ country: CountryCode | undefined; label: string }>;
}

export const PhoneCountrySelect = ({
  value,
  onChange,
  options,
  iconComponent: FlagIcon,
}: CountrySelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = options.filter(
    (o) =>
      o.label.toLowerCase().includes(search.toLowerCase()) ||
      (o.value && o.value.toLowerCase().includes(search.toLowerCase()))
  );

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Enfocar el buscador al abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSelect = (countryCode: CountryCode | undefined) => {
    onChange(countryCode);
    setIsOpen(false);
    setSearch("");
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setSearch("");
    }
  };

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center gap-1.5 h-full py-3 pr-2 focus:outline-none group"
      >
        <FlagIcon country={value} label={selected?.label ?? ""} />
        {/* Chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-3.5 h-3.5 text-[#565e74] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
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
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 top-full mt-1 z-50 bg-white border border-[#dec0b7] rounded-xl shadow-[0_8px_30px_rgba(15,23,42,0.12)] w-72 overflow-hidden"
          style={{ maxHeight: "320px", display: "flex", flexDirection: "column" }}
        >
          {/* Buscador */}
          <div className="p-2 border-b border-[#dec0b7]">
            <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#dec0b7] rounded-lg px-3 py-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-[#565e74] shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                placeholder="Buscar país..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-[#0b1c30] placeholder-[#565e74]/60 focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-[#565e74] hover:text-[#0b1c30] transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Lista de países */}
          <ul className="overflow-y-auto" style={{ flex: 1 }}>
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-[#565e74] text-center">
                No se encontraron resultados
              </li>
            ) : (
              filtered.map((option) => (
                <li
                  key={option.value ?? "intl"}
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => handleSelect(option.value)}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm transition-colors duration-100 ${
                    option.value === value
                      ? "bg-[#fff4f0] text-[#9f3c16] font-medium"
                      : "text-[#0b1c30] hover:bg-[#FAF8F5]"
                  }`}
                >
                  <span className="shrink-0">
                    <FlagIcon country={option.value} label={option.label} />
                  </span>
                  <span className="flex-1 truncate">{option.label}</span>
                  {option.value === value && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#9f3c16] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
