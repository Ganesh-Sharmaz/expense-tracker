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
import { AllocationService } from './allocation.service';
import { CreateAllocationDto } from './dto/create-allocation.dto';
import { UpdateAllocationDto } from './dto/update-allocation.dto';

@Controller('allocations')
export class AllocationController {
  constructor(private readonly allocationService: AllocationService) {}

  // POST /api/allocations/income/:incomeId
  // Body: array of 3 allocations [ { allocation_type, percentage }, ... ]
  @Post('income/:incomeId')
  createForIncome(
    @CurrentUser() user: AuthUser,
    @Param('incomeId', ParseIntPipe) incomeId: number,
    @Body() dtos: CreateAllocationDto[],
  ) {
    return this.allocationService.createForIncome(user.id, incomeId, dtos);
  }

  // GET /api/allocations
  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.allocationService.findAllForUser(user.id);
  }

  // GET /api/allocations/income/:incomeId
  @Get('income/:incomeId')
  findByIncome(
    @CurrentUser() user: AuthUser,
    @Param('incomeId', ParseIntPipe) incomeId: number,
  ) {
    return this.allocationService.findByIncome(user.id, incomeId);
  }

  // PATCH /api/allocations/:id
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAllocationDto,
  ) {
    return this.allocationService.updateAllocation(user.id, id, dto);
  }

  // DELETE /api/allocations/:id
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.allocationService.removeAllocation(user.id, id);
  }
}
