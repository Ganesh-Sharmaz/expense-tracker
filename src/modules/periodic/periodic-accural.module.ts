import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetRule } from '../budget/budget-rule.entity';
import { PeriodicAccrualController } from './periodic-accural.controller';
import { PeriodicAccrual } from './periodic-accural.entity';
import { PeriodicAccrualService } from './periodic-accural.service';
import { Transaction } from '../transaction/transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PeriodicAccrual, BudgetRule, Transaction]),
  ],
  controllers: [PeriodicAccrualController],
  providers: [PeriodicAccrualService],
  exports: [PeriodicAccrualService], // exported for Snapshot module
})
export class PeriodicAccrualModule {}
