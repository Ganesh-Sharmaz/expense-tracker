import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AppBaseEntity } from '../../common/entities/base.entity';
import { User } from '../users/user.entity';
import { Category } from '../category/category.entity';

@Entity('budget_rules')
export class BudgetRule extends AppBaseEntity {
  // Every record scoped to a user
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  user_id!: number;

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @Column({ name: 'category_id' })
  category_id!: number;

  // The real amount paid when the bill hits e.g. ₹2000 gym every 4 months
  @Column('decimal', { precision: 10, scale: 2 })
  actual_period_amount!: number;

  // 1=monthly, 2=bi-monthly, 3=quarterly, 4, 6, 12
  @Column({ type: 'int', default: 1 })
  billing_cycle_months!: number;

  // Derived: actual_period_amount / billing_cycle_months
  // e.g. ₹2000 / 4 = ₹500/month — stored for fast dashboard queries
  @Column('decimal', { precision: 10, scale: 2 })
  monthly_equivalent_amount!: number;

  // How much you expect to spend per cycle
  @Column('decimal', { precision: 10, scale: 2 })
  expected_spend!: number;

  // Buffer you want to hold back within the envelope
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  expected_saved!: number;

  @Column({ default: true })
  is_active!: boolean;

  @Column({ nullable: true, type: 'text' })
  notes!: string;
}
