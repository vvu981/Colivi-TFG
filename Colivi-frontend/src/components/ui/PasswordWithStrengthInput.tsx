import React, { useState } from "react";

interface PasswordWithStrengthInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  showStrength?: boolean;
}

export const PasswordWithStrengthInput: React.FC<PasswordWithStrengthInputProps> = ({
  id,
  label,
  value,
  onChange,
  required = false,
  minLength = 8,
  placeholder = "Contraseña",
  showStrength = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const passwordStrength = Math.min(Math.floor(value.length / 3), 4);
  const strengthColors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-400"];

  return (
    <div className="flex flex-col gap-xs">
      <label className="text-sm font-medium text-[#0b1c30]" htmlFor={id}>
        {label} {required && <span className="text-[#9f3c16]">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white border border-[#dec0b7] text-[#0b1c30] text-sm rounded-lg py-3 px-4 pr-12 focus:border-[#0b1c30] focus:ring-2 focus:ring-[#dae2fd] focus:outline-none transition-all duration-200"
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#565e74] hover:text-[#0b1c30] transition-colors focus:outline-none"
        >
          {showPassword ? (
            <span className="material-symbols-outlined text-[20px]">visibility_off</span>
          ) : (
            <span className="material-symbols-outlined text-[20px]">visibility</span>
          )}
        </button>
      </div>
      {showStrength && value.length > 0 && (
        <div className="flex gap-1 mt-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                i < passwordStrength ? strengthColors[passwordStrength - 1] : "bg-[#dec0b7]"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
