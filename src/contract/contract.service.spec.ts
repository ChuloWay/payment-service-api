import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ContractService } from './contract.service';
import { Contract, ContractStatus } from './entities/contract.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ContractService', () => {
  let service: ContractService;
  let mockRepository: Partial<Repository<Contract>>;
  let mockQueryBuilder: Partial<SelectQueryBuilder<Contract>>;

  beforeEach(async () => {
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn(),
    };

    mockRepository = {
      createQueryBuilder: jest.fn(() => mockQueryBuilder as SelectQueryBuilder<Contract>),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractService,
        {
          provide: getRepositoryToken(Contract),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ContractService>(ContractService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findContractById', () => {
    it('should return a contract when it exists and user has access', async () => {
      const mockContract = { id: 1, status: ContractStatus.IN_PROGRESS };
      (mockRepository.createQueryBuilder() as any).getOne.mockResolvedValue(mockContract);

      const result = await service.findContractById(1, 1);
      expect(result).toEqual(mockContract);
    });

    it('should throw ForbiddenException when contract exists but user has no access', async () => {
      (mockRepository.createQueryBuilder() as any).getOne.mockResolvedValue(null);

      await expect(service.findContractById(1, 1)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when contract does not exist', async () => {
      (mockRepository.createQueryBuilder() as any).getOne.mockRejectedValue(new Error('DB error'));

      await expect(service.findContractById(1, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findActiveContracts', () => {
    it('should return active contracts for a profile', async () => {
      const mockContracts = [
        { id: 1, status: ContractStatus.IN_PROGRESS },
        { id: 2, status: ContractStatus.IN_PROGRESS },
      ];
      (mockRepository.createQueryBuilder() as any).getMany.mockResolvedValue(mockContracts);

      const result = await service.findActiveContracts(1);
      expect(result).toEqual(mockContracts);
    });

    it('should return an empty array when no active contracts are found', async () => {
      (mockRepository.createQueryBuilder() as any).getMany.mockResolvedValue([]);

      const result = await service.findActiveContracts(1);
      expect(result).toEqual([]);
    });

    it('should throw an error when database query fails', async () => {
      (mockRepository.createQueryBuilder() as any).getMany.mockRejectedValue(new Error('DB error'));

      await expect(service.findActiveContracts(1)).rejects.toThrow('Failed to fetch active contracts for profile 1');
    });
  });
});
