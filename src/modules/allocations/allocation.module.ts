import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Allocation } from './allocation.entity';
import { AllocationService } from './allocation.service';
import { AllocationController } from './allocation.controller';
import { IncomeEntry } from '../income/income.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Allocation, IncomeEntry])],
  controllers: [AllocationController],
  providers: [AllocationService],
  exports: [AllocationService],
})
export class AllocationModule {}
