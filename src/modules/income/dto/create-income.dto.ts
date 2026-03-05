import {
  IsNumber,
  IsPositive,
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateIncomeDto {
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsDateString()
  received_on!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
