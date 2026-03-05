import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common/services/base.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { IncomeEntry } from './income.entity';
import { UpdateIncomeDto } from './dto/update-income.dto';

@Injectable()
export class IncomeService extends BaseService<IncomeEntry> {
  constructor(
    @InjectRepository(IncomeEntry)
    private readonly incomeRepository: Repository<IncomeEntry>,
  ) {
    super(incomeRepository);
  }

  createIncome(userId: number, dto: CreateIncomeDto): Promise<IncomeEntry> {
    return this.create({
      ...dto,
      user_id: userId,
      received_on: new Date(dto.received_on),
    } as Partial<IncomeEntry>);
  }

  async updateIncome(
    userId: number,
    id: number,
    dto: UpdateIncomeDto,
  ): Promise<IncomeEntry> {
    const income = await this.findWithAllocationsForUser(userId, id);
    Object.assign(income, dto as Partial<IncomeEntry>);

    if (dto.received_on) {
      income.received_on = new Date(dto.received_on);
    }

    return this.incomeRepository.save(income);
  }

  async removeIncome(
    userId: number,
    id: number,
  ): Promise<{ deleted: boolean; id: number }> {
    const result = await this.incomeRepository.delete({ id, user_id: userId });
    if (!result.affected) {
      throw new NotFoundException('Income entry not found');
    }

    return { deleted: true, id };
  }

  async findWithAllocationsForUser(
    userId: number,
    id: number,
  ): Promise<IncomeEntry> {
    const income = await this.incomeRepository.findOne({
      where: { id, user_id: userId },
      relations: ['allocations'],
    });

    if (!income) {
      throw new NotFoundException('Income entry not found');
    }

    return income;
  }

  findAllWithAllocationsForUser(userId: number): Promise<IncomeEntry[]> {
    return this.incomeRepository.find({
      where: { user_id: userId },
      relations: ['allocations'],
      order: { received_on: 'DESC' },
    });
  }
}
