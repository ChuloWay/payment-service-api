import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get('/unpaid')
  async getUnpaidJobs(@Req() req: any) {
    return this.jobService.findUnpaidJobs(req.profile.id);
  }

  @Post('/:job_id/pay')
  async payForJob(@Param('job_id') jobId: number, @Req() req: any) {
    return this.jobService.payForJob(jobId, req.profile.id);
  }
}
