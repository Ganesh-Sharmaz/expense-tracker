import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AppBaseEntity } from '../../common/entities/base.entity';
import { User } from '../users/user.entity';
import { BudgetRule } from '../budget/budget-rule.entity';

@Entity('periodic_accruals')
export class PeriodicAccrual extends AppBaseEntity {
  // Every record scoped to a user
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  user_id!: number;

  @ManyToOne(() => BudgetRule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'budget_rule_id' })
  budgetRule!: BudgetRule;

  @Column({ name: 'budget_rule_id' })
  budget_rule_id!: number;

  @Column({ type: 'int' })
  month!: number;

  @Column({ type: 'int' })
  year!: number;

  // Running monthly slice accrued toward this bill
  // e.g. gym ₹500/month — this stores 500 per month row
  @Column('decimal', { precision: 10, scale: 2 })
  accrued_amount!: number;

  // True once the actual payment transaction is logged
  @Column({ default: false })
  is_settled!: boolean;

  // The transaction that settled this accrual
  @Column({ type: 'int', nullable: true })
  settled_transaction_id!: number | null;
}
