import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  ValidationPipe,
  Res,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { DepositDto } from './dto/deposit.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Profile } from './entities/profile.entity';
import { Response } from 'express';

@ApiTags('profiles')
@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post(':userId/deposit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deposit balance to a user profile' })
  @ApiParam({
    name: 'userId',
    description: 'The ID of the user',
    type: 'number',
  })
  @ApiBody({ description: 'Deposit information', type: DepositDto })
  @ApiResponse({
    status: 200,
    description: 'Deposit successful',
    type: Profile,
  })
  @ApiResponse({ status: 400, description: 'Invalid deposit input' })
  @ApiResponse({ status: 404, description: 'User profile not found' })
  async deposit(
    @Param('userId') userId: string,
    @Body(new ValidationPipe({ transform: true })) depositDto: DepositDto,
    @Res() res: Response,
  ): Promise<Response> {
    const updatedProfile = await this.profileService.depositBalance(
      +userId,
      depositDto.amount,
    );
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      data: updatedProfile,
      message: 'Deposit successful',
    });
  }
}
