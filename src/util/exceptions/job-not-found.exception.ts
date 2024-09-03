import { HttpException, HttpStatus } from '@nestjs/common';

export class JobNotFoundException extends HttpException {
  constructor(jobId: number) {
    super(
      `Job with ID ${jobId} not found or already paid`,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'JobNotFoundException';
  }
}
