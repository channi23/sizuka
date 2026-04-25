import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';

@Controller('api/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  create(@Body() dto: CreateJobDto) {
    return this.jobsService.create(dto);
  }

  @Get()
  findAll() {
    return this.jobsService.findAll();
  }

  @Get('outreach-candidates')
  getOutreachCandidates() {
    return this.jobsService.getOutreachCandidates();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Get(':id/shortlist')
  getShortlist(
    @Param('id') id: string,
    @Query('matchWeight') matchWeight?: string,
    @Query('interestWeight') interestWeight?: string,
  ) {
    return this.jobsService.getShortlist(
      id,
      matchWeight ? parseFloat(matchWeight) : 0.6,
      interestWeight ? parseFloat(interestWeight) : 0.4,
    );
  }

  @Get(':id/pipeline-events')
  getEvents(@Param('id') id: string) {
    return this.jobsService.getEvents(id);
  }
}
