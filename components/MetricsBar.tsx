import React from 'react';
import type { SwarmMetrics } from '../types';
import { ZapIcon, ClockIcon, CheckIcon } from './icons';

export const MetricsBar: React.FC<{ metrics: SwarmMetrics | null; concurrency: number }> = ({
  metrics,
  concurrency,
}) => {
  const completed = metrics?.completed ?? 0;
  const total = metrics?.total ?? 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <Stat icon={<CheckIcon className="h-5 w-5 text-emerald-400" />} label="Completados" value={`${completed}/${total}`} />
        <Stat icon={<ZapIcon className="h-5 w-5 text-sky-400" />} label="Tokens/seg" value={metrics ? metrics.tokens_per_s.toFixed(1) : '0.0'} />
        <Stat icon={<ClockIcon className="h-5 w-5 text-amber-400" />} label="Tiempo" value={metrics ? `${metrics.elapsed_s.toFixed(1)}s` : '0.0s'} />
        <Stat icon={<ZapIcon className="h-5 w-5 text-indigo-400" />} label="Concurrencia GPU" value={`${concurrency}x`} />
      </div>
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex flex-col items-center gap-1">
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-lg font-bold text-white">{value}</span>
    </div>
    <span className="text-xs text-gray-400">{label}</span>
  </div>
);
