import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { AllocationType } from '../../common/enums/allocation-type.enum';
import { IncomeEntry } from '../income/income.entity';

@Entity('allocations')
export class Allocation extends BaseEntity {
  @ManyToOne(() => IncomeEntry, (income) => income.allocations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'income_entry_id' })
  incomeEntry!: IncomeEntry;

  @Column({ name: 'income_entry_id' })
  income_entry_id!: number;

  @Column({ type: 'enum', enum: AllocationType })
  allocation_type!: AllocationType;

  @Column('decimal', { precision: 5, scale: 2 })
  percentage!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount!: number;

  @Column({ nullable: true, type: 'text' })
  notes!: string;
}
