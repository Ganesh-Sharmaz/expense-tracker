import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { EnvelopeTransferService } from './envelope-transfer.service';
import { CreateEnvelopeTransferDto } from './dto/create-envelope-transfer.dto';
import { UpdateEnvelopeTransferDto } from './dto/update-envelope-transfer.dto';

@Controller('envelope-transfers')
export class EnvelopeTransferController {
  constructor(
    private readonly envelopeTransferService: EnvelopeTransferService,
  ) {}

  // POST /api/envelope-transfers
  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateEnvelopeTransferDto,
  ) {
    return this.envelopeTransferService.createTransfer(user.id, dto);
  }

  // GET /api/envelope-transfers
  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.envelopeTransferService.findAllForUser(user.id);
  }

  // GET /api/envelope-transfers/month?month=3&year=2026
  @Get('month')
  findByMonth(
    @CurrentUser() user: AuthUser,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.envelopeTransferService.findByMonth(user.id, month, year);
  }

  // GET /api/envelope-transfers/:id
  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.envelopeTransferService.findOneForUser(user.id, id);
  }

  // PATCH /api/envelope-transfers/:id
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEnvelopeTransferDto,
  ) {
    return this.envelopeTransferService.updateTransfer(user.id, id, dto);
  }

  // DELETE /api/envelope-transfers/:id
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.envelopeTransferService.removeTransfer(user.id, id);
  }
}
