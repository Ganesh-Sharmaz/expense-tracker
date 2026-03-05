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
import { CreateBudgetRuleDto } from './dto/create-budget-rule.dto';
import { UpdateBudgetRuleDto } from './dto/update-budget-rule.dto';
import { BudgetRuleService } from './budget-rule.service';

@Controller('budget-rules')
export class BudgetRuleController {
  constructor(private readonly budgetRuleService: BudgetRuleService) {}

  // POST /api/budget-rules
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBudgetRuleDto) {
    return this.budgetRuleService.createBudgetRule(user.id, dto);
  }

  // GET /api/budget-rules
  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.budgetRuleService.findAllForUser(user.id);
  }

  // GET /api/budget-rules/:id
  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.budgetRuleService.findOneForUser(user.id, id);
  }

  // GET /api/budget-rules/category/:categoryId
  @Get('category/:categoryId')
  findByCategory(
    @CurrentUser() user: AuthUser,
    @Param('categoryId', ParseIntPipe) categoryId: number,
  ) {
    return this.budgetRuleService.findByCategory(user.id, categoryId);
  }

  // PATCH /api/budget-rules/:id
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBudgetRuleDto,
  ) {
    return this.budgetRuleService.updateBudgetRule(user.id, id, dto);
  }

  // PATCH /api/budget-rules/:id/deactivate
  @Patch(':id/deactivate')
  deactivate(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.budgetRuleService.deactivateBudgetRule(user.id, id);
  }

  // DELETE /api/budget-rules/:id
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.budgetRuleService.removeBudgetRule(user.id, id);
  }
}
