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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  ParseOptionalLimitPipe,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import {
  DeletionService,
  ProjectionDeliveryService,
  StorageMaintenanceService,
} from '../services';
import {
  ProcessDeliveryDto,
  DeliveryResponseDto,
  SendToDeadLetterDto,
  DeadLetterResponseDto,
  ExpandDeletionDto,
  ExpandDeletionResponseDto,
  ExecuteDeletionDto,
  DeletionExecutionResponseDto,
  VerifyDeletionDto,
  VerificationResponseDto,
  InvalidateCacheDto,
  CacheInvalidationResponseDto,
  PendingDeletionTargetsResponseDto,
  ExecutedDeletionTargetsResponseDto,
} from '../dto';

/**
 * Ejecución de la consistencia cross-store (UC-62-02, 03, 04a, 09 … 12).
 *
 * Todo lo de aquí lo llaman workers. El prefijo `/workers` es el que declara el
 * caso de uso, y ayuda a que nadie confunda estas rutas con operaciones de
 * gobierno.
 */
@ApiTags('cross_store_consistency')
@ApiBearerAuth()
@Controller('workers')
export class CrossStoreWorkerController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param projectionService - Valor de projection service requerido por la operación.
   * @param deletionService - Valor de deletion service requerido por la operación.
   * @param maintenanceService - Valor de maintenance service requerido por la operación.
   */
  constructor(
    private readonly projectionService: ProjectionDeliveryService,
    private readonly deletionService: DeletionService,
    private readonly maintenanceService: StorageMaintenanceService,
  ) {}

  /** UC-62-02 + UC-62-03. */
  @Post('projections/deliveries/process')
  @Roles('SYSTEM', 'PROJECTION_WORKER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar la entrega y avanzar el checkpoint',
    description:
      'El checkpoint sólo avanza si la escritura en el destino está confirmada durable, y nunca retrocede.',
  })
  processDelivery(
    @Body() dto: ProcessDeliveryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DeliveryResponseDto> {
    return this.projectionService.processDelivery(dto, actor);
  }

  /** UC-62-04 (envío). */
  @Post('projections/dead-letters')
  @Roles('SYSTEM', 'PROJECTION_WORKER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Mandar el intento fallido a la cola muerta',
    description:
      'El payload se preserva en el almacén de objetos para poder reprocesarlo.',
  })
  sendToDeadLetter(
    @Body() dto: SendToDeadLetterDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DeadLetterResponseDto> {
    return this.projectionService.sendToDeadLetter(dto, actor);
  }

  /** UC-62-09. */
  @Post('deletion-requests/:id/expand')
  @Roles('SYSTEM', 'DELETION_WORKER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Expandir la solicitud a objetivos por store',
    description:
      'Un objetivo con retención legal se registra igualmente y nace BLOCKED: dejarlo fuera haría creer que no existe.',
  })
  expandDeletion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExpandDeletionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ExpandDeletionResponseDto> {
    return this.deletionService.expandDeletion(id, dto, actor);
  }

  /**
   * Descubrimiento (Fase 4 del plan de corrección de workers): objetivos
   * `PENDING` sin bloqueo, listos para `executions`. No es uno de los 14 UC
   * del módulo — es la infraestructura de lectura que el propio README exige
   * ("Concurrencia": "el barrido de objetivos pendientes... lo hace el
   * worker antes de llamar"), en el mismo estilo que
   * `GET /internal/notifications/pending` de `messaging`.
   */
  @Get('deletion-targets/pending')
  @Roles('SYSTEM', 'DELETION_WORKER', 'PLATFORM_ADMIN')
  @ApiOperation({
    summary: 'Listar objetivos de borrado pendientes de ejecución',
  })
  listPendingDeletionTargets(
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<PendingDeletionTargetsResponseDto> {
    return this.deletionService.listPendingTargets(limit);
  }

  /** UC-62-10. */
  @Post('deletion-targets/:id/executions')
  @Roles('SYSTEM', 'DELETION_WORKER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ejecutar el borrado en el store destino',
    description:
      'Un objetivo con retención legal no se toca. El acuse del proveedor es la evidencia.',
  })
  executeDeletion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExecuteDeletionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DeletionExecutionResponseDto> {
    return this.deletionService.executeDeletion(id, dto, actor);
  }

  /**
   * Descubrimiento (Fase 4): objetivos `EXECUTED` listos para `verifications`.
   * Misma razón que `listPendingDeletionTargets`.
   */
  @Get('deletion-targets/executed')
  @Roles('SYSTEM', 'DELETION_WORKER', 'PLATFORM_ADMIN')
  @ApiOperation({
    summary: 'Listar objetivos ejecutados pendientes de verificación',
  })
  listExecutedDeletionTargets(
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<ExecutedDeletionTargetsResponseDto> {
    return this.deletionService.listExecutedTargets(limit);
  }

  /** UC-62-11 (verificación). */
  @Post('deletion-targets/:id/verifications')
  @Roles('SYSTEM', 'DELETION_WORKER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Verificar la ausencia en el store',
    description:
      'Con referencias residuales el objetivo vuelve a PENDING para reintentarse: la prueba de borrado no es un trámite.',
  })
  verifyDeletion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyDeletionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<VerificationResponseDto> {
    return this.deletionService.verifyDeletion(id, dto, actor);
  }

  /** UC-62-12. */
  @Post('cache/invalidations')
  @Roles('SYSTEM', 'MAINTENANCE_WORKER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Encolar la invalidación de caché',
    description:
      'La clave incluye la versión de la entidad: una versión nueva sí encola otra purga.',
  })
  invalidateCache(
    @Body() dto: InvalidateCacheDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CacheInvalidationResponseDto> {
    return this.maintenanceService.invalidateCache(dto, actor);
  }
}
