import React from 'react';
import { ExternalLink, CheckCircle, Search, ShieldCheck } from 'lucide-react';

interface DoiBadgeProps {
  doi?: string;
  className?: string;
  showVerifyButton?: boolean;
  onVerify?: (doi: string) => void;
}

export function cleanDoi(doi?: string): string {
  if (!doi) return '';
  return doi
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '')
    .trim();
}

export const DoiBadge: React.FC<DoiBadgeProps> = ({
  doi,
  className = '',
  showVerifyButton = true,
  onVerify,
}) => {
  const cleaned = cleanDoi(doi);
  if (!cleaned) return null;

  const doiUrl = `https://doi.org/${cleaned}`;

  return (
    <div
      className={`inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 px-2.5 py-0.5 rounded-md text-[11px] font-mono border border-slate-300 transition-colors shadow-2xs ${className}`}
    >
      <a
        href={doiUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 hover:text-teal-700 font-medium"
        title={`Open official persistent identifier: ${doiUrl}`}
      >
        <span className="font-bold text-teal-800 text-[10px] bg-teal-50 px-1 rounded border border-teal-200">
          DOI
        </span>
        <span className="truncate max-w-[190px]">{cleaned}</span>
        <ExternalLink className="w-3 h-3 text-slate-400 hover:text-teal-600 shrink-0" />
      </a>

      {showVerifyButton && onVerify && (
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onVerify(cleaned);
          }}
          className="ml-1 pl-1 border-l border-slate-300 text-teal-700 hover:text-teal-900 font-sans font-semibold text-[10px] flex items-center gap-0.5"
          title="Verify publication metadata via CrossRef registry"
        >
          <Search className="w-2.5 h-2.5" /> Check
        </button>
      )}
    </div>
  );
};
