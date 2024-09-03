import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('/best-clients')
  async getBestClients(
    @Query('start') start: Date,
    @Query('end') end: Date,
    @Query('limit') limit: number = 2,
  ) {
    return this.adminService.getBestClients(start, end, limit);
  }

  @Get('/best-profession')
  async getBestProfession(
    @Query('start') start: Date,
    @Query('end') end: Date,
  ) {
    return this.adminService.getBestProfession(start, end);
  }
}
