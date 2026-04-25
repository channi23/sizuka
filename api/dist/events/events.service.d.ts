import { Observable } from 'rxjs';
export interface PipelineEventPayload {
    stage: string;
    message: string;
    metadata?: Record<string, unknown>;
}
export declare class EventsService {
    private subjects;
    getStream(jobId: string): Observable<MessageEvent>;
    emit(jobId: string, payload: PipelineEventPayload): void;
}
