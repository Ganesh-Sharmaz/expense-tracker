import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  // POST /api/transactions
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTransactionDto) {
    return this.transactionService.createTransaction(user.id, dto);
  }

  // GET /api/transactions?month=3&year=2026&transaction_type=expense&page=1&limit=20
  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() filters: FilterTransactionDto,
  ) {
    return this.transactionService.findAllForUser(user.id, filters);
  }

  // GET /api/transactions/summary?month=3&year=2026
  @Get('summary')
  getMonthlySummary(
    @CurrentUser() user: AuthUser,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.transactionService.getMonthlySummary(user.id, month, year);
  }

  // GET /api/transactions/breakdown?month=3&year=2026
  @Get('breakdown')
  getCategoryBreakdown(
    @CurrentUser() user: AuthUser,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.transactionService.getCategoryBreakdown(user.id, month, year);
  }

  // GET /api/transactions/:id
  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.transactionService.findOneForUser(user.id, id);
  }

  // PATCH /api/transactions/:id
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionService.updateTransaction(user.id, id, dto);
  }

  // DELETE /api/transactions/:id
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.transactionService.removeTransaction(user.id, id);
  }
}
