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
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import {
  AuditEventsService,
  AuditHistoryService,
  ThirdPartyAccessService,
} from '../services';
import {
  RecordDataAccessDto,
  DataAccessResultDto,
  RecordAuditEventDto,
  AuditEventResultDto,
  HistoryQueryDto,
  HistoryTimelineDto,
  VerifyIntegrityDto,
  IntegrityReportDto,
  RetentionApplyDto,
  RetentionResultDto,
  AnomalyScanDto,
  AnomalyScanResultDto,
  RecordThirdPartyAccessDto,
  ThirdPartyAccessResultDto,
} from '../dto';

/**
 * Endpoints de auditoría WORM sobre `/audit/*`. Capa fina: valida parámetros y
 * delega en los servicios de dominio. Operaciones administrativas/seguridad →
 * `@Roles('SECURITY_ADMIN')`.
 */
@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param eventsService - Valor de events service requerido por la operación.
   * @param historyService - Valor de history service requerido por la operación.
   * @param thirdPartyService - Valor de third party service requerido por la operación.
   */
  constructor(
    private readonly eventsService: AuditEventsService,
    private readonly historyService: AuditHistoryService,
    private readonly thirdPartyService: ThirdPartyAccessService,
  ) {}

  /** UC-10-01. */
  @Audited({
    action: 'DATA_ACCESS',
    entity: 'data_access_log',
    entityId: 'result.id',
  })
  @Post('data-access')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar acceso/lectura clínica (accounting WORM)',
  })
  recordDataAccess(
    @Body() dto: RecordDataAccessDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DataAccessResultDto> {
    return this.eventsService.recordDataAccess(dto, actor);
  }

  /** UC-10-04 (sella cadena hash, UC-10-03). */
  @Audited({
    action: 'AUDIT_EVENT_RECORDED',
    entity: 'audit_log',
    entityId: 'result.id',
  })
  @Post('events')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar provenance de un cambio y sellar la cadena hash',
  })
  recordEvent(
    @Body() dto: RecordAuditEventDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AuditEventResultDto> {
    return this.eventsService.recordEvent(dto, actor);
  }

  /** UC-10-05. */
  @Get('history/:entity/:id')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consultar historial / línea de tiempo de un registro',
  })
  getHistory(
    @Param('entity') entity: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: HistoryQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<HistoryTimelineDto> {
    return this.historyService.getTimeline(entity, id, query, actor);
  }

  /** UC-10-06. */
  @Audited({
    action: 'INTEGRITY_ATTESTATION',
    entity: 'audit_log',
  })
  @Post('integrity/verify')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar integridad tamper-evidence de la cadena',
  })
  verifyIntegrity(
    @Body() dto: VerifyIntegrityDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IntegrityReportDto> {
    return this.eventsService.verifyIntegrity(dto, actor);
  }

  /** UC-10-09. */
  @Audited({
    action: 'RETENTION_APPLIED',
    entity: 'audit_log',
  })
  @Post('retention/apply')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aplicar retención / archivado / litigation-hold' })
  applyRetention(
    @Body() dto: RetentionApplyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RetentionResultDto> {
    return this.eventsService.applyRetention(dto, actor);
  }

  /** UC-10-10. */
  @Audited({
    action: 'AUDIT_ANOMALY_SCANNED',
    entity: 'audit_log',
  })
  @Post('anomaly/scan')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Detectar acceso anómalo' })
  scanAnomaly(
    @Body() dto: AnomalyScanDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AnomalyScanResultDto> {
    return this.eventsService.scanAnomaly(dto, actor);
  }

  /** UC-10-12. */
  @Audited({
    action: 'THIRD_PARTY_ACCESS',
    entity: 'delegated_access_audit_log',
    entityId: 'result.id',
  })
  @Post('third-party-access')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar acceso delegado / de tercero gobernado' })
  recordThirdPartyAccess(
    @Body() dto: RecordThirdPartyAccessDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ThirdPartyAccessResultDto> {
    return this.thirdPartyService.record(dto, actor);
  }
}
