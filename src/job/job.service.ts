import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { Repository } from 'typeorm';
import { Job } from './entities/job.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ContractStatus } from 'src/contract/entities/contract.entity';
import { Profile } from 'src/profile/entities/profile.entity';

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(Job) private jobRepository: Repository<Job>,
    @InjectRepository(Profile) private profileRepository: Repository<Profile>,
  ) {}

  async findUnpaidJobs(profileId: number) {
    return this.jobRepository
      .createQueryBuilder('job')
      .innerJoin('job.contract', 'contract')
      .where('job.isPaid = false')
      .andWhere('contract.status = :status', {
        status: ContractStatus.IN_PROGRESS,
      })
      .andWhere(
        '(contract.contractorId = :profileId OR contract.clientId = :profileId)',
        { profileId },
      )
      .getMany();
  }

  async payForJob(jobId: number, clientId: number) {
    const job = await this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.contract', 'contract')
      .leftJoinAndSelect('contract.contractor', 'contractor')
      .where('job.id = :jobId', { jobId })
      .getOne();

    console.log('Job object here:', job);

    if (!job || job.isPaid)
      throw new BadRequestException('Job is already paid or does not exist');

    const client = await this.profileRepository.findOne({
      where: { id: clientId },
    });
    const contractor = await this.profileRepository.findOne({
      where: { id: job.contract?.contractor?.id },
    });

    console.log('contractor:', contractor);

    if (client.balance < job.price)
      throw new BadRequestException('Insufficient balance');

    // Transaction logic for paying contractor
    client.balance -= job.price;
    contractor.balance += job.price;
    job.isPaid = true;
    job.paidDate = new Date();

    await this.profileRepository.save(client);
    await this.profileRepository.save(contractor);
    await this.jobRepository.save(job);

    return job;
  }
}
