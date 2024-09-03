import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { AdminService } from './admin.service';
import { Job } from 'src/job/entities/job.entity';

describe('AdminService', () => {
  let service: AdminService;
  let jobRepository: Partial<Repository<Job>>;
  let mockQueryBuilder: Partial<SelectQueryBuilder<Job>>;

  beforeEach(async () => {
    mockQueryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
      getRawOne: jest.fn(),
    } as unknown as Partial<SelectQueryBuilder<Job>>;

    const mockRepository = {
      createQueryBuilder: jest.fn(() => mockQueryBuilder as SelectQueryBuilder<Job>),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getRepositoryToken(Job),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    jobRepository = module.get<Repository<Job>>(getRepositoryToken(Job));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBestClients', () => {
    it('should return best clients', async () => {
      const mockBestClients = [
        { id: 1, firstName: 'John', lastName: 'Doe', totalPaid: '1000' },
        { id: 2, firstName: 'Jane', lastName: 'Smith', totalPaid: '800' },
      ];

      (mockQueryBuilder.getRawMany as jest.Mock).mockResolvedValue(mockBestClients);

      const result = await service.getBestClients(new Date('2023-01-01'), new Date('2023-12-31'), 2);

      expect(result).toEqual(mockBestClients);
      expect(mockQueryBuilder.getRawMany).toHaveBeenCalled();
    });

    it('should return an empty array when no clients found', async () => {
      (mockQueryBuilder.getRawMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getBestClients(new Date('2023-01-01'), new Date('2023-12-31'), 2);

      expect(result).toEqual([]);
      expect(mockQueryBuilder.getRawMany).toHaveBeenCalled();
    });

    it('should throw an error when query fails', async () => {
      (mockQueryBuilder.getRawMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(service.getBestClients(new Date('2023-01-01'), new Date('2023-12-31'), 2)).rejects.toThrow(
        'Unable to retrieve best clients for the period',
      );
    });
  });

  describe('getBestProfession', () => {
    it('should return the best profession', async () => {
      const mockBestProfession = {
        profession: 'Engineering',
        totalEarnings: '1500',
      };

      (mockQueryBuilder.getRawOne as jest.Mock).mockResolvedValue(mockBestProfession);

      const result = await service.getBestProfession(new Date('2023-01-01'), new Date('2023-12-31'));

      expect(result).toEqual({
        profession: 'Engineering',
        totalEarnings: 1500,
      });
      expect(mockQueryBuilder.getRawOne).toHaveBeenCalled();
    });

    it('should return default values when no profession found', async () => {
      (mockQueryBuilder.getRawOne as jest.Mock).mockResolvedValue(undefined);

      const result = await service.getBestProfession(new Date('2023-01-01'), new Date('2023-12-31'));

      expect(result).toEqual({ profession: null, totalEarnings: 0 });
      expect(mockQueryBuilder.getRawOne).toHaveBeenCalled();
    });

    it('should throw an error when query fails', async () => {
      (mockQueryBuilder.getRawOne as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(service.getBestProfession(new Date('2023-01-01'), new Date('2023-12-31'))).rejects.toThrow(
        'Unable to retrieve the best profession for the period',
      );
    });
  });
});
