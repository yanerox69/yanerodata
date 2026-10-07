import React from 'react';
import type { DocEntry } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { AlertTriangleIcon, CheckIcon, ClockIcon, FileIcon } from './icons';

const RISK_STYLES: Record<string, string> = {
  low: 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
  medium: 'bg-amber-900/50 text-amber-300 border-amber-700',
  high: 'bg-red-900/50 text-red-300 border-red-700',
  unknown: 'bg-gray-700/50 text-gray-300 border-gray-600',
};

const STATUS_LABEL: Record<string, string> = {
  queued: 'Queued',
  running: 'Analyzing...',
  done: 'Done',
  error: 'Error',
};

export const DocCard: React.FC<{ doc: DocEntry }> = ({ doc }) => {
  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-medium truncate">
          <FileIcon className="h-4 w-4 text-sky-400 shrink-0" />
          <span className="truncate">{doc.name}</span>
        </span>
        {doc.analysis && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
              RISK_STYLES[doc.analysis.risk_level] ?? RISK_STYLES.unknown
            }`}
          >
            {doc.analysis.risk_level.toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400">
        {doc.status === 'running' && <LoadingSpinner />}
        {doc.status === 'done' && <CheckIcon className="h-4 w-4 text-emerald-400" />}
        {doc.status === 'error' && <AlertTriangleIcon className="h-4 w-4 text-red-400" />}
        {doc.status === 'queued' && <ClockIcon className="h-4 w-4 text-gray-500" />}
        <span>{STATUS_LABEL[doc.status]}</span>
        {doc.latency_s !== undefined && <span>· {doc.latency_s}s</span>}
      </div>

      {doc.status === 'error' && <p className="text-sm text-red-300">{doc.error}</p>}

      {doc.analysis && (
        <div className="text-sm text-gray-300 space-y-1">
          <p>{doc.analysis.summary}</p>
          {doc.analysis.red_flags.length > 0 && (
            <ul className="list-disc list-inside text-amber-300/90 text-xs space-y-0.5">
              {doc.analysis.red_flags.slice(0, 3).map((flag, i) => (
                <li key={i}>{flag}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
