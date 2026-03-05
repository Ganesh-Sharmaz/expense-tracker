import { PartialType } from '@nestjs/mapped-types';
import { CreateEnvelopeTransferDto } from './create-envelope-transfer.dto';

export class UpdateEnvelopeTransferDto extends PartialType(
  CreateEnvelopeTransferDto,
) {}
