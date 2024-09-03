import { HttpException, HttpStatus } from '@nestjs/common';

export class DepositLimitExceededException extends HttpException {
  constructor(amount: number, maxDeposit: number) {
    super(`Deposit amount ${amount} exceeds the maximum allowed amount of ${maxDeposit}`, HttpStatus.BAD_REQUEST);
    this.name = 'DepositLimitExceededException';
  }
}
