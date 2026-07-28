import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { DiagnosticsReportsService } from '../services';
import {
  CreateReportVersionDto,
  ReleaseReportVersionDto,
  DetectCriticalResultDto,
  AcknowledgeCriticalResultDto,
  ResourceCreatedDto,
} from '../dto';

/**
 * Endpoints del informe diagnóstico y de resultados críticos: versión (UC-20-07),
 * liberación (UC-20-08), detección de crítico (UC-20-09) y acuse/escalado
 * (UC-20-10).
 */
@ApiTags('diagnostics-reports')
@ApiBearerAuth()
@Roles('CLINICIAN', 'PRACTITIONER')
@Controller('diagnostics')
export class DiagnosticsReportsController {
  constructor(private readonly service: DiagnosticsReportsService) {}

  /** UC-20-07. */
  @Post('reports/:reportId/versions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear/enmendar versión de informe diagnóstico' })
  createVersion(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Body() dto: CreateReportVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    return this.service.createReportVersion(reportId, dto, actor);
  }

  /** UC-20-08. */
  @Post('reports/:reportId/versions/:versionId/release')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validar y liberar una versión del informe' })
  releaseVersion(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Body() dto: ReleaseReportVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    return this.service.releaseVersion(reportId, versionId, dto, actor);
  }

  /** UC-20-09. */
  @Post('critical-results')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Detectar y notificar un resultado crítico' })
  detectCritical(
    @Body() dto: DetectCriticalResultDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    return this.service.detectCritical(dto, actor);
  }

  /** UC-20-10. */
  @Post('critical-results/:id/acknowledge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Acusar recibo / escalar notificación crítica' })
  acknowledge(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AcknowledgeCriticalResultDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    return this.service.acknowledgeCritical(id, dto, actor);
  }
}
