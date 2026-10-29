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
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Audited, CurrentUser, type AuthenticatedUser } from '../../../common';
import {
  AssignCleaningOrderDto,
  AvailabilityDto,
  BedBoardQueryDto,
  BlocksQueryDto,
  CancelBlockDto,
  CancelCleaningOrderDto,
  CleaningOrdersQueryDto,
  CreateCleaningOrderDto,
  EndBlockDto,
  FinishCleaningOrderDto,
  HygieneDto,
  InspectCleaningOrderDto,
  IsolationDto,
  StatusEventsQueryDto,
} from '../dto/care-space-ops.dto';
import type {
  AvailabilityResult,
  BedBoard,
  BlockActionResult,
  CareSpaceBlockView,
  CleaningOrderPage,
  CleaningOrderView,
  HygieneResult,
  IsolationResult,
  OperationalStateView,
  StatusEventPage,
} from '../dto/care-space-ops.types';
import { IfMatchOps } from '../http/ops-version';
import { CorrelationId, IfMatch } from '../http/request-decorators';
import { BedBoardReadService } from '../services/bed-board-read.service';
import { CareSpaceOpsService } from '../services/care-space-ops.service';
import { CleaningOrdersService } from '../services/cleaning-orders.service';

const IF_MATCH_OPS = {
  name: 'If-Match-Ops',
  required: true,
  description:
    'opsVersion vigente del espacio (412 `OPS_VERSION_MISMATCH` si no coincide, 428 si falta). Va separada de rowVersion: no choca con la edición de estructura',
};
const IF_MATCH_ORDER = {
  name: 'If-Match',
  required: true,
  description:
    'rowVersion vigente de la orden de limpieza (412 si no coincide, 428 si falta)',
};

/**
 * Operación de camas y salas (F2 de infraestructura hospitalaria): tablero con la
 * antigüedad del dato, estado operativo por ejes, bloqueos y mantenimiento, higiene,
 * aislamiento, cola y órdenes de limpieza e historial A20.
 *
 * Sin `@Roles`: la autoridad es `InfrastructureAccessService` (rol operativo con
 * alcance sede, unidad o espacio). Un espacio de otro tenant o fuera del alcance del
 * actor responde 404; con alcance pero sin el rol de la acción, 403
 * `INFRA_ACTION_NOT_ALLOWED`.
 */
@ApiTags('practice')
@ApiBearerAuth()
@Controller()
export class CareSpaceOpsController {
  /**
   * @param ops - Operación de un espacio.
   * @param board - Tablero de camas.
   * @param cleaning - Órdenes de limpieza.
   */
  constructor(
    private readonly ops: CareSpaceOpsService,
    private readonly board: BedBoardReadService,
    private readonly cleaning: CleaningOrdersService,
  ) {}

  // ------------------------------------------------------------------ tablero

