import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsInt,
  IsPositive,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CategoryType } from '../../../common/enums/category-type.enum';
import { AllocationType } from '../../../common/enums/allocation-type.enum';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;

  // Nullable — fixed_cut and savings categories don't have a type
  @IsOptional()
  @Transform(
    ({ value }: { value: CategoryType | null | undefined }) => value ?? null,
  )
  @IsEnum(CategoryType)
  category_type?: CategoryType | null;

  @IsOptional()
  @IsEnum(AllocationType)
  allocation_type?: AllocationType;

  @IsOptional()
  @IsInt()
  @IsPositive()
  parent_category_id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  icon?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  color?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
