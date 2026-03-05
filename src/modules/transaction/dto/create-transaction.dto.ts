import {
  IsEnum,
  IsNumber,
  IsPositive,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsString,
} from 'class-validator';
import { TransactionType } from '../../../common/enums/transaction-type.enum';
import { PaymentMethod } from '../../../common/enums/payment-method.enum';

export class CreateTransactionDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  category_id?: number;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsDateString()
  transaction_date!: string;

  @IsEnum(TransactionType)
  transaction_type!: TransactionType;

  @IsOptional()
  @IsEnum(PaymentMethod)
  payment_method?: PaymentMethod;

  @IsOptional()
  @IsBoolean()
  is_recurring?: boolean;

  @IsOptional()
  @IsInt()
  @IsPositive()
  recurrence_parent_id?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  billing_cycle_ref?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  receipt_url?: string;
}
