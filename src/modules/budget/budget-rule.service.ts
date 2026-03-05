import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common/services/base.service';
import { BudgetRule } from './budget-rule.entity';
import { CreateBudgetRuleDto } from './dto/create-budget-rule.dto';
import { UpdateBudgetRuleDto } from './dto/update-budget-rule.dto';
import { Category } from '../category/category.entity';

// Valid billing cycles — anything else is rejected
const VALID_CYCLES = [1, 2, 3, 4, 6, 12];

@Injectable()
export class BudgetRuleService extends BaseService<BudgetRule> {
  constructor(
    @InjectRepository(BudgetRule)
    private readonly budgetRuleRepository: Repository<BudgetRule>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {
    super(budgetRuleRepository);
  }

  // -------------------------------------------------------------------
  // Create — validates category ownership, derives monthly_equivalent
  // -------------------------------------------------------------------
  async createBudgetRule(
    userId: number,
    dto: CreateBudgetRuleDto,
  ): Promise<BudgetRule> {
    // Validate billing cycle is one of the allowed values
    if (!VALID_CYCLES.includes(dto.billing_cycle_months)) {
      throw new BadRequestException(
        `billing_cycle_months must be one of: ${VALID_CYCLES.join(', ')}`,
      );
    }

    // Verify category belongs to this user
    const category = await this.categoryRepository.findOne({
      where: { id: dto.category_id, user_id: userId },
    });
    if (!category) throw new NotFoundException('Category not found');

    // One budget rule per category — update if exists, create if not
    const existing = await this.budgetRuleRepository.findOne({
      where: { category_id: dto.category_id, user_id: userId },
    });
    if (existing) {
      throw new BadRequestException(
        'A budget rule already exists for this category. Use PATCH to update it.',
      );
    }

    // Derive monthly equivalent — the key field for dashboard normalization
    const monthly_equivalent_amount = this.calcMonthlyEquivalent(
      dto.actual_period_amount,
      dto.billing_cycle_months,
    );

    const rule = this.budgetRuleRepository.create({
      ...dto,
      user_id: userId,
      monthly_equivalent_amount,
      expected_saved: dto.expected_saved ?? 0,
    } as unknown as BudgetRule);

    return this.budgetRuleRepository.save(rule);
  }

  // -------------------------------------------------------------------
  // Get all for user — with category joined for context
  // -------------------------------------------------------------------
  findAllForUser(userId: number): Promise<BudgetRule[]> {
    return this.budgetRuleRepository.find({
      where: { user_id: userId, is_active: true },
      relations: ['category'],
      order: { created_at: 'DESC' },
    });
  }

  // -------------------------------------------------------------------
  // Get by category — user scoped
  // -------------------------------------------------------------------
  async findByCategory(
    userId: number,
    categoryId: number,
  ): Promise<BudgetRule> {
    const rule = await this.budgetRuleRepository.findOne({
      where: { category_id: categoryId, user_id: userId },
      relations: ['category'],
    });
    if (!rule) throw new NotFoundException('Budget rule not found');
    return rule;
  }

  // -------------------------------------------------------------------
  // Get one by id — user scoped
  // -------------------------------------------------------------------
  async findOneForUser(userId: number, id: number): Promise<BudgetRule> {
    const rule = await this.budgetRuleRepository.findOne({
      where: { id, user_id: userId },
      relations: ['category'],
    });
    if (!rule) throw new NotFoundException('Budget rule not found');
    return rule;
  }

  // -------------------------------------------------------------------
  // Update — recalculates monthly_equivalent if amount or cycle changes
  // -------------------------------------------------------------------
  async updateBudgetRule(
    userId: number,
    id: number,
    dto: UpdateBudgetRuleDto,
  ): Promise<BudgetRule> {
    const rule = await this.findOneForUser(userId, id);

    // Validate billing cycle if being changed
    if (
      dto.billing_cycle_months &&
      !VALID_CYCLES.includes(dto.billing_cycle_months)
    ) {
      throw new BadRequestException(
        `billing_cycle_months must be one of: ${VALID_CYCLES.join(', ')}`,
      );
    }

    // If category is changing, verify new category belongs to user
    if (dto.category_id && dto.category_id !== rule.category_id) {
      const category = await this.categoryRepository.findOne({
        where: { id: dto.category_id, user_id: userId },
      });
      if (!category) throw new NotFoundException('Category not found');

      // Check no other rule exists for the new category
      const existing = await this.budgetRuleRepository.findOne({
        where: { category_id: dto.category_id, user_id: userId },
      });
      if (existing) {
        throw new BadRequestException(
          'A budget rule already exists for this category.',
        );
      }
    }

    Object.assign(rule, dto);

    // Recalculate monthly equivalent whenever amount or cycle changes
    const amount = dto.actual_period_amount ?? rule.actual_period_amount;
    const cycle = dto.billing_cycle_months ?? rule.billing_cycle_months;
    rule.monthly_equivalent_amount = this.calcMonthlyEquivalent(
      Number(amount),
      Number(cycle),
    );

    return this.budgetRuleRepository.save(rule);
  }

  // -------------------------------------------------------------------
  // Soft delete via is_active
  // -------------------------------------------------------------------
  async deactivateBudgetRule(userId: number, id: number): Promise<BudgetRule> {
    const rule = await this.findOneForUser(userId, id);
    rule.is_active = false;
    return this.budgetRuleRepository.save(rule);
  }

  // -------------------------------------------------------------------
  // Hard delete — user scoped
  // -------------------------------------------------------------------
  async removeBudgetRule(
    userId: number,
    id: number,
  ): Promise<{ deleted: boolean; id: number }> {
    const result = await this.budgetRuleRepository.delete({
      id,
      user_id: userId,
    });
    if (!result.affected) throw new NotFoundException('Budget rule not found');
    return { deleted: true, id };
  }

  // -------------------------------------------------------------------
  // Helper — derives monthly equivalent from period amount + cycle
  // e.g. ₹2000 gym every 4 months = ₹500/month
  // -------------------------------------------------------------------
  getMonthlyEquivalent(userId: number, id: number): Promise<BudgetRule> {
    return this.findOneForUser(userId, id);
  }

  private calcMonthlyEquivalent(
    periodAmount: number,
    cycleMonths: number,
  ): number {
    return Number((periodAmount / cycleMonths).toFixed(2));
  }
}
