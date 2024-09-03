import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Req,
} from '@nestjs/common';

import { ContractService } from './contract.service';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@ApiTags('contracts')
@Controller('contracts')
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a contract by its ID' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the contract',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Contract retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async getContractById(@Param('id') id: number, @Req() req: any) {
    const contract = this.contractService.findContractById(id, req.profile.id);

    return {
      statusCode: HttpStatus.OK,
      data: contract,
      message: 'Contract retrieved successfully',
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get active contracts for the current user' })
  @ApiResponse({
    status: 200,
    description: 'List of active contracts retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'No active contracts found' })
  async getUserContracts(@Req() req: any) {
    const contracts = this.contractService.findActiveContracts(req.profile.id);
    return {
      statusCode: HttpStatus.OK,
      data: contracts,
      message: 'Active contracts retrieved successfully',
    };
  }
}
