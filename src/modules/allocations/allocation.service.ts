import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common/services/base.service';
import { Allocation } from './allocation.entity';
import { IncomeEntry } from '../income/income.entity';
import { AllocationType } from '../../common/enums/allocation-type.enum';
import { UpdateAllocationDto } from './dto/update-allocation.dto';
import { CreateAllocationDto } from './dto/create-allocation.dto';

// The 3 required allocation types — every income entry must have all 3
const REQUIRED_TYPES = [
  AllocationType.FIXED_CUT,
  AllocationType.EXPENSES,
  AllocationType.SAVINGS,
];

@Injectable()
export class AllocationService extends BaseService<Allocation> {
  constructor(
    @InjectRepository(Allocation)
    private readonly allocationRepository: Repository<Allocation>,
    @InjectRepository(IncomeEntry)
    private readonly incomeRepository: Repository<IncomeEntry>,
  ) {
    super(allocationRepository);
  }

  // -------------------------------------------------------------------
  // Create allocations for an income entry
  // Accepts exactly 3 DTOs (one per envelope), validates they sum to 100%
  // -------------------------------------------------------------------
  async createForIncome(
    userId: number,
    incomeId: number,
    dtos: CreateAllocationDto[],
  ): Promise<Allocation[]> {
    // 1. Verify income belongs to this user
    const income = await this.incomeRepository.findOne({
      where: { id: incomeId, user_id: userId },
    });
    if (!income) throw new NotFoundException('Income entry not found');

    // 2. Validate exactly 3 allocations — one per type
    const types = dtos.map((d) => d.allocation_type);
    const missingTypes = REQUIRED_TYPES.filter((t) => !types.includes(t));
    if (missingTypes.length > 0) {
      throw new BadRequestException(
        `Missing allocation types: ${missingTypes.join(', ')}`,
      );
    }

    // 3. Validate percentages sum to 100
    const total = dtos.reduce((sum, d) => sum + Number(d.percentage), 0);
    if (Math.round(total) !== 100) {
      throw new BadRequestException(
        `Allocation percentages must sum to 100. Got ${total}`,
      );
    }

    // 4. Delete existing allocations for this income (allow re-allocation)
    await this.allocationRepository.delete({
      income_entry_id: incomeId,
      user_id: userId,
    });

    // 5. Derive amount from percentage + income amount, then save
    const allocations = dtos.map((dto) =>
      this.allocationRepository.create({
        ...dto,
        user_id: userId,
        income_entry_id: incomeId,
        amount: Number(
          ((Number(dto.percentage) / 100) * Number(income.amount)).toFixed(2),
        ),
      }),
    );

    return this.allocationRepository.save(allocations);
  }

  // -------------------------------------------------------------------
  // Get all allocations for a specific income entry — user scoped
  // -------------------------------------------------------------------
  findByIncome(userId: number, incomeId: number): Promise<Allocation[]> {
    return this.allocationRepository.find({
      where: { income_entry_id: incomeId, user_id: userId },
      order: { allocation_type: 'ASC' },
    });
  }

  // -------------------------------------------------------------------
  // Get all allocations for a user across all income entries
  // -------------------------------------------------------------------
  findAllForUser(userId: number): Promise<Allocation[]> {
    return this.allocationRepository.find({
      where: { user_id: userId },
      relations: ['incomeEntry'],
      order: { created_at: 'DESC' },
    });
  }

  // -------------------------------------------------------------------
  // Update a single allocation — user scoped, recalculates amount
  // -------------------------------------------------------------------
  async updateAllocation(
    userId: number,
    id: number,
    dto: UpdateAllocationDto,
  ): Promise<Allocation> {
    // Fetch with user scope — safe, no separate ownership check needed
    const allocation = await this.allocationRepository.findOne({
      where: { id, user_id: userId },
      relations: ['incomeEntry'],
    });
    if (!allocation) throw new NotFoundException('Allocation not found');

    Object.assign(allocation, dto);

    // Recalculate amount if percentage changed
    if (dto.percentage !== undefined) {
      allocation.amount = Number(
        (
          (Number(dto.percentage) / 100) *
          Number(allocation.incomeEntry.amount)
        ).toFixed(2),
      );
    }

    return this.allocationRepository.save(allocation);
  }

  // -------------------------------------------------------------------
  // Delete — user scoped via delete({ id, user_id })
  // -------------------------------------------------------------------
  async removeAllocation(
    userId: number,
    id: number,
  ): Promise<{ deleted: boolean; id: number }> {
    const result = await this.allocationRepository.delete({
      id,
      user_id: userId,
    });
    if (!result.affected) throw new NotFoundException('Allocation not found');
    return { deleted: true, id };
  }
}
