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
import { SettleAccrualDto } from './dto/settle-accural.dto';
import { PeriodicAccrualService } from './periodic-accural.service';

@Controller('periodic-accruals')
export class PeriodicAccrualController {
  constructor(
    private readonly periodicAccrualService: PeriodicAccrualService,
  ) {}

  // ⚠️ All static routes MUST come before :id routes
  // otherwise NestJS matches 'accrue', 'month', 'unsettled' as :id params

  // POST /api/periodic-accruals/accrue?month=3&year=2026
  @Post('accrue')
  accrueForMonth(
    @CurrentUser() user: AuthUser,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.periodicAccrualService.accrueForMonth(user.id, month, year);
  }

  // GET /api/periodic-accruals/month?month=3&year=2026
  @Get('month')
  findByMonth(
    @CurrentUser() user: AuthUser,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.periodicAccrualService.findByMonth(user.id, month, year);
  }

  // GET /api/periodic-accruals/unsettled
  @Get('unsettled')
  findUnsettled(@CurrentUser() user: AuthUser) {
    return this.periodicAccrualService.findUnsettled(user.id);
  }

  // GET /api/periodic-accruals/:id  ← wildcard, always last
  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.periodicAccrualService.findOneForUser(user.id, id);
  }

  // PATCH /api/periodic-accruals/:id/settle
  @Patch(':id/settle')
  settle(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SettleAccrualDto,
  ) {
    return this.periodicAccrualService.settle(user.id, id, dto);
  }

  // PATCH /api/periodic-accruals/:id/unsettle
  @Patch(':id/unsettle')
  unsettle(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.periodicAccrualService.unsettle(user.id, id);
  }

  // DELETE /api/periodic-accruals/:id
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.periodicAccrualService.removeAccrual(user.id, id);
  }
}
