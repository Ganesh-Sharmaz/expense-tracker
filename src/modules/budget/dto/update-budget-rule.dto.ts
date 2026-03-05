import { PartialType } from '@nestjs/mapped-types';
import { CreateBudgetRuleDto } from './create-budget-rule.dto';

export class UpdateBudgetRuleDto extends PartialType(CreateBudgetRuleDto) {}
