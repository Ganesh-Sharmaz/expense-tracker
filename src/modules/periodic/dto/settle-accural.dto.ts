import { IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class SettleAccrualDto {
  // The transaction ID that represents the actual payment
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  settled_transaction_id!: number;
}
