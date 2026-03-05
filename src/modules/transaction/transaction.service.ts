import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { BaseService } from '../../common/services/base.service';
import { Transaction } from './transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { TransactionType } from '../../common/enums/transaction-type.enum';
import { Category } from '../category/category.entity';

@Injectable()
export class TransactionService extends BaseService<Transaction> {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {
    super(transactionRepository);
  }

  // -------------------------------------------------------------------
  // Create — validates category ownership if provided
  // -------------------------------------------------------------------
  async createTransaction(
    userId: number,
    dto: CreateTransactionDto,
  ): Promise<Transaction> {
    // If category provided, verify it belongs to this user
    if (dto.category_id) {
      const category = await this.categoryRepository.findOne({
        where: { id: dto.category_id, user_id: userId },
      });
      if (!category) throw new NotFoundException('Category not found');
    }

    const transaction = this.transactionRepository.create({
      ...dto,
      user_id: userId,
      transaction_date: new Date(dto.transaction_date),
    } as unknown as Transaction);

    return this.transactionRepository.save(transaction);
  }

  // -------------------------------------------------------------------
  // Find all — user scoped with filters + pagination
  // -------------------------------------------------------------------
  async findAllForUser(
    userId: number,
    filters: FilterTransactionDto,
  ): Promise<{
    data: Transaction[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      month,
      year,
      transaction_type,
      category_id,
      page = 1,
      limit = 20,
    } = filters;

    const where: FindOptionsWhere<Transaction> = { user_id: userId };

    // Filter by transaction type if provided
    if (transaction_type) where.transaction_type = transaction_type;

    // Filter by category if provided
    if (category_id) where.category_id = category_id;

    // Filter by month+year range if provided
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0); // last day of month
      where.transaction_date = Between(start, end);
    } else if (year) {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      where.transaction_date = Between(start, end);
    }

    const [data, total] = await this.transactionRepository.findAndCount({
      where,
      relations: ['category'],
      order: { transaction_date: 'DESC', created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  // -------------------------------------------------------------------
  // Find one — user scoped
  // -------------------------------------------------------------------
  async findOneForUser(userId: number, id: number): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id, user_id: userId },
      relations: ['category'],
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }

  // -------------------------------------------------------------------
  // Update — user scoped fetch then save
  // -------------------------------------------------------------------
  async updateTransaction(
    userId: number,
    id: number,
    dto: UpdateTransactionDto,
  ): Promise<Transaction> {
    const transaction = await this.findOneForUser(userId, id);

    // If changing category, verify new category belongs to user
    if (dto.category_id && dto.category_id !== transaction.category_id) {
      const category = await this.categoryRepository.findOne({
        where: { id: dto.category_id, user_id: userId },
      });
      if (!category) throw new NotFoundException('Category not found');
    }

    Object.assign(transaction, dto);
    if (dto.transaction_date) {
      transaction.transaction_date = new Date(dto.transaction_date);
    }

    return this.transactionRepository.save(transaction);
  }

  // -------------------------------------------------------------------
  // Delete — user scoped single DB call
  // -------------------------------------------------------------------
  async removeTransaction(
    userId: number,
    id: number,
  ): Promise<{ deleted: boolean; id: number }> {
    const result = await this.transactionRepository.delete({
      id,
      user_id: userId,
    });
    if (!result.affected) throw new NotFoundException('Transaction not found');
    return { deleted: true, id };
  }

  // -------------------------------------------------------------------
  // Monthly summary — total spent per envelope type for a given month
  // Used by Snapshot module in Chunk 9
  // -------------------------------------------------------------------
  async getMonthlySummary(
    userId: number,
    month: number,
    year: number,
  ): Promise<Record<TransactionType, number>> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const transactions = await this.transactionRepository.find({
      where: {
        user_id: userId,
        transaction_date: Between(start, end),
      },
    });

    // Sum amounts grouped by transaction_type
    const summary = {
      [TransactionType.EXPENSE]: 0,
      [TransactionType.FIXED_CUT]: 0,
      [TransactionType.SAVINGS]: 0,
      [TransactionType.INVESTMENT]: 0,
    };

    for (const t of transactions) {
      summary[t.transaction_type] += Number(t.amount);
    }

    // Round all values to 2 decimal places
    for (const key of Object.keys(summary)) {
      summary[key as TransactionType] = Number(
        summary[key as TransactionType].toFixed(2),
      );
    }

    return summary;
  }

  // -------------------------------------------------------------------
  // Category breakdown — total spent per category for a given month
  // -------------------------------------------------------------------
  async getCategoryBreakdown(
    userId: number,
    month: number,
    year: number,
  ): Promise<{ category_id: number; name: string; total: number }[]> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const result = await this.transactionRepository
      .createQueryBuilder('t')
      .leftJoin('t.category', 'c')
      .select('t.category_id', 'category_id')
      .addSelect('c.name', 'name')
      .addSelect('SUM(t.amount)', 'total')
      .where('t.user_id = :userId', { userId })
      .andWhere('t.transaction_date BETWEEN :start AND :end', { start, end })
      .andWhere('t.category_id IS NOT NULL')
      .groupBy('t.category_id')
      .addGroupBy('c.name')
      .orderBy('total', 'DESC')
      .getRawMany<{ category_id: number; name: string; total: string }>();

    return result.map((r) => ({
      category_id: r.category_id,
      name: r.name,
      total: Number(Number(r.total).toFixed(2)),
    }));
  }
}
