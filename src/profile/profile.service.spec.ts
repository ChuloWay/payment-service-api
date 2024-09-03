import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from './profile.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ProfileNotFoundException } from 'src/util/exceptions/profile-not-found.exception';
import { DepositLimitExceededException } from 'src/util/exceptions/deposit-limit-exceeded.exception';
import { NotFoundException } from '@nestjs/common';
import { Job } from '../job/entities/job.entity';

describe('ProfileService', () => {
  let service: ProfileService;
  let mockDataSource: Partial<DataSource>;
  let mockProfileRepository: Partial<Repository<Profile>>;

  beforeEach(async () => {
    mockDataSource = {
      transaction: jest.fn(),
    };

    mockProfileRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: getRepositoryToken(Profile),
          useValue: mockProfileRepository,
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a profile when it exists', async () => {
      const mockProfile = { id: 1, name: 'Test User' };
      mockProfileRepository.findOne = jest.fn().mockResolvedValue(mockProfile);

      const result = await service.findOne(1);

      expect(result).toEqual(mockProfile);
      expect(mockProfileRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw ProfileNotFoundException when profile does not exist', async () => {
      mockProfileRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(ProfileNotFoundException);
      expect(mockProfileRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException for other errors', async () => {
      mockProfileRepository.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(1)).rejects.toThrow('Profile with ID 1 not found');
      expect(mockProfileRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('depositBalance', () => {
    it('should successfully deposit balance', async () => {
      const userId = 1;
      const amount = 100;
      const mockProfile = { id: userId, balance: 200 };
      const mockTransactionalEntityManager = {
        findOne: jest.fn().mockResolvedValue(mockProfile),
        save: jest.fn().mockResolvedValue({ ...mockProfile, balance: 300 }),
      };

      jest.spyOn(service as any, 'getOutstandingPaymentsForUser').mockResolvedValue(1000);

      mockDataSource.transaction = jest.fn().mockImplementation(async (cb) => {
        return await cb(mockTransactionalEntityManager as unknown as EntityManager);
      });

      const result = await service.depositBalance(userId, amount);

      expect(result).toEqual({ ...mockProfile, balance: 300 });
      expect(mockTransactionalEntityManager.findOne).toHaveBeenCalledWith(Profile, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });
      expect(mockTransactionalEntityManager.save).toHaveBeenCalledWith({ ...mockProfile, balance: 300 });
    });

    it('should throw ProfileNotFoundException when profile is not found', async () => {
      const userId = 1;
      const amount = 100;
      const mockTransactionalEntityManager = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      mockDataSource.transaction = jest.fn().mockImplementation(async (cb) => {
        return await cb(mockTransactionalEntityManager as unknown as EntityManager);
      });

      await expect(service.depositBalance(userId, amount)).rejects.toThrow(ProfileNotFoundException);
    });

    it('should throw DepositLimitExceededException when deposit limit is exceeded', async () => {
      const userId = 1;
      const amount = 300;
      const mockProfile = { id: userId, balance: 200 };
      const mockTransactionalEntityManager = {
        findOne: jest.fn().mockResolvedValue(mockProfile),
      };

      jest.spyOn(service as any, 'getOutstandingPaymentsForUser').mockResolvedValue(1000);

      mockDataSource.transaction = jest.fn().mockImplementation(async (cb) => {
        return await cb(mockTransactionalEntityManager as unknown as EntityManager);
      });

      await expect(service.depositBalance(userId, amount)).rejects.toThrow(DepositLimitExceededException);
    });
  });

  describe('getOutstandingPaymentsForUser', () => {
    it('should return the correct outstanding payments', async () => {
      const userId = 1;
      const mockResult = { totalOutstanding: '500' };
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockResult),
      };
      const mockTransactionalEntityManager = {
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      };

      const result = await (service as any).getOutstandingPaymentsForUser(userId, mockTransactionalEntityManager);

      expect(result).toBe(500);
      expect(mockTransactionalEntityManager.createQueryBuilder).toHaveBeenCalledWith(Job, 'job');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('SUM(job.price)', 'totalOutstanding');
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith('job.contract', 'contract');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('contract.clientId = :userId', { userId });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('job.isPaid = :isPaid', { isPaid: false });
      expect(mockQueryBuilder.getRawOne).toHaveBeenCalled();
    });

    it('should return 0 when no outstanding payments', async () => {
      const userId = 1;
      const mockResult = { totalOutstanding: null };
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockResult),
      };
      const mockTransactionalEntityManager = {
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      };

      const result = await (service as any).getOutstandingPaymentsForUser(userId, mockTransactionalEntityManager);

      expect(result).toBe(0);
    });

    it('should throw an error when query fails', async () => {
      const userId = 1;
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockRejectedValue(new Error('Database error')),
      };
      const mockTransactionalEntityManager = {
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      };

      await expect((service as any).getOutstandingPaymentsForUser(userId, mockTransactionalEntityManager)).rejects.toThrow(
        'Failed to get outstanding payments for user 1',
      );
    });
  });
});
