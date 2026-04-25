import { Controller, Param, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { EventsService } from './events.service';

@Controller('api/jobs')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Sse(':id/events')
  stream(@Param('id') id: string): Observable<MessageEvent> {
    return this.eventsService.getStream(id);
  }
}
