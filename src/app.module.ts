import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { IncomeModule } from './modules/income/income.module';
import { UsersModule } from './modules/users/user.module';
import { JwtAuthGuard } from './modules/auth/gaurds/jwt-auth.guard';
import { AllocationModule } from './modules/allocations/allocation.module';
import { CategoryModule } from './modules/category/category.module';
import { BudgetRuleModule } from './modules/budget/budget-rule.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { EnvelopeTransferModule } from './modules/envelope/envelope-transfer.module';
import { PeriodicAccrualModule } from './modules/periodic/periodic-accural.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: databaseConfig,
    }),
    UsersModule,
    AuthModule,
    IncomeModule,
    AllocationModule,
    CategoryModule,
    BudgetRuleModule,
    TransactionModule,
    EnvelopeTransferModule,
    PeriodicAccrualModule,
    // SnapshotModule,         ← Chunk 9
  ],
  providers: [
    // Applies JwtAuthGuard to every route globally.
    // Use @Public() decorator on any route that should skip auth.
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
