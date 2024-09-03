import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from 'src/job/entities/job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Job])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
