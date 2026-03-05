import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common/services/base.service';
import { CreateEnvelopeTransferDto } from './dto/create-envelope-transfer.dto';
import { UpdateEnvelopeTransferDto } from './dto/update-envelope-transfer.dto';
import { AllocationType } from '../../common/enums/allocation-type.enum';
import { EnvelopeTransfer } from './envelop-transfer.entity';

@Injectable()
export class EnvelopeTransferService extends BaseService<EnvelopeTransfer> {
  constructor(
    @InjectRepository(EnvelopeTransfer)
    private readonly transferRepository: Repository<EnvelopeTransfer>,
  ) {
    super(transferRepository);
  }

  // -------------------------------------------------------------------
  // Create — validates from !== to, then saves ledger row
  // -------------------------------------------------------------------
  async createTransfer(
    userId: number,
    dto: CreateEnvelopeTransferDto,
  ): Promise<EnvelopeTransfer> {
    // Can't transfer from an envelope to itself
    if (dto.from_allocation_type === dto.to_allocation_type) {
      throw new BadRequestException(
        'Cannot transfer between the same envelope',
      );
    }

    const transfer = this.transferRepository.create({
      ...dto,
      user_id: userId,
      transfer_date: new Date(dto.transfer_date),
    } as unknown as EnvelopeTransfer);

    return this.transferRepository.save(transfer);
  }

  // -------------------------------------------------------------------
  // Get all transfers for a month — user scoped
  // -------------------------------------------------------------------
  findByMonth(
    userId: number,
    month: number,
    year: number,
  ): Promise<EnvelopeTransfer[]> {
    return this.transferRepository.find({
      where: { user_id: userId, month, year },
      order: { transfer_date: 'DESC' },
    });
  }

  // -------------------------------------------------------------------
  // Get all transfers for a user — full history
  // -------------------------------------------------------------------
  findAllForUser(userId: number): Promise<EnvelopeTransfer[]> {
    return this.transferRepository.find({
      where: { user_id: userId },
      order: { year: 'DESC', month: 'DESC', transfer_date: 'DESC' },
    });
  }

  // -------------------------------------------------------------------
  // Get one — user scoped
  // -------------------------------------------------------------------
  async findOneForUser(userId: number, id: number): Promise<EnvelopeTransfer> {
    const transfer = await this.transferRepository.findOne({
      where: { id, user_id: userId },
    });
    if (!transfer) throw new NotFoundException('Envelope transfer not found');
    return transfer;
  }

  // -------------------------------------------------------------------
  // Update — user scoped, re-validates from !== to
  // -------------------------------------------------------------------
  async updateTransfer(
    userId: number,
    id: number,
    dto: UpdateEnvelopeTransferDto,
  ): Promise<EnvelopeTransfer> {
    const transfer = await this.findOneForUser(userId, id);

    Object.assign(transfer, dto);

    if (dto.transfer_date) {
      transfer.transfer_date = new Date(dto.transfer_date);
    }

    if (transfer.from_allocation_type === transfer.to_allocation_type) {
      throw new BadRequestException(
        'Cannot transfer between the same envelope',
      );
    }

    return this.transferRepository.save(transfer);
  }

  // -------------------------------------------------------------------
  // Delete — user scoped single DB call
  // -------------------------------------------------------------------
  async removeTransfer(
    userId: number,
    id: number,
  ): Promise<{ deleted: boolean; id: number }> {
    const result = await this.transferRepository.delete({
      id,
      user_id: userId,
    });
    if (!result.affected) {
      throw new NotFoundException('Envelope transfer not found');
    }
    return { deleted: true, id };
  }

  // -------------------------------------------------------------------
  // Effective balance — base allocation +/- transfers for a given month
  // Called by Snapshot module in Chunk 9
  // -------------------------------------------------------------------
  async getEffectiveBalances(
    userId: number,
    month: number,
    year: number,
    baseAllocations: Record<AllocationType, number>,
  ): Promise<Record<AllocationType, number>> {
    const transfers = await this.findByMonth(userId, month, year);

    // Start with base allocations
    const balances: Record<AllocationType, number> = { ...baseAllocations };

    // Apply each transfer as a ledger entry
    for (const t of transfers) {
      balances[t.from_allocation_type] -= Number(t.amount);
      balances[t.to_allocation_type] += Number(t.amount);
    }

    // Round to 2 decimal places
    for (const key of Object.keys(balances)) {
      balances[key as AllocationType] = Number(
        balances[key as AllocationType].toFixed(2),
      );
    }

    return balances;
  }
}
