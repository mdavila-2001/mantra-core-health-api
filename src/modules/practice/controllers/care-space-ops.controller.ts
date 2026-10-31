import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  RequestId,
  Roles,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import {
  BedBoardReadService,
  CareSpaceOpsService,
  CleaningOrdersService,
} from '../services';
import {
  AssignCleaningOrderDto,
  AvailabilityChangeDto,
  AvailabilityResultDto,
  BedBoardDto,
  BedBoardQueryDto,
  BlocksTickResultDto,
  CancelBlockDto,
  CancelCleaningOrderDto,
  CareSpaceBlockDto,
  CleaningOrderDto,
  CleaningOrderListDto,
  CleaningOrderQueryDto,
  CreateCleaningOrderDto,
  EndBlockDto,
  FinishCleaningOrderDto,
  HygieneActionDto,
  HygieneResultDto,
  InspectCleaningOrderDto,
  IsolationChangeDto,
  IsolationResultDto,
  OperationalStateDto,
  StatusEventListDto,
  StatusEventsQueryDto,
} from '../dto';

const IF_MATCH_OPS = {
  name: 'If-Match-Ops',
  required: true,
  description:
    'opsVersion leída (3, "3" o W/"3"). Ausente: 428; distinta: 412 OPS_VERSION_MISMATCH',
};
const IF_MATCH = {
  name: 'If-Match',
  required: true,
  description: 'rowVersion de la orden. Ausente: 428; distinta: 412',
};

/** Lo mínimo de la respuesta Express que usa el tablero. */
interface HeaderSink {
  setHeader(name: string, value: string): void;
}

/**
 * Operación de espacios (F2, CONTRATO-F2-F5 §F2.3): tablero de camas, ejes
 * manuales (disponibilidad, higiene, aislamiento), bloqueos, cola de limpieza e
 * historial A20. Sin `@Roles` en las rutas de usuario: la autorización es por
 * tenant, alcance y rol de §0.3 en `InfrastructureAccessService`; un recurso de
 * otro tenant responde 404.
 */
@ApiTags('practice-operations')
@ApiBearerAuth()
@Controller()
export class CareSpaceOpsController {
  constructor(
    private readonly read: BedBoardReadService,
    private readonly ops: CareSpaceOpsService,
    private readonly cleaning: CleaningOrdersService,
  ) {}

  /** Tablero de camas por unidad, con recuentos derivados. */
  @Get('sites/:siteId/bed-board')
  @ApiOperation({ summary: 'Tablero de camas de una sede' })
  @ApiOkResponse({
    type: BedBoardDto,
    headers: {
      'X-Data-As-Of': {
        description: 'lastEventAt (o generatedAt sin eventos)',
        schema: { type: 'string', format: 'date-time' },
      },
    },
  })
  async bedBoard(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Query() query: BedBoardQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Res({ passthrough: true }) res: HeaderSink,
  ): Promise<BedBoardDto> {
    const board = await this.read.bedBoard(
      siteId,
      query,
      actor,
      requireTenantId(),
    );
    res.setHeader('X-Data-As-Of', board.lastEventAt ?? board.generatedAt);
    return board;
  }

  /** Estado operativo de un espacio con bloqueos y orden abierta. */
  @Get('care-spaces/:id/operational-state')
  @ApiOperation({ summary: 'Estado operativo de un espacio' })
  @ApiOkResponse({ type: OperationalStateDto })
  operationalState(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OperationalStateDto> {
    return this.read.operationalState(id, actor, requireTenantId());
  }

  /** Bloquear, desbloquear, mantenimiento, cerrar o reabrir. */
  @Audited({
    action: 'CARE_SPACE_AVAILABILITY_CHANGED',
    entity: 'care_space',
    entityId: 'param:id',
  })
  @Post('care-spaces/:id/availability')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar la disponibilidad de un espacio' })
  @ApiHeader(IF_MATCH_OPS)
  @ApiOkResponse({ type: AvailabilityResultDto })
  changeAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AvailabilityChangeDto,
    @Headers('if-match-ops') ifMatchOps: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ): Promise<AvailabilityResultDto> {
    return this.ops.changeAvailability(id, dto, ifMatchOps, {
      actor,
      tenantId: requireTenantId(),
      requestId,
    });
  }

