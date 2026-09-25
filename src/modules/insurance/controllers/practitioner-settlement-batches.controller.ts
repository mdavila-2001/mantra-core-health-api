import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { PractitionerSettlementBatchesService } from '../services';
import {
  GeneratePractitionerSettlementBatchDto,
  PractitionerSettlementBatchDto,
  PractitionerSettlementBatchListDto,
  PractitionerSettlementBatchListQueryDto,
} from '../dto';

/**
 * Tarea 3 · H8 (MED-E13..E16) — lotes periódicos de liquidación al
 * profesional. Ver
 * `docs/contracts/insurer-practitioner-settlement-batches.md`.
 *
 * Sin `@Roles` de clase: la autorización la resuelve el servicio por
 * pertenencia (administración activa de la aseguradora, o alcance del
 * tenant del prestador), igual que las escrituras vinculadas de
 * `ClaimsController`.
 */
@ApiTags('insurance-practitioner-settlement')
@ApiBearerAuth()
@Controller('practitioner-settlement-batches')
export class PractitionerSettlementBatchesController {
  constructor(private readonly service: PractitionerSettlementBatchesService) {}

  /**
   * Genera el lote del período, o devuelve el existente (contrato §9):
   * `201` si es nuevo, `200` con `replayed: true` si ya existía.
   */
  @Post()
  @Roles()
  @ApiOperation({
    summary: 'Generar (o repetir) el lote de liquidación del período',
  })
  async generate(
    @Body() dto: GeneratePractitionerSettlementBatchDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PractitionerSettlementBatchDto> {
    const { dto: batch, created } = await this.service.generate(dto, actor);
    res.status(created ? HttpStatus.CREATED : HttpStatus.OK);
    return batch;
  }

  @Get(':id')
  @Roles()
  @ApiOperation({ summary: 'Consultar un lote de liquidación' })
  getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PractitionerSettlementBatchDto> {
    return this.service.getById(id, actor);
  }

  @Get()
  @Roles()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar los lotes de liquidación del alcance del actor',
  })
  list(
    @Query() query: PractitionerSettlementBatchListQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PractitionerSettlementBatchListDto> {
    return this.service.list(query, actor);
  }
}
