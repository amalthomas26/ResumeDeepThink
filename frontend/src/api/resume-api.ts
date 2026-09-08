import type {
  ScoreBreakdown,
  StepStartEvent,
  StepCompleteEvent,
} from '../types/scoring.types';

const API_BASE = 'http://localhost:3000';

// ─── Types ─────────────────────────────────────────────────────

export interface InitiateCheckResponse {
  readonly checkId: string;
}

export interface StreamCallbacks {
  onStepStart: (event: StepStartEvent) => void;
  onStepComplete: (event: StepCompleteEvent) => void;
  onComplete: (result: ScoreBreakdown) => void;
  onError: (message: string) => void;
}

// ─── API Functions ─────────────────────────────────────────────

/**
 * POST /resume/check — validates file, extracts text, returns { checkId }.
 * The checkId is then used to open an SSE stream.
 */
export async function initiateCheck(
  file: File,
  resumeType: string,
): Promise<InitiateCheckResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (resumeType) {
    formData.append('resumeType', resumeType);
  }

  const response = await fetch(`${API_BASE}/resume/check`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      (data as { message?: string }).message ??
        `Upload failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<InitiateCheckResponse>;
}

/**
 * Opens an SSE stream on GET /resume/check/:checkId/stream.
 * Parses incoming events and dispatches them to typed callbacks.
 *
 * Returns a cleanup function to close the EventSource.
 */
export function streamCheckProgress(
  checkId: string,
  callbacks: StreamCallbacks,
): () => void {
  const url = `${API_BASE}/resume/check/${checkId}/stream`;
  const eventSource = new EventSource(url);

  eventSource.addEventListener('step-start', (e: Event) => {
    const me = e as MessageEvent;
    try {
      const data = JSON.parse(me.data) as StepStartEvent;
      callbacks.onStepStart(data);
    } catch {
      // Malformed event — ignore
    }
  });

  eventSource.addEventListener('step-complete', (e: Event) => {
    const me = e as MessageEvent;
    try {
      const data = JSON.parse(me.data) as StepCompleteEvent;
      callbacks.onStepComplete(data);
    } catch {
      // Malformed event — ignore
    }
  });

  eventSource.addEventListener('complete', (e: Event) => {
    const me = e as MessageEvent;
    try {
      const parsed = JSON.parse(me.data) as { result: ScoreBreakdown };
      callbacks.onComplete(parsed.result);
    } catch {
      // Malformed event — ignore
    }
    eventSource.close();
  });

  eventSource.addEventListener('error', (e: Event) => {
    // Check if this is a server-sent error event or a connection error
    const me = e as MessageEvent;
    if (me.data) {
      try {
        const data = JSON.parse(me.data) as { message: string };
        callbacks.onError(data.message);
      } catch {
        callbacks.onError('Connection to scoring server lost.');
      }
    } else {
      // EventSource connection error — only report if not already closed
      if (eventSource.readyState !== EventSource.CLOSED) {
        callbacks.onError('Connection to scoring server lost.');
      }
    }
    eventSource.close();
  });

  return () => {
    eventSource.close();
  };
}
