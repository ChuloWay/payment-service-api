import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { Job } from 'src/job/entities/job.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {}

  async findOne(id: number): Promise<Profile> {
    return this.profileRepository.findOne({ where: { id } });
  }

  async depositBalance(userId: number, amount: number) {
    console.log(
      `DepositBalance called with userId: ${userId}, amount: ${amount}`,
    );

    // Fetch profile
    const profile = await this.profileRepository.findOne({
      where: { id: userId },
    });
    console.log(`Fetched profile for userId: ${userId}`, profile);

    // Fetch outstanding payments
    const outstandingPayments =
      await this.getOutstandingPaymentsForUser(userId);
    console.log(
      `Outstanding payments for userId: ${userId}:`,
      outstandingPayments,
    );

    // Calculate max deposit
    const maxDeposit = outstandingPayments * 0.25;
    console.log(`Max deposit allowed for userId: ${userId}: ${maxDeposit}`);

    // Check if deposit exceeds limit
    if (amount > maxDeposit) {
      console.error(
        `Deposit amount ${amount} exceeds max deposit limit ${maxDeposit} for userId: ${userId}`,
      );
      throw new BadRequestException('Deposit exceeds the allowed limit');
    }

    // Convert profile.balance from string to number before updating
    profile.balance = Number(profile.balance) + amount;
    console.log(`New balance for userId: ${userId}: ${profile.balance}`);

    // Save profile
    await this.profileRepository.save(profile);
    console.log(`Profile updated and saved for userId: ${userId}`);

    return profile;
  }

  async getOutstandingPaymentsForUser(userId: number) {
    console.log(`getOutstandingPaymentsForUser called with userId: ${userId}`);

    // Fetch unpaid jobs for the user
    const unpaidJobs = await this.jobRepository
      .createQueryBuilder('job')
      .innerJoin('job.contract', 'contract')
      .where('contract.clientId = :userId', { userId })
      .andWhere('job.isPaid = false')
      .getMany();
    console.log(`Unpaid jobs for userId: ${userId}:`, unpaidJobs);

    // Convert job.price from string to number and calculate total outstanding payments
    const totalOutstandingPayments = unpaidJobs.reduce(
      (total, job) => total + Number(job.price),
      0,
    );
    console.log(
      `Total outstanding payments for userId: ${userId}:`,
      totalOutstandingPayments,
    );

    return totalOutstandingPayments;
  }
}
