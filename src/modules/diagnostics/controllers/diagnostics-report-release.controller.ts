import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { PatientReleaseResultDto } from '../dto/report-draft-publish.dto';
import {
  ReportIssuerSettingsDto,
  UpdateReportIssuerSettingsDto,
} from '../dto/report-issuer-settings.dto';
import { ReportIssuerSettingsService } from '../services/report-issuer-settings.service';
import { ReportReleaseService } from '../services/report-release.service';

/**
 * The requester's release of a held report, and the signature / seal of the
 * issuing organization. Settings use `@Roles()` (no global role): the service
 * asks for membership to read and OWNER/ADMIN to write, like the logo.
 */
@ApiTags('diagnostics-report-drafts')
@ApiBearerAuth()
@Controller('diagnostics')
export class DiagnosticsReportReleaseController {
  constructor(
    private readonly release: ReportReleaseService,
    private readonly settings: ReportIssuerSettingsService,
  ) {}

  @Audited({
    action: 'DIAGNOSTIC_REPORT_PATIENT_RELEASED',
    entity: 'diagnostic_report',
    entityId: 'param:reportId',
  })
  @Roles('CLINICIAN', 'PRACTITIONER')
  @Post('reports/:reportId/patient-release')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liberar al paciente un resultado retenido' })
  releaseToPatient(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PatientReleaseResultDto> {
    return this.release.releaseToPatient(requireTenantId(), reportId, actor);
  }

  @Get('report-issuer-settings')
  @Roles()
  @ApiOperation({ summary: 'Firma, sello y responsable de los informes' })
  getSettings(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReportIssuerSettingsDto> {
    return this.settings.get(requireTenantId(), actor);
  }

  @Audited({
    action: 'REPORT_ISSUER_SETTINGS_SET',
    entity: 'report_issuer_settings',
  })
  @Put('report-issuer-settings')
  @Roles()
  @ApiOperation({ summary: 'Cambiar firma, sello y responsable (OWNER/ADMIN)' })
  setSettings(
    @Body() dto: UpdateReportIssuerSettingsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReportIssuerSettingsDto> {
    return this.settings.set(requireTenantId(), dto, actor);
  }
}