  /** Tablero de camas de la sede, con `X-Data-As-Of` = último evento visible. */
  @Get('sites/:siteId/bed-board')
  @ApiOperation({ summary: 'Tablero de camas de un establecimiento' })
  @ApiResponse({
    status: 404,
    description: 'Sede de otro tenant o fuera del alcance',
  })
  async bedBoard(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Query() query: BedBoardQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<BedBoard> {
    const result = await this.board.board(siteId, query, actor);
    response.setHeader('X-Data-As-Of', result.dataAsOf);
    response.setHeader('Cache-Control', 'private, no-store');
    return result.board;
  }

  /** Ficha operativa de un espacio. */
  @Get('care-spaces/:id/operational-state')
  @ApiOperation({
    summary: 'Estado operativo de un espacio (ejes, bloqueos, orden abierta)',
  })
  operationalState(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OperationalStateView> {
    return this.ops.operationalState(id, actor);
  }

  /** Historial A20 del espacio, del más reciente al más viejo. */
  @Get('care-spaces/:id/status-events')
  @ApiOperation({
    summary: 'Historial de cambios de estado (A20) de un espacio',
  })
  statusEvents(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: StatusEventsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusEventPage> {
    return this.ops.statusEvents(id, query, actor);
  }

  // ------------------------------------------------------------ disponibilidad

  /** Bloquea, desbloquea, inicia mantenimiento, cierra o reabre. */
  @Audited({
    action: 'CARE_SPACE_AVAILABILITY_CHANGED',
    entity: 'care_space',
    entityId: 'param:id',
  })
  @Post('care-spaces/:id/availability')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(IF_MATCH_OPS)
  @ApiOperation({
    summary: 'Cambiar la disponibilidad de un espacio (If-Match-Ops)',
  })
  @ApiResponse({
    status: 409,
    description:
      'SPACE_OCCUPIED, BLOCK_OVERLAP o FUTURE_COMMITMENTS_CONFLICT (con `conflicts`)',
  })
  @ApiResponse({ status: 412, description: 'OPS_VERSION_MISMATCH' })
  @ApiResponse({
    status: 422,
    description: 'Motivo, fecha estimada o espacio inactivo',
  })
  availability(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AvailabilityDto,
    @IfMatchOps() expectedOpsVersion: number,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() requestId: string | undefined,
  ): Promise<AvailabilityResult> {
    return this.ops.changeAvailability(
      id,
      dto,
      expectedOpsVersion,
      actor,
      requestId,
    );
  }

  /** Bloqueos del espacio. */
  @Get('care-spaces/:id/blocks')
  @ApiOperation({ summary: 'Bloqueos de un espacio' })
  blocks(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: BlocksQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CareSpaceBlockView[]> {
    return this.ops.listBlocks(id, query, actor);
  }

  /** Termina un bloqueo vigente (el fin de un mantenimiento abre una limpieza). */
  @Audited({
    action: 'CARE_SPACE_BLOCK_ENDED',
    entity: 'care_space_block',
    entityId: 'param:id',
  })
  @Post('care-space-blocks/:id/end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Terminar un bloqueo' })
  @ApiResponse({ status: 409, description: 'BLOCK_ALREADY_ENDED' })
  endBlock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EndBlockDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() requestId: string | undefined,
  ): Promise<BlockActionResult> {
    return this.ops.endBlock(id, dto, actor, requestId);
  }

  /** Cancela un bloqueo (programado o vigente) con motivo. */
  @Audited({
    action: 'CARE_SPACE_BLOCK_CANCELLED',
    entity: 'care_space_block',
    entityId: 'param:id',
  })
  @Post('care-space-blocks/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar un bloqueo' })
  @ApiResponse({ status: 409, description: 'BLOCK_ALREADY_ENDED' })
  cancelBlock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelBlockDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() requestId: string | undefined,
  ): Promise<BlockActionResult> {
    return this.ops.cancelBlock(id, dto, actor, requestId);
  }

  // ------------------------------------------------------------ higiene y aislamiento

  /** Marca el espacio sucio o contaminado y abre su orden de limpieza. */
  @Audited({
    action: 'CARE_SPACE_HYGIENE_CHANGED',
    entity: 'care_space',
    entityId: 'param:id',
  })
  @Post('care-spaces/:id/hygiene')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(IF_MATCH_OPS)
  @ApiOperation({
    summary: 'Marcar un espacio sucio o contaminado (If-Match-Ops)',
  })
  @ApiResponse({
    status: 409,
    description: 'CLEANING_ORDER_ALREADY_OPEN (sucia)',
  })
  hygiene(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HygieneDto,
    @IfMatchOps() expectedOpsVersion: number,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() requestId: string | undefined,
  ): Promise<HygieneResult> {
    return this.ops.changeHygiene(
      id,
      dto,
      expectedOpsVersion,
      actor,
      requestId,
    );
  }

