import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import {
  GovernanceAnomaliesService,
  GovernanceExportService,
  GovernancePanelService,
  GovernanceReportsService,
} from '../services';
import {
  AckAnomalyDto,
  AccessMatrixQueryDto,
  AnomaliesQueryDto,
  AnomalyListDto,
  AnomalyResolutionResultDto,
  ExportGovernanceReportDto,
  ExportedFileDto,
  GovernanceReportResponseDto,
  UnusedAccessQueryDto,
} from '../dto';

/**
 * Informes y tableros de gobierno de accesos (`SECURITY_ADMIN`, o un
 * administrador delegado con `audit.reports.governance.view` sobre su
 * población): resumen, matriz «quién tiene qué» y «quién puede actuar sobre…»,
 * acumulación de privilegios, accesos sin uso, cuentas sin dueño, excepciones,
 * anomalías y exportación auditable.
 */
@ApiTags('delegated-access-governance-reports')
@ApiBearerAuth()
@Controller('org/governance')
export class GovernanceReportsController {
  /**
   * @param reports - Informes.
   * @param anomalies - Anomalías.
   * @param exports - Exportación auditable.
   */
  constructor(
    private readonly reports: GovernanceReportsService,
    private readonly anomalies: GovernanceAnomaliesService,
    private readonly exports: GovernanceExportService,
  ) {}

  /** Los 10 mosaicos del tablero. */
  @Get('summary')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @ApiOperation({ summary: 'Resumen del tablero de gobierno (10 mosaicos)' })
  @ApiOkResponse({ type: GovernanceReportResponseDto })
  summary(@CurrentUser() actor: AuthenticatedUser) {
    return this.reports.summary(actor);
  }

  /** Matriz «quién tiene qué» o «quién puede actuar sobre un doctor, servicio o espacio». */
  @Get('access-matrix')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @ApiOperation({
    summary: 'Matriz de accesos por persona, doctor, servicio o espacio',
  })
  @ApiOkResponse({ type: GovernanceReportResponseDto })
  matrix(
    @Query() query: AccessMatrixQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.reports.accessMatrix(actor, query);
  }

  /** Quién acumuló de más. */
  @Get('privilege-creep')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @ApiOperation({ summary: 'Acumulación de privilegios' })
  @ApiOkResponse({ type: GovernanceReportResponseDto })
  creep(@CurrentUser() actor: AuthenticatedUser) {
    return this.reports.privilegeCreep(actor);
  }

  /** Concesiones sin uso. */
  @Get('unused-access')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @ApiOperation({ summary: 'Accesos sin uso' })
  @ApiOkResponse({ type: GovernanceReportResponseDto })
  unused(
    @Query() query: UnusedAccessQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.reports.unusedAccess(actor, query.days);
  }

  /** Cuentas sin dueño. */
  @Get('ownerless')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @ApiOperation({ summary: 'Cuentas sin dueño' })
  @ApiOkResponse({ type: GovernanceReportResponseDto })
  ownerless(@CurrentUser() actor: AuthenticatedUser) {
    return this.reports.ownerless(actor);
  }

  /** Lo que está «fuera de regla». */
  @Get('exceptions')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @ApiOperation({ summary: 'Excepciones activas' })
  @ApiOkResponse({ type: GovernanceReportResponseDto })
  exceptions(@CurrentUser() actor: AuthenticatedUser) {
    return this.reports.exceptions(actor);
  }

  /** Anomalías de actividad. */
  @Get('anomalies')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @ApiOperation({ summary: 'Anomalías de actividad' })
  @ApiOkResponse({ type: AnomalyListDto })
  listAnomalies(
    @Query() query: AnomaliesQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AnomalyListDto> {
    return this.anomalies.list(actor, query);
  }

  /** Reconoce, descarta o escala una anomalía (el servicio sella la acción exacta). */
  @Audited({
    action: 'ANOMALY_ACKNOWLEDGED',
    entity: 'access_anomaly',
    entityId: 'param:id',
  })
  @Post('anomalies/:id/ack')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reconocer, descartar o escalar una anomalía' })
  @ApiOkResponse({ type: AnomalyResolutionResultDto })
  ack(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AckAnomalyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AnomalyResolutionResultDto> {
    return this.anomalies.ack(id, dto, actor);
  }

  /** Exportación auditable: motivo, paso extra, `sha256` y asiento. Tope de frecuencia: 5 por minuto por persona (B-B12). */
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Audited({
    action: 'GOVERNANCE_REPORT_EXPORTED',
    entity: 'governance_report',
  })
  @Post('reports/:kind/export')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exportar un informe de gobierno (auditado)' })
  @ApiOkResponse({ type: ExportedFileDto })
  export(
    @Param('kind') kind: string,
    @Body() dto: ExportGovernanceReportDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Ip() ip: string,
  ): Promise<ExportedFileDto> {
    return this.exports.exportReport(actor, kind, dto, { ip });
  }
}

/** Panel «Mi equipo» del doctor: solo su equipo, nunca la organización entera. */
@ApiTags('delegated-access-governance-reports')
@ApiBearerAuth()
@Controller('me/practitioner')
export class PractitionerGovernanceController {
  /**
   * @param panel - Panel del doctor.
   */
  constructor(private readonly panel: GovernancePanelService) {}

  /** Panel «Mi equipo». */
  @Get('governance-panel')
  @Roles('PRACTITIONER', 'CLINICIAN')
  @ApiOperation({ summary: 'Panel «Mi equipo» del doctor' })
  @ApiOkResponse({ type: GovernanceReportResponseDto })
  governancePanel(@CurrentUser() actor: AuthenticatedUser) {
    return this.panel.panel(actor);
  }
}
