import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { PractitionerRefsInterceptor } from '../policies/practitioner-refs.interceptor';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { CorrelationId } from '../../practice/http/request-decorators';
import {
  PeriopBlocksService,
  PeriopPreopService,
  PeriopRoomEventsService,
  PeriopUtilizationService,
} from '../services';
import {
  BlockReasonDto,
  CreateChecklistDto,
  CreateOrBlocksDto,
  EndSeriesDto,
  ListOperatingRoomsQueryDto,
  ListOrBlocksQueryDto,
  OrUtilizationQueryDto,
  RecordRoomEventDto,
} from '../dto';

/** Roles del día del caso: enfermería, cirugía, anestesia y la administración perioperatoria. */
const CASE_DAY_ROLES = [
  'PERIOP_NURSE',
  'SURGEON',
  'ANESTHESIOLOGIST',
  'PERIOP_ADMIN',
] as const;

/**
 * Quirófanos (F4): bloques, check-list de cirugía segura, hechos de sala y utilización.
 *
 * Las rutas por sede no llevan `@Roles`: quién puede qué sobre un quirófano lo decide la
 * política de F4 (`OperatingRoomAccessService`), que mira la organización, la sucursal y el
 * alcance del jefe de quirófano, y responde 404 fuera del alcance y 403 sin permiso. Las
 * rutas de un caso conservan los roles del día del caso.
 */
@ApiTags('periop-or')
@ApiBearerAuth()
@UseInterceptors(PractitionerRefsInterceptor)
@Controller()
export class PeriopOrController {
  /**
   * @param blocks - Bloques y listado de quirófanos.
   * @param preop - Check-list OMS.
   * @param roomEvents - Hechos de sala.
   * @param utilization - Utilización.
   */
  constructor(
    private readonly blocks: PeriopBlocksService,
    private readonly preop: PeriopPreopService,
    private readonly roomEvents: PeriopRoomEventsService,
    private readonly utilization: PeriopUtilizationService,
  ) {}

  /** Quirófanos de la sede con su recurso, preparación, limpieza y lo del día. */
  @Get('sites/:siteId/operating-rooms')
  @ApiOperation({ summary: 'Quirófanos de la sede' })
  listOperatingRooms(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Query() query: ListOperatingRoomsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.blocks.listOperatingRooms(siteId, query, actor);
  }

  /** Bloques de la sede en el rango, con minutos usados y casos ligados. */
  @Get('sites/:siteId/or-blocks')
  @ApiOperation({ summary: 'Bloques de quirófano de la sede' })
  listBlocks(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Query() query: ListOrBlocksQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.blocks.listBlocks(siteId, query, actor);
  }

  /** Crea un bloque o una serie de bloques. */
  @Audited({
    action: 'PERIOP_OR_BLOCK_CREATED',
    entity: 'operating_room_block',
    entityId: 'result.id',
  })
  @Post('sites/:siteId/or-blocks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un bloque de quirófano (o una serie recurrente)',
    description:
      'Por servicio o cirujano, con regla de liberación. Máximo 400 instancias por solicitud.',
  })
  createBlocks(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Body() dto: CreateOrBlocksDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() correlationId: string | undefined,
  ) {
    return this.blocks.createBlocks(siteId, dto, actor, correlationId);
  }

  /** Libera el bloque: su tiempo pasa a la agenda abierta. */
  @Audited({
    action: 'PERIOP_OR_BLOCK_RELEASED',
    entity: 'operating_room_block',
    entityId: 'param:id',
  })
  @Post('or-blocks/:id/release')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liberar un bloque de quirófano antes de tiempo' })
  releaseBlock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BlockReasonDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() correlationId: string | undefined,
  ) {
    return this.blocks.release(id, dto.reasonText, actor, correlationId);
  }

  /** Cancela el bloque. */
  @Audited({
    action: 'PERIOP_OR_BLOCK_CANCELLED',
    entity: 'operating_room_block',
    entityId: 'param:id',
  })
  @Post('or-blocks/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar un bloque de quirófano' })
  cancelBlock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BlockReasonDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() correlationId: string | undefined,
  ) {
    return this.blocks.cancel(id, dto.reasonText, actor, correlationId);
  }

  /** Acorta una serie: las instancias posteriores se cancelan. */
  @Audited({
    action: 'PERIOP_OR_BLOCK_SERIES_ENDED',
    entity: 'operating_room_block_series',
    entityId: 'param:id',
  })
  @Patch('or-block-series/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Acortar la vigencia de una serie de bloques' })
  endSeries(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EndSeriesDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() correlationId: string | undefined,
  ) {
    return this.blocks.endSeries(id, dto.validTo, actor, correlationId);
  }

  /** Crea el check-list OMS del caso (idempotente: 200 si ya existe). */
  @Audited({
    action: 'SURGICAL_SAFETY_CHECKLIST_CREATED',
    entity: 'surgical_safety_checklist',
    entityId: 'result.id',
  })
  @Post('procedure-cases/:id/safety-checklists')
  @Roles(...CASE_DAY_ROLES)
  @ApiOperation({
    summary: 'Crear el check-list de cirugía segura (OMS) del caso',
  })
  async createChecklist(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateChecklistDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() correlationId: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.preop.createChecklist(
      id,
      dto.coordinatorProfileId,
      actor,
      correlationId,
    );
    res.status(result.created ? HttpStatus.CREATED : HttpStatus.OK);
    return result;
  }

  /** Las tres fases del check-list con sus ítems y respuestas. */
  @Get('procedure-cases/:id/safety-checklists/:checklistId')
  @Roles(...CASE_DAY_ROLES, 'SURGERY_SCHEDULER')
  @ApiOperation({ summary: 'Leer el check-list de cirugía segura del caso' })
  getChecklist(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('checklistId', ParseUUIDPipe) checklistId: string,
  ) {
    return this.preop.getChecklist(id, checklistId);
  }

  /** Registra un hecho del caso en sala (entrada, anestesia, incisión, cierre, salida). */
  @Audited({
    action: 'PERIOP_ROOM_EVENT_RECORDED',
    entity: 'procedure_case',
    entityId: 'param:id',
  })
  @Post('procedure-cases/:id/room-events')
  @Roles(...CASE_DAY_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un hecho del caso en sala',
    description:
      'Orden obligatorio: entrada → inicio de anestesia → incisión → cierre → salida. Algunos exigen una fase del check-list OMS.',
  })
  recordRoomEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordRoomEventDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() correlationId: string | undefined,
  ) {
    return this.roomEvents.record(id, dto, actor, correlationId);
  }

  /** Utilización de quirófano y de bloque. */
  @Get('sites/:siteId/or-utilization')
  @ApiOperation({ summary: 'Utilización de quirófano y de bloque' })
  utilizationOf(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Query() query: OrUtilizationQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.utilization.utilization(siteId, query, actor);
  }
}
