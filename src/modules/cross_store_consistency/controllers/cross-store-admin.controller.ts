import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  DeletionService,
  ProjectionDeliveryService,
  ReconciliationService,
  StorageMaintenanceService,
} from '../services';
import {
  RegisterProjectionDto,
  ProjectionDefinitionResponseDto,
  ReplayDeadLetterDto,
  ReplayResponseDto,
  RunReconciliationDto,
  ReconciliationResponseDto,
  RepairDriftDto,
  RepairJobResponseDto,
  RequestDeletionDto,
  DeletionRequestResponseDto,
  CloseDeletionRequestDto,
  CloseDeletionResponseDto,
  MoveDataDto,
  MovementJobResponseDto,
  ArchiveDataDto,
  ArchiveJobResponseDto,
} from '../dto';

/**
 * Gobierno de la consistencia cross-store (UC-62-01, 04b, 05 … 08, 11b, 13, 14).
 *
 * Todo lo de aquí lo decide una persona: qué se proyecta, cuándo se reconcilia,
 * qué se repara, qué se borra y qué se archiva.
 */
@ApiTags('cross_store_consistency')
@ApiBearerAuth()
@Controller('admin')
export class CrossStoreAdminController {
  constructor(
    private readonly projectionService: ProjectionDeliveryService,
    private readonly reconciliationService: ReconciliationService,
    private readonly deletionService: DeletionService,
    private readonly maintenanceService: StorageMaintenanceService,
  ) {}

  /** UC-62-01. */
  @Post('projections/definitions')
  @Roles('DATA_GOVERNANCE_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Registrar la definición de proyección con sus suscripciones y su SLO',
    description:
      'Origen y destino no pueden ser el mismo dataset: eso sería un bucle, no una proyección.',
  })
  registerProjection(
    @Body() dto: RegisterProjectionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ProjectionDefinitionResponseDto> {
    return this.projectionService.registerProjection(dto, actor);
  }

  /** UC-62-04 (reproceso). */
  @Post('projections/dead-letters/:id/replay')
  @Roles('DATA_GOVERNANCE_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Reprocesar una entrega de la cola muerta',
    description:
      'Conserva la clave de idempotencia del intento original: reprocesar no duplica.',
  })
  replayDeadLetter(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReplayDeadLetterDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReplayResponseDto> {
    return this.projectionService.replayDeadLetter(id, dto, actor);
  }

  /** UC-62-05 + UC-62-06. */
  @Post('reconciliation/runs')
  @Roles(
    'SYSTEM',
    'RECONCILIATION_WORKER',
    'DATA_GOVERNANCE_ADMIN',
    'PLATFORM_ADMIN',
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar la corrida de reconciliación y abrir las derivas',
    description:
      'Compara el canónico contra la proyección. Deduplica las derivas mientras siga abierta la anterior.',
  })
  runReconciliation(
    @Body() dto: RunReconciliationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReconciliationResponseDto> {
    return this.reconciliationService.runReconciliation(dto, actor);
  }

  /** UC-62-07. */
  @Post('projections/drift/:id/repair-jobs')
  @Roles('DATA_GOVERNANCE_ADMIN', 'SYSTEM', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Encolar la reparación de una deriva',
    description:
      'Recomputa desde el canónico. `DELETE_ORPHAN` sólo repara una deriva de tipo EXTRA.',
  })
  repairDrift(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RepairDriftDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RepairJobResponseDto> {
    return this.reconciliationService.repairDrift(id, dto, actor);
  }

  /** UC-62-08. */
  @Post('deletion-requests')
  @Roles('PRIVACY_OFFICER', 'DPO', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Solicitar el borrado de un sujeto',
    description:
      'Exige base legal. Una sola solicitud viva por sujeto; el plazo se fija al crearla.',
  })
  requestDeletion(
    @Body() dto: RequestDeletionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DeletionRequestResponseDto> {
    return this.deletionService.requestDeletion(dto, actor);
  }

  /** UC-62-11 (cierre). */
  @Patch('deletion-requests/:id')
  @Roles('PRIVACY_OFFICER', 'DPO', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cerrar la solicitud de borrado',
    description:
      'Sólo si todo objetivo está verificado ausente o bloqueado por retención legal. Todo bloqueado cierra como BLOCKED, no COMPLETED.',
  })
  closeDeletionRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseDeletionRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CloseDeletionResponseDto> {
    return this.deletionService.closeDeletionRequest(id, dto, actor);
  }

  /** UC-62-13. */
  @Post('data-movement-jobs')
  @Roles('DATA_GOVERNANCE_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Mover datos entre zonas de almacenamiento',
    description:
      'Idempotente por la huella del lote; encola siempre la invalidación de caché.',
  })
  moveData(
    @Body() dto: MoveDataDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MovementJobResponseDto> {
    return this.maintenanceService.moveData(dto, actor);
  }

  /** UC-62-14. */
  @Post('archive-jobs')
  @Roles('SYSTEM', 'DATA_GOVERNANCE_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Archivar por retención y purgar la copia caliente',
    description:
      'La copia caliente sólo se purga si el manifiesto del archivo frío está confirmado.',
  })
  archiveData(
    @Body() dto: ArchiveDataDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ArchiveJobResponseDto> {
    return this.maintenanceService.archiveData(dto, actor);
  }
}
