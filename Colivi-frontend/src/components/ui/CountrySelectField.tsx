import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import flags from 'react-phone-number-input/flags';

const countryCodes = [
  'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY', 'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN', 'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ', 'EC', 'EE', 'EG', 'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK', 'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM', 'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR', 'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK', 'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW', 'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ', 'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI', 'VN', 'VU', 'WF', 'WS', 'YE', 'YT', 'ZA', 'ZM', 'ZW'
];

const regionNames = new Intl.DisplayNames(['es'], { type: 'region' });

const countries = countryCodes.map(code => ({
  value: regionNames.of(code) || code,
  code,
})).sort((a, b) => a.value.localeCompare(b.value));

// Add some defaults if Intl.DisplayNames fails on some browsers
if (countries.length > 0 && countries[0].value === countries[0].code) {
    // Fallback if Intl is not supported correctly
    console.warn("Intl.DisplayNames not fully supported, country names might be missing.");
}

interface CountrySelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

export const CountrySelectField = ({ value, onChange, error }: CountrySelectFieldProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = countries.filter((c) =>
    c.value.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearch('');
    }
  };

  const FlagIcon = ({ code }: { code: string }) => {
    const Flag = flags[code as keyof typeof flags];
    if (Flag) {
      return (
        <span className="w-6 h-4 inline-flex items-center justify-center overflow-hidden rounded-[2px] shadow-sm">
          <Flag title={code} />
        </span>
      );
    }
    // Fallback emoji
    const emoji = code.toUpperCase().replace(/./g, char => 
      String.fromCodePoint(char.charCodeAt(0) + 127397)
    );
    return <span className="text-xl leading-none">{emoji}</span>;
  };

  const selectedCountry = countries.find(c => c.value === value);

  return (
    <div ref={containerRef} className="relative w-full" onKeyDown={handleKeyDown}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between rounded-lg border ${error ? 'border-error' : 'border-outline-variant'} bg-surface px-4 py-3 text-body-md font-body-md text-on-surface focus:outline-none focus:border-on-surface focus:ring-2 focus:ring-secondary-container transition-colors`}
      >
        <span className="flex items-center gap-2">
            {selectedCountry && <FlagIcon code={selectedCountry.code} />}
            <span>{value || 'Selecciona un país'}</span>
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-4 h-4 text-on-surface-variant transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
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
          className="absolute left-0 top-full mt-1 z-50 bg-white border border-outline-variant rounded-xl shadow-lg w-full overflow-hidden"
          style={{ maxHeight: '320px', display: 'flex', flexDirection: 'column' }}
        >
          {/* Buscador */}
          <div className="p-2 border-b border-outline-variant">
            <div className="flex items-center gap-2 bg-surface-container border border-outline-variant rounded-lg px-3 py-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-on-surface-variant shrink-0"
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
                className="flex-1 bg-transparent text-sm text-on-surface placeholder-on-surface-variant focus:outline-none"
              />
            </div>
          </div>

          {/* Lista de países */}
          <ul className="overflow-y-auto" style={{ flex: 1 }}>
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-on-surface-variant text-center">
                No se encontraron resultados
              </li>
            ) : (
              filtered.map((option) => (
                <li
                  key={option.code}
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => handleSelect(option.value)}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm transition-colors duration-100 ${
                    option.value === value
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="shrink-0 flex items-center justify-center">
                    <FlagIcon code={option.code} />
                  </span>
                  <span className="flex-1 truncate">{option.value}</span>
                  {option.value === value && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
