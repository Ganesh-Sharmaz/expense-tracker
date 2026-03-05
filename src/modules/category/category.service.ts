import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { BaseService } from '../../common/services/base.service';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryType } from '../../common/enums/category-type.enum';
import { AllocationType } from '../../common/enums/allocation-type.enum';

// Explicit type that allows null for category_type
type SeedCategory = Omit<
  CreateCategoryDto,
  'parent_category_id' | 'category_type'
> & {
  category_type: CategoryType | null;
};

const DEFAULT_CATEGORIES: SeedCategory[] = [
  {
    name: 'Medical',
    category_type: CategoryType.MANDATORY,
    allocation_type: AllocationType.EXPENSES,
    icon: '🏥',
    color: '#FF5733',
  },
  {
    name: 'Electricity',
    category_type: CategoryType.MANDATORY,
    allocation_type: AllocationType.EXPENSES,
    icon: '⚡',
    color: '#FFC300',
  },
  {
    name: 'LPG Gas',
    category_type: CategoryType.MANDATORY,
    allocation_type: AllocationType.EXPENSES,
    icon: '🔥',
    color: '#FF6B6B',
  },
  {
    name: 'Petrol',
    category_type: CategoryType.MANDATORY,
    allocation_type: AllocationType.EXPENSES,
    icon: '⛽',
    color: '#C70039',
  },
  {
    name: 'WiFi',
    category_type: CategoryType.MANDATORY,
    allocation_type: AllocationType.EXPENSES,
    icon: '📶',
    color: '#1A73E8',
  },
  {
    name: 'Gym',
    category_type: CategoryType.NON_MANDATORY,
    allocation_type: AllocationType.EXPENSES,
    icon: '💪',
    color: '#28B463',
  },
  {
    name: 'Diet',
    category_type: CategoryType.NON_MANDATORY,
    allocation_type: AllocationType.EXPENSES,
    icon: '🥗',
    color: '#52BE80',
  },
  {
    name: 'Casual Food',
    category_type: CategoryType.NON_MANDATORY,
    allocation_type: AllocationType.EXPENSES,
    icon: '🍔',
    color: '#F39C12',
  },
  {
    name: 'Clothing',
    category_type: CategoryType.NON_MANDATORY,
    allocation_type: AllocationType.EXPENSES,
    icon: '👕',
    color: '#8E44AD',
  },
  {
    name: 'Parents',
    category_type: null,
    allocation_type: AllocationType.FIXED_CUT,
    icon: '👨‍👩‍👧',
    color: '#E74C3C',
  },
  {
    name: 'Savings',
    category_type: null,
    allocation_type: AllocationType.SAVINGS,
    icon: '💰',
    color: '#2ECC71',
  },
  {
    name: 'Investment',
    category_type: null,
    allocation_type: AllocationType.SAVINGS,
    icon: '📈',
    color: '#3498DB',
  },
];

@Injectable()
export class CategoryService extends BaseService<Category> {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {
    super(categoryRepository);
  }

  async seedForUser(userId: number): Promise<void> {
    const existing = await this.categoryRepository.count({
      where: { user_id: userId },
    });
    if (existing > 0) return;

    const categories = DEFAULT_CATEGORIES.map((cat) =>
      this.categoryRepository.create({
        ...cat,
        user_id: userId,
      } as unknown as Category),
    );
    await this.categoryRepository.save(categories);
  }

  async createCategory(
    userId: number,
    dto: CreateCategoryDto,
  ): Promise<Category> {
    if (dto.parent_category_id) {
      const parent = await this.categoryRepository.findOne({
        where: { id: dto.parent_category_id, user_id: userId },
      });
      if (!parent) throw new NotFoundException('Parent category not found');
      if (!dto.allocation_type) dto.allocation_type = parent.allocation_type;
    }

    const category = this.categoryRepository.create({
      ...dto,
      user_id: userId,
    } as unknown as Category);
    return this.categoryRepository.save(category);
  }

  async getTree(userId: number): Promise<Category[]> {
    const topLevel = await this.categoryRepository.find({
      where: { user_id: userId, parent_category_id: IsNull() },
      order: { allocation_type: 'ASC', name: 'ASC' },
    });

    const tree = await Promise.all(
      topLevel.map(async (cat) => {
        cat.children = await this.categoryRepository.find({
          where: { user_id: userId, parent_category_id: cat.id },
          order: { name: 'ASC' },
        });
        return cat;
      }),
    );

    return tree;
  }

  findAllForUser(userId: number): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { user_id: userId, is_active: true },
      order: { allocation_type: 'ASC', name: 'ASC' },
    });
  }

  async findOneForUser(userId: number, id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, user_id: userId },
      relations: ['children', 'parent'],
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async updateCategory(
    userId: number,
    id: number,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOneForUser(userId, id);

    if (
      dto.parent_category_id &&
      dto.parent_category_id !== category.parent_category_id
    ) {
      const parent = await this.categoryRepository.findOne({
        where: { id: dto.parent_category_id, user_id: userId },
      });
      if (!parent) throw new NotFoundException('Parent category not found');
      if (dto.parent_category_id === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }
    }

    Object.assign(category, dto);
    return this.categoryRepository.save(category);
  }

  async deactivateCategory(userId: number, id: number): Promise<Category> {
    const category = await this.findOneForUser(userId, id);
    category.is_active = false;
    return this.categoryRepository.save(category);
  }

  async removeCategory(
    userId: number,
    id: number,
  ): Promise<{ deleted: boolean; id: number }> {
    const result = await this.categoryRepository.delete({
      id,
      user_id: userId,
    });
    if (!result.affected) throw new NotFoundException('Category not found');
    return { deleted: true, id };
  }
}
