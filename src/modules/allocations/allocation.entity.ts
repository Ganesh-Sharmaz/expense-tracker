import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AppBaseEntity } from '../../common/entities/base.entity';
import { AllocationType } from '../../common/enums/allocation-type.enum';
import { IncomeEntry } from '../income/income.entity';
import { User } from '../users/user.entity';

@Entity('allocations')
export class Allocation extends AppBaseEntity {
  // Every record is scoped to a user — never query without this
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  user_id!: number;

  @ManyToOne(() => IncomeEntry, (income) => income.allocations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'income_entry_id' })
  incomeEntry!: IncomeEntry;

  @Column({ name: 'income_entry_id' })
  income_entry_id!: number;

  @Column({ type: 'enum', enum: AllocationType })
  allocation_type!: AllocationType;

  // Percentage is the source of truth — amount is always derived
  @Column('decimal', { precision: 5, scale: 2 })
  percentage!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount!: number;

  @Column({ nullable: true, type: 'text' })
  notes!: string;
}
