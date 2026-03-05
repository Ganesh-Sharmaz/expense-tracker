import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { IncomeModule } from './modules/income/income.module';
import { UsersModule } from './modules/users/user.module';
import { JwtAuthGuard } from './modules/auth/gaurds/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: databaseConfig,
    }),
    UsersModule,
    AuthModule,
    IncomeModule,
    // AllocationModule,       ← Chunk 3
    // CategoryModule,         ← Chunk 4
    // BudgetRuleModule,       ← Chunk 5
    // TransactionModule,      ← Chunk 6
    // EnvelopeTransferModule, ← Chunk 7
    // PeriodicAccrualModule,  ← Chunk 8
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
