import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

export interface PipelineEventPayload {
  stage: string;
  message: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class EventsService {
  private subjects = new Map<string, Subject<MessageEvent>>();

  getStream(jobId: string): Observable<MessageEvent> {
    if (!this.subjects.has(jobId)) {
      this.subjects.set(jobId, new Subject<MessageEvent>());
    }
    return this.subjects.get(jobId)!.asObservable();
  }

  emit(jobId: string, payload: PipelineEventPayload) {
    const subject = this.subjects.get(jobId);
    if (subject) {
      subject.next({ data: payload } as MessageEvent);
    }
    if (payload.stage === 'complete' || payload.stage === 'failed') {
      setTimeout(() => {
        subject?.complete();
        this.subjects.delete(jobId);
      }, 2000);
    }
  }
}
