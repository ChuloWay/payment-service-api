import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { ContractService } from './contract.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

@Controller('contracts')
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Get(':id')
  async getContractById(@Param('id') id: number, @Req() req: any) {
    return this.contractService.findContractById(id, req.profile.id);
  }

  @Get()
  async getUserContracts(@Req() req: any) {
    return this.contractService.findActiveContracts(req.profile.id);
  }
}
