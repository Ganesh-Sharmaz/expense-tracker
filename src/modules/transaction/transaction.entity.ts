import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AppBaseEntity } from '../../common/entities/base.entity';
import { User } from '../users/user.entity';
import { TransactionType } from '../../common/enums/transaction-type.enum';
import { PaymentMethod } from '../../common/enums/payment-method.enum';
import { Category } from '../category/category.entity';

@Entity('transactions')
export class Transaction extends AppBaseEntity {
  // Every record scoped to a user
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  user_id!: number;

  @ManyToOne(() => Category, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @Column({ nullable: true })
  category_id!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'date' })
  transaction_date!: Date;

  @Column({ type: 'enum', enum: TransactionType })
  transaction_type!: TransactionType;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.UPI,
  })
  payment_method!: PaymentMethod;

  @Column({ default: false })
  is_recurring!: boolean;

  // Points to parent transaction if part of a recurring chain
  @Column({ nullable: true })
  recurrence_parent_id!: number;

  // Which budget_rule billing cycle this transaction settles
  @Column({ nullable: true })
  billing_cycle_ref!: number;

  @Column({ nullable: true, type: 'text' })
  notes!: string;

  @Column({ nullable: true })
  receipt_url!: string;
}
