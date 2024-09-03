import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { DepositDto } from './dto/deposit.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.profileService.findOne(+id);
  }

  @Post('/balances/deposit/:userId')
  async deposit(
    @Param('userId') userId: number,
    @Body() depositDto: DepositDto,
  ) {
    return this.profileService.depositBalance(userId, depositDto.amount);
  }
}
