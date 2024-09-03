import { HttpException, HttpStatus } from '@nestjs/common';

export class InsufficientBalanceException extends HttpException {
  constructor(currentBalance: number, requiredAmount: number) {
    super(
      `Insufficient balance. Current balance: ${currentBalance}, Required amount: ${requiredAmount}`,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InsufficientBalanceException';
  }
}
