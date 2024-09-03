import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'src/job/entities/job.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {}

  async getBestClients(start: Date, end: Date, limit: number) {
    return await this.jobRepository
      .createQueryBuilder('job')
      .innerJoin('job.contract', 'contract')
      .innerJoin('contract.client', 'client')
      .select(
        'client.id, client.firstName, client.lastName, SUM(job.price) as totalPaid',
      )
      .where('job.paidDate BETWEEN :start AND :end', { start, end })
      .groupBy('client.id')
      .orderBy('totalPaid', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getBestProfession(start: Date, end: Date) {
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

    return {
      profession: bestProfession.profession,
      totalEarnings: Number(bestProfession.totalEarnings),
    };
  }
}
