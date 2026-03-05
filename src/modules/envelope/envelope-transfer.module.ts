import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvelopeTransfer } from './envelop-transfer.entity';
import { EnvelopeTransferService } from './envelope-transfer.service';
import { EnvelopeTransferController } from './evnvelope-transfer.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EnvelopeTransfer])],
  controllers: [EnvelopeTransferController],
  providers: [EnvelopeTransferService],
  exports: [EnvelopeTransferService], // exported for Snapshot module
})
export class EnvelopeTransferModule {}
