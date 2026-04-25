import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InternalService, PipelineEventDto } from './internal.service';

@Controller('internal')
export class InternalController {
  constructor(
    private readonly internalService: InternalService,
    private readonly config: ConfigService,
  ) {}

  @Post('pipeline-event')
  handleEvent(
    @Headers('x-internal-secret') secret: string,
    @Body() dto: PipelineEventDto,
  ) {
    const expected = this.config.get<string>('INTERNAL_API_SECRET');
    if (expected && secret !== expected) throw new UnauthorizedException();
    return this.internalService.handlePipelineEvent(dto);
  }
}
