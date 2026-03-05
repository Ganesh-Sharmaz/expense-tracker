import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { AppBaseEntity } from '../../common/entities/base.entity';
import { CategoryType } from '../../common/enums/category-type.enum';
import { AllocationType } from '../../common/enums/allocation-type.enum';
import { User } from '../users/user.entity';

@Entity('categories')
export class Category extends AppBaseEntity {
  // Every record scoped to a user
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  user_id!: number;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: CategoryType, nullable: true })
  category_type!: CategoryType;

  // Which envelope this category draws from
  @Column({
    type: 'enum',
    enum: AllocationType,
    default: AllocationType.EXPENSES,
  })
  allocation_type!: AllocationType;

  @Column({ nullable: true })
  icon!: string;

  @Column({ nullable: true })
  color!: string;

  @Column({ default: true })
  is_active!: boolean;

  // Self-referencing — parent is null for top-level categories
  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parent_category_id' })
  parent!: Category;

  @Column({ nullable: true })
  parent_category_id!: number;

  @OneToMany(() => Category, (category) => category.parent)
  children!: Category[];
}
