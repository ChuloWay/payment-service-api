import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Contract, ContractStatus } from './entities/contract.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);

  constructor(
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
  ) {}

  async findContractById(id: number, profileId: number) {
    this.logger.log(`Finding contract with ID ${id} for profile ${profileId}`);

    try {
      const contract = await this.contractRepository
        .createQueryBuilder('contract')
        .leftJoinAndSelect('contract.contractor', 'contractor')
        .leftJoinAndSelect('contract.client', 'client')
        .where('contract.id = :id', { id })
        .andWhere('(contractor.id = :profileId OR client.id = :profileId)', {
          profileId,
        })
        .getOne();

      if (!contract) {
        this.logger.warn(
          `Contract not found or forbidden for profile ${profileId}`,
        );
        throw new ForbiddenException('You do not have access to this contract');
      }

      this.logger.log(`Found contract with ID ${id} for profile ${profileId}`);
      return contract;
    } catch (error) {
      this.logger.error(`Error finding contract: ${error.message}`);
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }
  }

  async findActiveContracts(profileId: number) {
    this.logger.log(`Fetching active contracts for profile ${profileId}`);

    try {
      const activeContracts = await this.contractRepository
        .createQueryBuilder('contract')
        .leftJoinAndSelect('contract.contractor', 'contractor')
        .leftJoinAndSelect('contract.client', 'client')
        .where('contractor.id = :profileId', { profileId })
        .orWhere('client.id = :profileId', { profileId })
        .andWhere('contract.status = :status', {
          status: ContractStatus.IN_PROGRESS,
        })
        .getMany();

      this.logger.log(
        `Found ${activeContracts.length} active contracts for profile ${profileId}`,
      );

      return activeContracts;
    } catch (error) {
      this.logger.error(`Error finding active contracts: ${error.message}`);
      throw new Error(
        `Failed to fetch active contracts for profile ${profileId}`,
      );
    }
  }
}
