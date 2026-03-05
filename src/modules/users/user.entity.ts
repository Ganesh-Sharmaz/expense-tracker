import { Entity, Column, OneToMany, BeforeInsert } from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { BaseEntity } from '../../common/entities/base.entity';
import { IncomeEntry } from '../income/income.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  username!: string;

  @Column()
  name!: string;

  @Column({ unique: true, nullable: true })
  email!: string;

  @Column()
  @Exclude() // never returned in API responses
  password!: string;

  @Column({ default: true })
  is_active!: boolean;

  // Hash password before insert
  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 12);
  }

  @OneToMany(() => IncomeEntry, (income) => income.user)
  incomeEntries: IncomeEntry[];
}
