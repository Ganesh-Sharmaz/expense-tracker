import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { IncomeService } from './income.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';

@Controller('income')
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) {}

  // POST /api/income
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateIncomeDto) {
    return this.incomeService.createIncome(user.id, dto);
  }

  // GET /api/income
  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.incomeService.findAllWithAllocationsForUser(user.id);
  }

  // GET /api/income/:id
  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.incomeService.findWithAllocationsForUser(user.id, id);
  }

  // PATCH /api/income/:id
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIncomeDto,
  ) {
    return this.incomeService.updateIncome(user.id, id, dto);
  }

  // DELETE /api/income/:id
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.incomeService.removeIncome(user.id, id);
  }
}
