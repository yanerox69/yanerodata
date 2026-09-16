export type RiskLevel = 'low' | 'medium' | 'high' | 'unknown';
export type DocStatus = 'queued' | 'running' | 'done' | 'error';

export interface DocumentAnalysis {
  risk_level: RiskLevel;
  summary: string;
  red_flags: string[];
  key_dates: string[];
  parties: string[];
}

export interface SwarmMetrics {
  completed: number;
  total: number;
  tokens_per_s: number;
  elapsed_s: number;
  concurrency: number;
}

export interface SwarmEvent {
  type: 'status' | 'done';
  doc_id: string;
  doc_name: string;
  status: DocStatus;
  analysis?: DocumentAnalysis;
  error?: string;
  latency_s?: number;
  metrics?: SwarmMetrics;
}

export interface DocEntry {
  id: string;
  name: string;
  status: DocStatus;
  analysis?: DocumentAnalysis;
  error?: string;
  latency_s?: number;
}
