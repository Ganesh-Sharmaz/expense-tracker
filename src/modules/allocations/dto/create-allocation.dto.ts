import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { AllocationType } from '../../../common/enums/allocation-type.enum';

export class CreateAllocationDto {
  @IsEnum(AllocationType)
  allocation_type!: AllocationType;

  // Percentage is source of truth — amount auto-calculated from income
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
