export interface SSEEvent {
  type: string;
  data: any;
  stage?: string;
  message?: string;
}

export function connectSSE(jobId: string, onEvent: (e: SSEEvent) => void): () => void {
  const es = new EventSource(`/api/jobs/${jobId}/events`);

  es.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      const stage: string = data.stage ?? '';
      const sseEvent: SSEEvent = {
        type: stage === 'complete' ? 'complete' : stage === 'failed' ? 'failed' : 'pipeline_event',
        data,
        stage,
        message: data.message,
      };
      onEvent(sseEvent);
      if (stage === 'complete' || stage === 'failed') es.close();
    } catch {}
  };

  es.onerror = () => es.close();

  return () => es.close();
}
