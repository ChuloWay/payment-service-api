import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { Job } from './entities/job.entity';
import { Profile } from '../profile/entities/profile.entity';
import { ContractStatus } from '../contract/entities/contract.entity';
import { JobNotFoundException } from 'src/util/exceptions/job-not-found.exception';
import { ProfileNotFoundException } from 'src/util/exceptions/profile-not-found.exception';
import { InsufficientBalanceException } from 'src/util/exceptions/insufficient-balance.exception';

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);

  constructor(
    @InjectRepository(Job) private jobRepository: Repository<Job>,
    private dataSource: DataSource,
  ) {}

  async findUnpaidJobs(profileId: number): Promise<Job[]> {
    try {
      return await this.jobRepository
        .createQueryBuilder('job')
        .innerJoinAndSelect('job.contract', 'contract')
        .where('job.isPaid = :isPaid', { isPaid: false })
        .andWhere('contract.status = :status', {
          status: ContractStatus.IN_PROGRESS,
        })
        .andWhere('(contract.contractorId = :profileId OR contract.clientId = :profileId)', { profileId })
        .getMany();
    } catch (error) {
      this.logger.error(`Failed to find unpaid jobs for profile ${profileId}: ${error.message}`);
      throw new Error(`Failed to retrieve unpaid jobs for profile ID ${profileId}. Please try again later.`);
    }
  }
  async payForJob(jobId: number, clientId: number): Promise<Job> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const job = await this.getJobWithLock(queryRunner, jobId);

      if (!job.contract || !job.contract.contractor) {
        throw new Error('Job does not have a valid contract or contractor');
      }

      const [client, contractor] = await this.getProfilesWithLock(queryRunner, clientId, job.contract.contractor.id);

      this.validatePayment(job, client, contractor);

      await this.processPayment(queryRunner, job, client, contractor);

      await queryRunner.commitTransaction();
      return job;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to process payment for job ${jobId}: ${error.message}`);
      if (
        error instanceof JobNotFoundException ||
        error instanceof ProfileNotFoundException ||
        error instanceof InsufficientBalanceException
      ) {
        throw error;
      }
      throw new Error(`Failed to complete payment for job ID ${jobId}. Please try again later.`);
    } finally {
      await queryRunner.release();
    }
  }

  private async getJobWithLock(queryRunner: QueryRunner, jobId: number): Promise<Job> {
    const job = await queryRunner.manager
      .createQueryBuilder(Job, 'job')
      .setLock('pessimistic_write')
      .innerJoinAndSelect('job.contract', 'contract')
      .innerJoinAndSelect('contract.contractor', 'contractor')
      .where('job.id = :jobId', { jobId })
      .getOne();

    if (!job || job.isPaid) {
      this.logger.warn(`Job ${jobId} not found or already paid`);
      throw new JobNotFoundException(jobId);
    }

    return job;
  }

  private async getProfilesWithLock(queryRunner: QueryRunner, clientId: number, contractorId: number): Promise<[Profile, Profile]> {
    const [client, contractor] = await Promise.all([
      queryRunner.manager.findOne(Profile, {
        where: { id: clientId },
        lock: { mode: 'pessimistic_write' },
      }),
      queryRunner.manager.findOne(Profile, {
        where: { id: contractorId },
        lock: { mode: 'pessimistic_write' },
      }),
    ]);

    if (!client || !contractor) {
      this.logger.warn(`Client ${clientId} or contractor ${contractorId} not found`);
      throw new ProfileNotFoundException();
    }

    return [client, contractor];
  }

  private validatePayment(job: Job, client: Profile, contractor: Profile): void {
    if (client.balance < job.price) {
      this.logger.warn(`Insufficient balance for client ${client.id}`);
      throw new InsufficientBalanceException(client.balance, job.price);
    }
  }

  private async processPayment(queryRunner: QueryRunner, job: Job, client: Profile, contractor: Profile): Promise<void> {
    client.balance -= job.price;
    contractor.balance += job.price;
    job.isPaid = true;
    job.paidDate = new Date();

    await Promise.all([queryRunner.manager.save(client), queryRunner.manager.save(contractor), queryRunner.manager.save(job)]);

    this.logger.log(`Successfully paid for job ${job.id}`);
  }
}