  /** Marca o levanta el aislamiento. */
  @Audited({
    action: 'CARE_SPACE_ISOLATION_CHANGED',
    entity: 'care_space',
    entityId: 'param:id',
  })
  @Post('care-spaces/:id/isolation')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(IF_MATCH_OPS)
  @ApiOperation({ summary: 'Marcar o levantar el aislamiento (If-Match-Ops)' })
  @ApiResponse({
    status: 403,
    description: 'ISOLATION_COHORT_REQUIRES_APPROVAL',
  })
  @ApiResponse({
    status: 422,
    description: 'ISOLATION_ROOM_NOT_CAPABLE con `details.missing`',
  })
  isolation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: IsolationDto,
    @IfMatchOps() expectedOpsVersion: number,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() requestId: string | undefined,
  ): Promise<IsolationResult> {
    return this.ops.changeIsolation(
      id,
      dto,
      expectedOpsVersion,
      actor,
      requestId,
    );
  }

  // ------------------------------------------------------------- órdenes de limpieza

  /** La cola de limpieza (sin datos de paciente). */
  @Get('sites/:siteId/cleaning-orders')
  @ApiOperation({
    summary: 'Cola de órdenes de limpieza de un establecimiento',
  })
  cleaningOrders(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Query() query: CleaningOrdersQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CleaningOrderPage> {
    return this.cleaning.list(siteId, query, actor);
  }

  /** Pide una limpieza a mano. */
  @Audited({
    action: 'CLEANING_ORDER_CREATED',
    entity: 'cleaning_order',
    entityId: 'result.id',
  })
  @Post('sites/:siteId/cleaning-orders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una orden de limpieza manual' })
  @ApiResponse({ status: 409, description: 'CLEANING_ORDER_ALREADY_OPEN' })
  @ApiResponse({ status: 422, description: 'TERMINAL_CLEANING_REQUIRED' })
  createCleaningOrder(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Body() dto: CreateCleaningOrderDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() requestId: string | undefined,
  ): Promise<CleaningOrderView> {
    return this.cleaning.create(siteId, dto, actor, requestId);
  }

  /** Asigna (o desasigna) la orden. */
  @Audited({
    action: 'CLEANING_ORDER_ASSIGNED',
    entity: 'cleaning_order',
    entityId: 'param:id',
  })
  @Post('cleaning-orders/:id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(IF_MATCH_ORDER)
  @ApiOperation({ summary: 'Asignar una orden de limpieza (If-Match)' })
  assignCleaningOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignCleaningOrderDto,
    @IfMatch() expectedVersion: number,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() requestId: string | undefined,
  ): Promise<CleaningOrderView> {
    return this.cleaning.assign(id, dto, expectedVersion, actor, requestId);
  }

  /** Inicia la limpieza (el espacio pasa a «limpiando»). */
  @Audited({
    action: 'CLEANING_ORDER_STARTED',
    entity: 'cleaning_order',
    entityId: 'param:id',
  })
  @Post('cleaning-orders/:id/start')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(IF_MATCH_ORDER)
  @ApiOperation({ summary: 'Iniciar una limpieza (If-Match)' })
  @ApiResponse({
    status: 409,
    description: 'CLEANING_ORDER_INVALID_TRANSITION',
  })
  startCleaningOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @IfMatch() expectedVersion: number,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() requestId: string | undefined,
  ): Promise<CleaningOrderView> {
    return this.cleaning.start(id, expectedVersion, actor, requestId);
  }

  /** Termina la limpieza (el espacio queda limpio, a la espera de la inspección). */
  @Audited({
    action: 'CLEANING_ORDER_FINISHED',
    entity: 'cleaning_order',
    entityId: 'param:id',
  })
  @Post('cleaning-orders/:id/finish')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(IF_MATCH_ORDER)
  @ApiOperation({ summary: 'Terminar una limpieza (If-Match)' })
  @ApiResponse({
    status: 409,
    description: 'CLEANING_ORDER_INVALID_TRANSITION',
  })
  finishCleaningOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FinishCleaningOrderDto,
    @IfMatch() expectedVersion: number,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() requestId: string | undefined,
  ): Promise<CleaningOrderView> {
    return this.cleaning.finish(id, dto, expectedVersion, actor, requestId);
  }

  /** Inspecciona la limpieza: aprueba (espacio inspeccionado) o rechaza (sucio y orden nueva). */
  @Audited({
    action: 'CLEANING_ORDER_INSPECTED',
    entity: 'cleaning_order',
    entityId: 'param:id',
  })
  @Post('cleaning-orders/:id/inspect')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(IF_MATCH_ORDER)
  @ApiOperation({ summary: 'Inspeccionar una limpieza (If-Match)' })
  @ApiResponse({
    status: 403,
    description: 'TERMINAL_INSPECTION_REQUIRES_SUPERVISOR',
  })
  @ApiResponse({
    status: 422,
    description:
      'INSPECTION_REASON_REQUIRED o INSPECTION_BY_CLEANER_NOT_ALLOWED',
  })
  inspectCleaningOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: InspectCleaningOrderDto,
    @IfMatch() expectedVersion: number,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() requestId: string | undefined,
  ): Promise<CleaningOrderView> {
    return this.cleaning.inspect(id, dto, expectedVersion, actor, requestId);
  }

  /** Cancela la orden con motivo. */
  @Audited({
    action: 'CLEANING_ORDER_CANCELLED',
    entity: 'cleaning_order',
    entityId: 'param:id',
  })
  @Post('cleaning-orders/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(IF_MATCH_ORDER)
  @ApiOperation({ summary: 'Cancelar una orden de limpieza (If-Match)' })
  cancelCleaningOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelCleaningOrderDto,
    @IfMatch() expectedVersion: number,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() requestId: string | undefined,
  ): Promise<CleaningOrderView> {
    return this.cleaning.cancel(id, dto, expectedVersion, actor, requestId);
  }
}
