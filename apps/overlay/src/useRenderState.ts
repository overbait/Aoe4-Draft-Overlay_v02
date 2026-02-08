import { useEffect, useState } from 'react';
import type { RenderStatePayload } from './types';

export const useRenderState = () => {
  const [payload, setPayload] = useState<RenderStatePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:4000';
    const source = new EventSource(`${backendUrl}/sse`);

    source.addEventListener('render_state', event => {
      try {
        const data = JSON.parse((event as MessageEvent).data) as RenderStatePayload;
        setPayload(data);
      } catch (err) {
        setError((err as Error).message);
      }
    });

    source.onerror = () => {
      setError('SSE connection failed.');
    };

    return () => {
      source.close();
    };
  }, []);

  return { payload, error };
};
