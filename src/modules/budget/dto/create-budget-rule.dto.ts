import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export class CreateBudgetRuleDto {
  @IsInt()
  @IsPositive()
  category_id!: number;

  // The actual bill amount e.g. ₹2000 for gym
  @IsNumber()
  @IsPositive()
  actual_period_amount!: number;

  // How many months between payments: 1, 2, 3, 4, 6, 12
  @IsInt()
  @Min(1)
  @Max(12)
  billing_cycle_months!: number;

  // How much you expect to spend per cycle (can be less than actual_period_amount)
  @IsNumber()
  @IsPositive()
  expected_spend!: number;

  // Buffer to hold back — defaults to 0
  @IsOptional()
  @IsNumber()
  @Min(0)
  expected_saved?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
