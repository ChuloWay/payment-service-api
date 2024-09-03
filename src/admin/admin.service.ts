import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'src/job/entities/job.entity';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {}

  async getBestClients(start: Date, end: Date, limit: number) {
    try {
      const bestClients = await this.jobRepository
        .createQueryBuilder('job')
        .innerJoin('job.contract', 'contract')
        .innerJoin('contract.client', 'client')
        .select('client.id, client.firstName, client.lastName, SUM(job.price) as totalPaid')
        .where('job.paidDate BETWEEN :start AND :end', { start, end })
        .groupBy('client.id')
        .orderBy('totalPaid', 'DESC')
        .limit(limit)
        .getRawMany();

      if (!bestClients.length) {
        this.logger.warn(`No best clients found between ${start.toISOString()} and ${end.toISOString()}`);
        return [];
      }

      return bestClients;
    } catch (error) {
      this.logger.error(`Failed to retrieve best clients between ${start.toISOString()} and ${end.toISOString()}: ${error.message}`);
      throw new Error(
        `Unable to retrieve best clients for the period ${start.toISOString()} to ${end.toISOString()}. Please try again later.`,
      );
    }
  }

  async getBestProfession(start: Date, end: Date) {
    try {
      const bestProfession = await this.jobRepository
        .createQueryBuilder('job')
        .innerJoin('job.contract', 'contract')
        .innerJoin('contract.contractor', 'contractor')
        .where('job.isPaid = true')
        .andWhere('job.paidDate BETWEEN :start AND :end', { start, end })
        .select('contractor.profession', 'profession')
        .addSelect('SUM(job.price)', 'totalEarnings')
        .groupBy('contractor.profession')
        .orderBy('"totalEarnings"', 'DESC')
        .getRawOne();

      if (!bestProfession) {
        this.logger.warn(`No best profession found between ${start.toISOString()} and ${end.toISOString()}`);
        return { profession: null, totalEarnings: 0 };
      }

      return {
        profession: bestProfession.profession,
        totalEarnings: Number(bestProfession.totalEarnings),
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve best profession between ${start.toISOString()} and ${end.toISOString()}: ${error.message}`);
      throw new Error(
        `Unable to retrieve the best profession for the period ${start.toISOString()} to ${end.toISOString()}. Please try again later.`,
      );
    }
  }
}
