import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export interface CopyIdButtonProps {
  id: string;
  prefix?: string;
  className?: string;
  iconSize?: number;
  truncate?: boolean;
  maxTruncateWidth?: string;
  showText?: boolean;
}

export const CopyIdButton: React.FC<CopyIdButtonProps> = ({
  id,
  prefix,
  className = '',
  iconSize = 12,
  truncate = false,
  maxTruncateWidth = 'max-w-[140px]',
  showText = true,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!id) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(id).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        // Fallback if clipboard API fails
        fallbackCopy(id);
      });
    } else {
      fallbackCopy(id);
    }
  };

  const fallbackCopy = (text: string) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? '¡Copiado!' : `Copiar ID: ${id}`}
      className={`inline-flex items-center gap-1 text-[11px] font-mono text-secondary hover:text-primary transition-colors p-1 rounded-md hover:bg-surface-container/60 cursor-pointer ${className}`}
    >
      {prefix && <span className="font-sans font-normal text-secondary">{prefix}</span>}
      {showText && (
        <span className={truncate ? `truncate ${maxTruncateWidth}` : ''}>
          {id}
        </span>
      )}
      {copied ? (
        <span className="inline-flex items-center gap-1 text-emerald-600 font-sans font-semibold text-[10px]">
          <Check size={iconSize} className="text-emerald-600 shrink-0" />
          <span>Copiado</span>
        </span>
      ) : (
        <Copy size={iconSize} className="shrink-0 text-secondary hover:text-primary" />
      )}
    </button>
  );
};
