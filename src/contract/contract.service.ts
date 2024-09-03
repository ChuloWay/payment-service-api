import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Contract, ContractStatus } from './entities/contract.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
  ) {}

  async findContractById(id: number, profileId: number) {
    const contract = await this.contractRepository.findOne({
      where: { id },
      relations: ['contractor', 'client'],
    });

    if (
      !contract ||
      (contract.contractor.id !== profileId && contract.client.id !== profileId)
    ) {
      throw new ForbiddenException('You do not have access to this contract');
    }

    return contract;
  }

  async findActiveContracts(profileId: number) {
    return await this.contractRepository.find({
      where: [
        { contractor: { id: profileId }, status: ContractStatus.IN_PROGRESS },
        { client: { id: profileId }, status: ContractStatus.IN_PROGRESS },
      ],
      relations: ['contractor', 'client'],
    });
  }
}
