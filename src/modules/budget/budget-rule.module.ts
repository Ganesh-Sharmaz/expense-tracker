import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetRule } from './budget-rule.entity';
import { BudgetRuleService } from './budget-rule.service';
import { BudgetRuleController } from './budget-rule.controller';
import { Category } from '../category/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BudgetRule, Category])],
  controllers: [BudgetRuleController],
  providers: [BudgetRuleService],
  exports: [BudgetRuleService], // exported for Snapshots module later
})
export class BudgetRuleModule {}
