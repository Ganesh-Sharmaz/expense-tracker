import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncomeEntry } from './income.entity';
import { IncomeService } from './income.service';
import { IncomeController } from './income.controller';

@Module({
  imports: [TypeOrmModule.forFeature([IncomeEntry])],
  controllers: [IncomeController],
  providers: [IncomeService],
  exports: [IncomeService], // exported so AllocationModule can use it later
})
export class IncomeModule {}
