import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ApiTags, ApiQuery, ApiResponse, ApiOperation } from '@nestjs/swagger';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('/best-clients')
  @ApiOperation({ summary: 'Get Best Clients' })
  @ApiQuery({
    name: 'start',
    type: String,
    description: 'Start date in ISO format',
  })
  @ApiQuery({
    name: 'end',
    type: String,
    description: 'End date in ISO format',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    description: 'Number of clients to return',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched best clients',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getBestClients(
    @Query('start') start: Date,
    @Query('end') end: Date,
    @Query('limit') limit: number = 2,
  ) {
    const result = await this.adminService.getBestClients(start, end, limit);
    return {
      statusCode: HttpStatus.OK,
      data: result,
      message: 'Best clients retrieved successfully',
    };
  }

  @Get('/best-profession')
  @ApiOperation({ summary: 'Get Best Profession' })
  @ApiQuery({
    name: 'start',
    type: String,
    description: 'Start date in ISO format',
  })
  @ApiQuery({
    name: 'end',
    type: String,
    description: 'End date in ISO format',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched best profession',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Get('/best-profession')
  async getBestProfession(
    @Query('start') start: Date,
    @Query('end') end: Date,
  ) {
    const result = await this.adminService.getBestProfession(start, end);
    return {
      statusCode: HttpStatus.OK,
      data: result,
      message: 'Best profession retrieved successfully',
    };
  }
}