  /** Bloqueos de un espacio. */
  @Get('care-spaces/:id/blocks')
  @ApiOperation({ summary: 'Bloqueos de un espacio' })
  @ApiQuery({ name: 'includeEnded', required: false, type: Boolean })
  @ApiOkResponse({ type: [CareSpaceBlockDto] })
  blocks(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeEnded', new ParseBoolPipe({ optional: true }))
    includeEnded: boolean | undefined,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CareSpaceBlockDto[]> {
    return this.read.blocks(
      id,
      includeEnded === true,
      actor,
      requireTenantId(),
    );
  }

  /** Terminar un bloqueo (el fin de mantenimiento abre una orden de limpieza). */
  @Audited({
    action: 'CARE_SPACE_BLOCK_ENDED',
    entity: 'care_space_block',
    entityId: 'param:id',
  })
  @Post('care-space-blocks/:id/end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Terminar un bloqueo' })
  @ApiOkResponse({ type: CareSpaceBlockDto })
  endBlock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EndBlockDto,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ): Promise<{ block: CareSpaceBlockDto; cleaningOrderId: string | null }> {
    return this.ops.endBlock(id, dto.note, {
      actor,
      tenantId: requireTenantId(),
      requestId,
    });
  }

  /** Cancelar un bloqueo. */
  @Audited({
    action: 'CARE_SPACE_BLOCK_CANCELLED',
    entity: 'care_space_block',
    entityId: 'param:id',
  })
  @Post('care-space-blocks/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar un bloqueo' })
  @ApiOkResponse({ type: CareSpaceBlockDto })
  cancelBlock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelBlockDto,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ): Promise<CareSpaceBlockDto> {
    return this.ops.cancelBlock(id, dto.reason, {
      actor,
      tenantId: requireTenantId(),
      requestId,
    });
  }

  /** Marcar sucia o contaminada. */
  @Audited({
    action: 'CARE_SPACE_HYGIENE_CHANGED',
    entity: 'care_space',
    entityId: 'param:id',
  })
  @Post('care-spaces/:id/hygiene')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar un espacio sucio o contaminado' })
  @ApiHeader(IF_MATCH_OPS)
  @ApiOkResponse({ type: HygieneResultDto })
  changeHygiene(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HygieneActionDto,
    @Headers('if-match-ops') ifMatchOps: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ): Promise<HygieneResultDto> {
    return this.ops.changeHygiene(id, dto, ifMatchOps, {
      actor,
      tenantId: requireTenantId(),
      requestId,
    });
  }

  /** Poner o levantar un aislamiento. */
  @Audited({
    action: 'CARE_SPACE_ISOLATION_CHANGED',
    entity: 'care_space',
    entityId: 'param:id',
  })
  @Post('care-spaces/:id/isolation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar el aislamiento de un espacio' })
  @ApiHeader(IF_MATCH_OPS)
  @ApiOkResponse({ type: IsolationResultDto })
  changeIsolation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: IsolationChangeDto,
    @Headers('if-match-ops') ifMatchOps: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ): Promise<IsolationResultDto> {
    return this.ops.changeIsolation(id, dto, ifMatchOps, {
      actor,
      tenantId: requireTenantId(),
      requestId,
    });
  }

  /** Cola de limpieza (sin datos de paciente). */
  @Get('sites/:siteId/cleaning-orders')
  @ApiOperation({ summary: 'Cola de limpieza de una sede' })
  @ApiOkResponse({ type: CleaningOrderListDto })
  cleaningOrders(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Query() query: CleaningOrderQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CleaningOrderListDto> {
    return this.read.cleaningOrders(siteId, query, actor, requireTenantId());
  }

  /** Orden de limpieza manual. */
  @Audited({
    action: 'CLEANING_ORDER_CREATED',
    entity: 'cleaning_order',
    entityId: 'result.id',
  })
  @Post('sites/:siteId/cleaning-orders')
  @ApiOperation({ summary: 'Crear una orden de limpieza' })
  @ApiCreatedResponse({ type: CleaningOrderDto })
  createCleaningOrder(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Body() dto: CreateCleaningOrderDto,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ): Promise<CleaningOrderDto> {
    return this.cleaning.create(siteId, dto, {
      actor,
      tenantId: requireTenantId(),
      requestId,
    });
  }

  /** Asignar (o desasignar) una orden. */
  @Audited({
    action: 'CLEANING_ORDER_ASSIGNED',
    entity: 'cleaning_order',
    entityId: 'param:id',
  })
  @Post('cleaning-orders/:id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Asignar una orden de limpieza' })
  @ApiHeader(IF_MATCH)
  @ApiOkResponse({ type: CleaningOrderDto })
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignCleaningOrderDto,
    @Headers('if-match') ifMatch: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ): Promise<CleaningOrderDto> {
    return this.cleaning.assign(id, dto.userId, ifMatch, {
      actor,
      tenantId: requireTenantId(),
      requestId,
    });
  }

  /** Iniciar la limpieza. */
  @Audited({
    action: 'CLEANING_ORDER_STARTED',
    entity: 'cleaning_order',
    entityId: 'param:id',
  })
  @Post('cleaning-orders/:id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar una orden de limpieza' })
  @ApiHeader(IF_MATCH)
  @ApiOkResponse({ type: CleaningOrderDto })
  start(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('if-match') ifMatch: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ): Promise<CleaningOrderDto> {
    return this.cleaning.start(id, ifMatch, {
      actor,
      tenantId: requireTenantId(),
      requestId,
    });
  }

  /** Terminar la limpieza. */
  @Audited({
    action: 'CLEANING_ORDER_FINISHED',
    entity: 'cleaning_order',
    entityId: 'param:id',
  })
  @Post('cleaning-orders/:id/finish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Terminar una orden de limpieza' })
  @ApiHeader(IF_MATCH)
  @ApiOkResponse({ type: CleaningOrderDto })
  finish(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() _dto: FinishCleaningOrderDto,
    @Headers('if-match') ifMatch: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ): Promise<CleaningOrderDto> {
    return this.cleaning.finish(id, ifMatch, {
      actor,
      tenantId: requireTenantId(),
      requestId,
    });
  }

  /** Inspeccionar (PASS / FAIL). */
  @Audited({
    action: 'CLEANING_ORDER_INSPECTED',
    entity: 'cleaning_order',
    entityId: 'param:id',
  })
  @Post('cleaning-orders/:id/inspect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inspeccionar una limpieza' })
  @ApiHeader(IF_MATCH)
  @ApiOkResponse({ type: CleaningOrderDto })
  inspect(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: InspectCleaningOrderDto,
    @Headers('if-match') ifMatch: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ): Promise<{ order: CleaningOrderDto; nextOrderId: string | null }> {
    return this.cleaning.inspect(id, dto, ifMatch, {
      actor,
      tenantId: requireTenantId(),
      requestId,
    });
  }

  /** Cancelar una orden. */
  @Audited({
    action: 'CLEANING_ORDER_CANCELLED',
    entity: 'cleaning_order',
    entityId: 'param:id',
  })
  @Post('cleaning-orders/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar una orden de limpieza' })
  @ApiHeader(IF_MATCH)
  @ApiOkResponse({ type: CleaningOrderDto })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelCleaningOrderDto,
    @Headers('if-match') ifMatch: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ): Promise<CleaningOrderDto> {
    return this.cleaning.cancel(id, dto.reason, ifMatch, {
      actor,
      tenantId: requireTenantId(),
      requestId,
    });
  }

  /** Historial A20 de un espacio. */
  @Get('care-spaces/:id/status-events')
  @ApiOperation({ summary: 'Historial de estados de un espacio (A20)' })
  @ApiOkResponse({ type: StatusEventListDto })
  statusEvents(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: StatusEventsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusEventListDto> {
    return this.read.statusEvents(id, query, actor, requireTenantId());
  }

  /** Tick del worker: aplica bloqueos programados y avisa vencidos. */
  @Audited({ action: 'CARE_SPACE_BLOCKS_TICKED', entity: 'care_space_block' })
  @Post('internal/practice/blocks-tick')
  @Roles('SYSTEM', 'SYSTEM_WORKER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aplicar bloqueos programados y avisar vencidos (worker)',
  })
  @ApiOkResponse({ type: BlocksTickResultDto })
  blocksTick(): Promise<BlocksTickResultDto> {
    return this.ops.runBlocksTick();
  }
}
