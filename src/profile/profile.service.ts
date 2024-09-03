import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { Job } from '../job/entities/job.entity';

import { DepositLimitExceededException } from 'src/util/exceptions/deposit-limit-exceeded.exception';
import { ProfileNotFoundException } from 'src/util/exceptions/profile-not-found.exception';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    private dataSource: DataSource,
  ) {}

  async findOne(id: number): Promise<Profile> {
    try {
      const profile = await this.profileRepository.findOne({ where: { id } });
      if (!profile) {
        throw new ProfileNotFoundException();
      }
      return profile;
    } catch (error) {
      this.logger.error(`Error finding profile: ${error.message}`);
      if (error instanceof ProfileNotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }
  }

  async depositBalance(userId: number, amount: number): Promise<Profile> {
    this.logger.log(`Attempting to deposit ${amount} for user ${userId}`);

    try {
      return await this.dataSource.transaction(
        async (transactionalEntityManager) => {
          const profile = await transactionalEntityManager.findOne(Profile, {
            where: { id: userId },
            lock: { mode: 'pessimistic_write' },
          });

          if (!profile) {
            throw new ProfileNotFoundException();
          }

          const outstandingPayments = await this.getOutstandingPaymentsForUser(
            userId,
            transactionalEntityManager,
          );
          const maxDeposit = outstandingPayments * 0.25;

          if (amount > maxDeposit) {
            throw new DepositLimitExceededException(amount, maxDeposit);
          }

          profile.balance = Number(profile.balance) + amount;
          await transactionalEntityManager.save(profile);

          this.logger.log(
            `Successfully deposited ${amount} for user ${userId}. New balance: ${profile.balance}`,
          );
          return profile;
        },
      );
    } catch (error) {
      this.logger.error(`Error depositing balance: ${error.message}`);
      if (
        error instanceof ProfileNotFoundException ||
        error instanceof DepositLimitExceededException
      ) {
        throw error;
      }
      throw new Error(`Failed to deposit balance for user ${userId}`);
    }
  }

  private async getOutstandingPaymentsForUser(
    userId: number,
    transactionalEntityManager: EntityManager,
  ): Promise<number> {
    try {
      const result = await transactionalEntityManager
        .createQueryBuilder(Job, 'job')
        .select('SUM(job.price)', 'totalOutstanding')
        .innerJoin('job.contract', 'contract')
        .where('contract.clientId = :userId', { userId })
        .andWhere('job.isPaid = :isPaid', { isPaid: false })
        .getRawOne();

      return Number(result.totalOutstanding) || 0;
    } catch (error) {
      this.logger.error(`Error getting outstanding payments: ${error.message}`);
      throw new Error(`Failed to get outstanding payments for user ${userId}`);
    }
  }
}
