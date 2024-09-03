import { IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class DepositDto {
  @IsNumber()
  @IsPositive()
  amount: number;
}
