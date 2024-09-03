import { Controller, Get, Post, Param, Req, HttpStatus, HttpCode } from '@nestjs/common';
import { JobService } from './job.service';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('jobs')
@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get('/unpaid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get unpaid jobs for the current user' })
  @ApiResponse({
    status: 200,
    description: 'List of unpaid jobs retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'No unpaid jobs found' })
  async getUnpaidJobs(@Req() req: any) {
    const unpaidJobs = await this.jobService.findUnpaidJobs(req.profile.id);
    return {
      statusCode: HttpStatus.OK,
      data: unpaidJobs,
      message: 'Unpaid jobs retrieved successfully',
    };
  }

  @Post('/:job_id/pay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pay for a specific job' })
  @ApiParam({
    name: 'job_id',
    description: 'The ID of the job to pay for',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Job payment processed successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid job ID or payment data' })
  @ApiResponse({ status: 404, description: 'Job not found or already paid' })
  async payForJob(@Param('job_id') jobId: number, @Req() req: any) {
    const result = await this.jobService.payForJob(jobId, req.profile.id);
    return {
      statusCode: HttpStatus.OK,
      data: result,
      message: 'Job payment processed successfully',
    };
  }
}
