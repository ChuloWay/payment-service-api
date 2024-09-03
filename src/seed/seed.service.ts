import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Contract, ContractStatus } from 'src/contract/entities/contract.entity';
import { Job } from 'src/job/entities/job.entity';
import { Profile, ProfileRole } from 'src/profile/entities/profile.entity';
import { Repository } from 'typeorm';

import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {}

  async seed() {
    await this.seedProfiles();
    await this.seedContracts();
    await this.seedJobs();
  }

  private async seedProfiles() {
    const profiles = [
      {
        firstName: 'John',
        lastName: 'Doe',
        profession: 'Developer',
        balance: 1000,
        role: ProfileRole.CLIENT,
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        profession: 'Designer',
        balance: 1500,
        role: ProfileRole.CONTRACTOR,
      },
      {
        firstName: 'Alice',
        lastName: 'Johnson',
        profession: 'Project Manager',
        balance: 2000,
        role: ProfileRole.CLIENT,
      },
      {
        firstName: 'Bob',
        lastName: 'Williams',
        profession: 'Developer',
        balance: 1200,
        role: ProfileRole.CONTRACTOR,
      },
      {
        firstName: 'Charlie',
        lastName: 'Brown',
        profession: 'Designer',
        balance: 800,
        role: ProfileRole.CONTRACTOR,
      },
      {
        firstName: 'David',
        lastName: 'Miller',
        profession: 'Content Writer',
        balance: 1800,
        role: ProfileRole.CONTRACTOR,
      },
      {
        firstName: 'Emma',
        lastName: 'Davis',
        profession: 'Marketing Specialist',
        balance: 2200,
        role: ProfileRole.CLIENT,
      },
      {
        firstName: 'Frank',
        lastName: 'Wilson',
        profession: 'Data Analyst',
        balance: 1600,
        role: ProfileRole.CONTRACTOR,
      },
      {
        firstName: 'Grace',
        lastName: 'Taylor',
        profession: 'UX Researcher',
        balance: 1900,
        role: ProfileRole.CONTRACTOR,
      },
      {
        firstName: 'Henry',
        lastName: 'Anderson',
        profession: 'SEO Specialist',
        balance: 1700,
        role: ProfileRole.CLIENT,
      },
      {
        firstName: 'Isabelle',
        lastName: 'Thomas',
        profession: 'Copywriter',
        balance: 1300,
        role: ProfileRole.CONTRACTOR,
      },
      {
        firstName: 'Jack',
        lastName: 'White',
        profession: 'DevOps Engineer',
        balance: 2100,
        role: ProfileRole.CONTRACTOR,
      },
      {
        firstName: 'Kate',
        lastName: 'Lee',
        profession: 'Product Manager',
        balance: 2300,
        role: ProfileRole.CLIENT,
      },
      {
        firstName: 'Liam',
        lastName: 'Harris',
        profession: 'Frontend Developer',
        balance: 1400,
        role: ProfileRole.CONTRACTOR,
      },
      {
        firstName: 'Mia',
        lastName: 'Clark',
        profession: 'Backend Developer',
        balance: 1700,
        role: ProfileRole.CONTRACTOR,
      },
    ];

    for (const profileData of profiles) {
      const profile = this.profileRepository.create({
        ...profileData,
        uuid: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await this.profileRepository.save(profile);
    }
  }

  private async seedContracts() {
    const clients = await this.profileRepository.find({
      where: { role: ProfileRole.CLIENT },
    });
    const contractors = await this.profileRepository.find({
      where: { role: ProfileRole.CONTRACTOR },
    });

    const contracts = [
      {
        terms: 'Web development project',
        status: ContractStatus.IN_PROGRESS,
        client: clients[0],
        contractor: contractors[0],
      },
      {
        terms: 'Logo design',
        status: ContractStatus.NEW,
        client: clients[1],
        contractor: contractors[1],
      },
      {
        terms: 'Mobile app development',
        status: ContractStatus.IN_PROGRESS,
        client: clients[2],
        contractor: contractors[2],
      },
      {
        terms: 'UI/UX design project',
        status: ContractStatus.TERMINATED,
        client: clients[3],
        contractor: contractors[3],
      },
      {
        terms: 'Content writing for blog',
        status: ContractStatus.IN_PROGRESS,
        client: clients[4],
        contractor: contractors[4],
      },
      {
        terms: 'SEO optimization',
        status: ContractStatus.NEW,
        client: clients[0],
        contractor: contractors[5],
      },
      {
        terms: 'Data analysis project',
        status: ContractStatus.IN_PROGRESS,
        client: clients[1],
        contractor: contractors[6],
      },
      {
        terms: 'UX research for new product',
        status: ContractStatus.IN_PROGRESS,
        client: clients[2],
        contractor: contractors[7],
      },
      {
        terms: 'Copywriting for marketing campaign',
        status: ContractStatus.NEW,
        client: clients[3],
        contractor: contractors[8],
      },
      {
        terms: 'DevOps consultation',
        status: ContractStatus.TERMINATED,
        client: clients[4],
        contractor: contractors[9],
      },
      {
        terms: 'Frontend development for e-commerce site',
        status: ContractStatus.IN_PROGRESS,
        client: clients[0],
        contractor: contractors[1],
      },
      {
        terms: 'Backend API development',
        status: ContractStatus.NEW,
        client: clients[1],
        contractor: contractors[2],
      },
      {
        terms: 'Mobile app UI design',
        status: ContractStatus.IN_PROGRESS,
        client: clients[2],
        contractor: contractors[3],
      },
      {
        terms: 'Database optimization',
        status: ContractStatus.IN_PROGRESS,
        client: clients[3],
        contractor: contractors[4],
      },
      {
        terms: 'Cloud migration project',
        status: ContractStatus.NEW,
        client: clients[4],
        contractor: contractors[5],
      },
    ];

    for (const contractData of contracts) {
      const contract = this.contractRepository.create({
        ...contractData,
        uuid: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await this.contractRepository.save(contract);
    }
  }

  private async seedJobs() {
    const contracts = await this.contractRepository.find({
      relations: ['client', 'contractor'],
    });

    const jobs = [
      {
        description: 'Develop landing page',
        price: 1000,
        isPaid: false,
        contract: contracts[0],
      },
      {
        description: 'Design company logo',
        price: 500,
        isPaid: true,
        paidDate: new Date(),
        contract: contracts[1],
      },
      {
        description: 'Implement user authentication',
        price: 1500,
        isPaid: false,
        contract: contracts[2],
      },
      {
        description: 'Create mobile app wireframes',
        price: 800,
        isPaid: true,
        paidDate: new Date(),
        contract: contracts[2],
      },
      {
        description: 'Optimize database queries',
        price: 1200,
        isPaid: false,
        contract: contracts[0],
      },
      {
        description: 'Write content for 5 blog posts',
        price: 750,
        isPaid: false,
        contract: contracts[4],
      },
      {
        description: 'Perform keyword research',
        price: 300,
        isPaid: true,
        paidDate: new Date(),
        contract: contracts[5],
      },
      {
        description: 'Analyze customer purchase data',
        price: 2000,
        isPaid: false,
        contract: contracts[6],
      },
      {
        description: 'Conduct user interviews',
        price: 1000,
        isPaid: true,
        paidDate: new Date(),
        contract: contracts[7],
      },
      {
        description: 'Write copy for homepage',
        price: 500,
        isPaid: false,
        contract: contracts[8],
      },
      {
        description: 'Set up CI/CD pipeline',
        price: 1800,
        isPaid: true,
        paidDate: new Date(),
        contract: contracts[9],
      },
      {
        description: 'Develop product listing page',
        price: 1300,
        isPaid: false,
        contract: contracts[10],
      },
      {
        description: 'Create RESTful API endpoints',
        price: 1600,
        isPaid: true,
        paidDate: new Date(),
        contract: contracts[11],
      },
      {
        description: 'Design mobile app icons',
        price: 400,
        isPaid: false,
        contract: contracts[12],
      },
      {
        description: 'Implement database indexing',
        price: 900,
        isPaid: true,
        paidDate: new Date(),
        contract: contracts[13],
      },
    ];

    for (const jobData of jobs) {
      const job = this.jobRepository.create({
        ...jobData,
        uuid: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await this.jobRepository.save(job);
    }
  }
}
