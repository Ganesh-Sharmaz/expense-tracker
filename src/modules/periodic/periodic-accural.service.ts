import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common/services/base.service';
import { Transaction } from '../transaction/transaction.entity';
import { PeriodicAccrual } from './periodic-accural.entity';
import { BudgetRule } from '../budget/budget-rule.entity';
import { SettleAccrualDto } from './dto/settle-accural.dto';

@Injectable()
export class PeriodicAccrualService extends BaseService<PeriodicAccrual> {
  constructor(
    @InjectRepository(PeriodicAccrual)
    private readonly accrualRepository: Repository<PeriodicAccrual>,
    @InjectRepository(BudgetRule)
    private readonly budgetRuleRepository: Repository<BudgetRule>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {
    super(accrualRepository);
  }

  // -------------------------------------------------------------------
  // Accrue for a month — creates one row per active periodic budget rule
  // Call this at the start of each month
  // -------------------------------------------------------------------
  async accrueForMonth(
    userId: number,
    month: number,
    year: number,
  ): Promise<PeriodicAccrual[]> {
    // Get all active budget rules that are NOT monthly (cycle > 1)
    const periodicRules = await this.budgetRuleRepository.find({
      where: { user_id: userId, is_active: true },
      relations: ['category'],
    });

    const nonMonthlyRules = periodicRules.filter(
      (r) => r.billing_cycle_months > 1,
    );

    if (nonMonthlyRules.length === 0) return [];

    const results: PeriodicAccrual[] = [];

    for (const rule of nonMonthlyRules) {
      // Skip if accrual already exists for this rule+month+year
      const existing = await this.accrualRepository.findOne({
        where: {
          budget_rule_id: rule.id,
          user_id: userId,
          month,
          year,
        },
      });
      if (existing) {
        results.push(existing);
        continue;
      }

      // Create accrual row with the monthly equivalent slice
      const accrual = this.accrualRepository.create({
        user_id: userId,
        budget_rule_id: rule.id,
        month,
        year,
        accrued_amount: Number(rule.monthly_equivalent_amount),
        is_settled: false,
      } as unknown as PeriodicAccrual);

      results.push(await this.accrualRepository.save(accrual));
    }

    return results;
  }

  // -------------------------------------------------------------------
  // Get all accruals for a month — user scoped with budget rule joined
  // -------------------------------------------------------------------
  findByMonth(
    userId: number,
    month: number,
    year: number,
  ): Promise<PeriodicAccrual[]> {
    return this.accrualRepository.find({
      where: { user_id: userId, month, year },
      relations: ['budgetRule', 'budgetRule.category'],
      order: { is_settled: 'ASC', created_at: 'ASC' },
    });
  }

  // -------------------------------------------------------------------
  // Get unsettled accruals — shows what bills are still pending
  // -------------------------------------------------------------------
  findUnsettled(userId: number): Promise<PeriodicAccrual[]> {
    return this.accrualRepository.find({
      where: { user_id: userId, is_settled: false },
      relations: ['budgetRule', 'budgetRule.category'],
      order: { year: 'DESC', month: 'DESC' },
    });
  }

  // -------------------------------------------------------------------
  // Get one — user scoped
  // -------------------------------------------------------------------
  async findOneForUser(userId: number, id: number): Promise<PeriodicAccrual> {
    const accrual = await this.accrualRepository.findOne({
      where: { id, user_id: userId },
      relations: ['budgetRule', 'budgetRule.category'],
    });
    if (!accrual) throw new NotFoundException('Periodic accrual not found');
    return accrual;
  }

  // -------------------------------------------------------------------
  // Settle — marks accrual as paid, links to the actual transaction
  // -------------------------------------------------------------------
  async settle(
    userId: number,
    id: number,
    dto: SettleAccrualDto,
  ): Promise<PeriodicAccrual> {
    const accrual = await this.findOneForUser(userId, id);

    if (accrual.is_settled) {
      throw new BadRequestException('Accrual is already settled');
    }

    // Verify the transaction belongs to this user
    const transaction = await this.transactionRepository.findOne({
      where: { id: dto.settled_transaction_id, user_id: userId },
    });
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    accrual.is_settled = true;
    accrual.settled_transaction_id = dto.settled_transaction_id;

    return this.accrualRepository.save(accrual);
  }

  // -------------------------------------------------------------------
  // Unsettle — reverses a settlement if transaction was logged incorrectly
  // -------------------------------------------------------------------
  async unsettle(userId: number, id: number): Promise<PeriodicAccrual> {
    const accrual = await this.findOneForUser(userId, id);

    if (!accrual.is_settled) {
      throw new BadRequestException('Accrual is not settled');
    }

    accrual.is_settled = false;
    accrual.settled_transaction_id = null;

    return this.accrualRepository.save(accrual);
  }

  // -------------------------------------------------------------------
  // Delete — user scoped single DB call
  // -------------------------------------------------------------------
  async removeAccrual(
    userId: number,
    id: number,
  ): Promise<{ deleted: boolean; id: number }> {
    const result = await this.accrualRepository.delete({
      id,
      user_id: userId,
    });
    if (!result.affected) {
      throw new NotFoundException('Periodic accrual not found');
    }
    return { deleted: true, id };
  }

  // -------------------------------------------------------------------
  // Total accrued for a month — used by Snapshot in Chunk 9
  // Returns sum of all monthly_equivalent_amounts for the month
  // -------------------------------------------------------------------
  async getTotalAccruedForMonth(
    userId: number,
    month: number,
    year: number,
  ): Promise<number> {
    const accruals = await this.findByMonth(userId, month, year);
    const total = accruals.reduce(
      (sum, a) => sum + Number(a.accrued_amount),
      0,
    );
    return Number(total.toFixed(2));
  }
}
