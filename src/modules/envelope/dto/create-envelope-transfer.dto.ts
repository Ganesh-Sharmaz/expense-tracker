import {
  IsEnum,
  IsNumber,
  IsPositive,
  IsString,
  IsNotEmpty,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AllocationType } from '../../../common/enums/allocation-type.enum';

export class CreateEnvelopeTransferDto {
  @IsEnum(AllocationType)
  from_allocation_type!: AllocationType;

  // No @ValidateIf — same-envelope check handled in service
  @IsEnum(AllocationType)
  to_allocation_type!: AllocationType;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount!: number;

  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsDateString()
  transfer_date!: string;

  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month!: number;

  @IsInt()
  @Min(2020)
  @Type(() => Number)
  year!: number;
}
