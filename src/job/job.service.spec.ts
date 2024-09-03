import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner, SelectQueryBuilder, EntityManager } from 'typeorm';
import { JobService } from './job.service';
import { Job } from './entities/job.entity';
import { Profile } from '../profile/entities/profile.entity';
import { ContractStatus } from '../contract/entities/contract.entity';
import { JobNotFoundException } from 'src/util/exceptions/job-not-found.exception';
import { ProfileNotFoundException } from 'src/util/exceptions/profile-not-found.exception';
import { InsufficientBalanceException } from 'src/util/exceptions/insufficient-balance.exception';

describe('JobService', () => {
  let service: JobService;
  let jobRepository: jest.Mocked<Repository<Job>>;
  let dataSource: jest.Mocked<DataSource>;
  let queryRunner: jest.Mocked<QueryRunner>;
  let entityManager: jest.Mocked<EntityManager>;

  const mockJobRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobService,
        {
          provide: getRepositoryToken(Job),
          useValue: mockJobRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<JobService>(JobService);
    jobRepository = module.get(getRepositoryToken(Job)) as jest.Mocked<Repository<Job>>;
    dataSource = module.get<DataSource>(DataSource) as jest.Mocked<DataSource>;
    queryRunner = mockQueryRunner as unknown as jest.Mocked<QueryRunner>;

    dataSource.createQueryRunner.mockReturnValue(queryRunner);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findUnpaidJobs', () => {
    it('should return unpaid jobs for a profile', async () => {
      const profileId = 1;
      const mockJobs = [{ id: 1, isPaid: false }];
      const mockQueryBuilder = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockJobs),
      } as unknown as jest.Mocked<SelectQueryBuilder<Job>>;
      jobRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findUnpaidJobs(profileId);

      expect(result).toEqual(mockJobs);
      expect(jobRepository.createQueryBuilder).toHaveBeenCalledWith('job');
      expect(mockQueryBuilder.innerJoinAndSelect).toHaveBeenCalledWith('job.contract', 'contract');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('job.isPaid = :isPaid', { isPaid: false });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('contract.status = :status', { status: ContractStatus.IN_PROGRESS });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('(contract.contractorId = :profileId OR contract.clientId = :profileId)', {
        profileId,
      });
    });

    it('should throw an error when query fails', async () => {
      const profileId = 1;
      jobRepository.createQueryBuilder.mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(service.findUnpaidJobs(profileId)).rejects.toThrow(
        'Failed to retrieve unpaid jobs for profile ID 1. Please try again later.',
      );
    });
  });

  describe('payForJob', () => {
    const mockJob = {
      id: 1,
      price: 100,
      isPaid: false,
      contract: {
        contractor: { id: 2 },
      },
    };
    const mockClient = { id: 1, balance: 200 };
    const mockContractor = { id: 2, balance: 50 };

    beforeEach(() => {
      entityManager = {
        createQueryBuilder: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
      } as unknown as jest.Mocked<EntityManager>;

      queryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: entityManager,
      } as unknown as jest.Mocked<QueryRunner>;

      dataSource.createQueryRunner.mockReturnValue(queryRunner);

      const mockJobQueryBuilder = {
        setLock: jest.fn().mockReturnThis(),
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockJob),
      } as unknown as jest.Mocked<SelectQueryBuilder<Job>>;

      entityManager.createQueryBuilder.mockReturnValue(mockJobQueryBuilder);

      entityManager.findOne.mockImplementation((entity: any) => {
        if (entity === Profile) {
          return Promise.resolve(entity.where.id === 1 ? mockClient : mockContractor);
        }
        return Promise.resolve(null);
      });
    });

    it('should throw JobNotFoundException if job is not found', async () => {
      const mockJobQueryBuilder = {
        setLock: jest.fn().mockReturnThis(),
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      } as unknown as jest.Mocked<SelectQueryBuilder<Job>>;
      entityManager.createQueryBuilder.mockReturnValue(mockJobQueryBuilder);

      await expect(service.payForJob(1, 1)).rejects.toThrow(JobNotFoundException);
    });

    it('should throw ProfileNotFoundException if client or contractor is not found', async () => {
      entityManager.findOne.mockResolvedValue(null);

      await expect(service.payForJob(1, 1)).rejects.toThrow(ProfileNotFoundException);
    });

    it('should rollback transaction on error', async () => {
      entityManager.save.mockRejectedValue(new Error('Save error'));

      await expect(service.payForJob(1, 1)).rejects.toThrow('Failed to complete payment for job ID 1. Please try again later.');
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });
});
