import type { SwarmEvent } from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';

export async function runSwarm(
  files: File[],
  concurrency: number,
  onEvent: (event: SwarmEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));

  const resp = await fetch(`${API_BASE}/api/swarm/run?concurrency=${concurrency}`, {
    method: 'POST',
    body: formData,
    signal,
  });

  if (!resp.ok || !resp.body) {
    throw new Error(`Swarm request failed: ${resp.status} ${resp.statusText}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() ?? '';

    for (const chunk of chunks) {
      const line = chunk.trim();
      if (!line.startsWith('data:')) continue;
      const jsonStr = line.slice('data:'.length).trim();
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.type === 'done' && !parsed.doc_id) continue;
        onEvent(parsed as SwarmEvent);
      } catch {
        // ignore malformed chunk
      }
    }
  }
}

export function exportUrl(fmt: 'xlsx' | 'json'): string {
  return `${API_BASE}/api/swarm/export/${fmt}`;
}
