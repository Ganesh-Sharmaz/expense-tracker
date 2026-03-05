import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AppBaseEntity } from '../../common/entities/base.entity';
import { User } from '../users/user.entity';
import { AllocationType } from '../../common/enums/allocation-type.enum';

@Entity('envelope_transfers')
export class EnvelopeTransfer extends AppBaseEntity {
  // Every record scoped to a user
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  user_id!: number;

  @Column({ type: 'enum', enum: AllocationType })
  from_allocation_type!: AllocationType;

  @Column({ type: 'enum', enum: AllocationType })
  to_allocation_type!: AllocationType;

  @Column('decimal', { precision: 10, scale: 2 })
  amount!: number;

  // Required — must explain why money moved between envelopes
  @Column({ type: 'text' })
  reason!: string;

  @Column({ type: 'date' })
  transfer_date!: Date;

  // Which budget month this transfer belongs to
  @Column({ type: 'int' })
  month!: number;

  @Column({ type: 'int' })
  year!: number;
}
