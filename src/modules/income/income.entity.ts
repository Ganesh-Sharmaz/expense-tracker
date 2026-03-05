import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { AppBaseEntity } from '../../common/entities/base.entity';
import { Allocation } from '../allocations/allocation.entity';
import { User } from '../users/user.entity';

@Entity('income_entries')
export class IncomeEntry extends AppBaseEntity {
  @ManyToOne(() => User, (user) => user.incomeEntries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  user_id!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'date' })
  received_on!: Date;

  @Column({ nullable: true, type: 'text' })
  notes!: string;

  @OneToMany(() => Allocation, (allocation) => allocation.incomeEntry, {
    cascade: true,
  })
  allocations!: Allocation[];
}
