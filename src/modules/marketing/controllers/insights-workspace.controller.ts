import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { Audited } from '../../../common/audit-trail/audit-trail.decorators';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/auth/authenticated-user.interface';
import { PlatformTenantOptional } from '../../../common/tenant/platform-tenant-optional.decorator';
import {
  INSIGHTS_PLATFORM_ROLES,
  INSIGHTS_READ_ROLES,
  INSIGHTS_WRITE_ROLES,
} from '../marketing.insights-access';
import {
  InsightsNotificationPreferencesResponseDto,
  InsightsReportListResponseDto,
  InsightsReportResponseDto,
  InsightsSavedViewListResponseDto,
  InsightsSavedViewResponseDto,
  InsightsUserPreferencesResponseDto,
  PutNotificationPreferencesDto,
  PutReportDto,
  PutSavedViewDto,
  PutUserPreferencesDto,
} from '../dto/insights-workspace.dto';
import { InsightsWorkspaceService } from '../services/insights-workspace.service';

/**
 * AloVida Insights: lo que cada persona guarda (preferencias de aviso y de
 * interfaz, vistas guardadas, informes). Todo se acota por el id del usuario
 * autenticado; ninguna ruta recibe un `userId`. Mismas reglas de acceso que
 * las lecturas (D-7).
 */
@ApiTags('marketing-insights')
@ApiBearerAuth()
@Controller('marketing/insights')
@PlatformTenantOptional(...INSIGHTS_PLATFORM_ROLES)
export class InsightsWorkspaceController {
  constructor(private readonly workspace: InsightsWorkspaceService) {}

  @Get('notification-preferences')
  @Roles(...INSIGHTS_READ_ROLES)
  @ApiOperation({
    summary:
      'Preferencias de aviso del usuario (rowVersion 0 si no guardó nada)',
  })
  @ApiOkResponse({ type: InsightsNotificationPreferencesResponseDto })
  getNotificationPreferences(@CurrentUser() actor: AuthenticatedUser) {
    return this.workspace.getNotificationPreferences(actor);
  }

  @Audited({
    action: 'MARKETING_INSIGHTS_NOTIFICATION_PREFERENCES_SET',
    entity: 'insights_notification_preference',
  })
  @Put('notification-preferences')
  @Roles(...INSIGHTS_WRITE_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Guarda las preferencias de aviso del usuario (no se envía nada)',
  })
  @ApiHeader({
    name: 'If-Match',
    required: false,
    description: 'rowVersion leído; obligatorio si ya hay fila',
  })
  @ApiOkResponse({ type: InsightsNotificationPreferencesResponseDto })
  putNotificationPreferences(
    @Body() dto: PutNotificationPreferencesDto,
    @Headers('if-match') ifMatch: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.workspace.putNotificationPreferences(dto, ifMatch, actor);
  }

  @Get('user-preferences')
  @Roles(...INSIGHTS_READ_ROLES)
  @ApiOperation({
    summary:
      'Preferencias de interfaz del usuario (rowVersion 0 si no guardó nada)',
  })
  @ApiOkResponse({ type: InsightsUserPreferencesResponseDto })
  getUserPreferences(@CurrentUser() actor: AuthenticatedUser) {
    return this.workspace.getUserPreferences(actor);
  }

  @Audited({
    action: 'MARKETING_INSIGHTS_USER_PREFERENCES_SET',
    entity: 'insights_user_preference',
  })
  @Put('user-preferences')
  @Roles(...INSIGHTS_WRITE_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Guarda las preferencias de interfaz del usuario' })
  @ApiHeader({
    name: 'If-Match',
    required: false,
    description: 'rowVersion leído; obligatorio si ya hay fila',
  })
  @ApiOkResponse({ type: InsightsUserPreferencesResponseDto })
  putUserPreferences(
    @Body() dto: PutUserPreferencesDto,
    @Headers('if-match') ifMatch: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.workspace.putUserPreferences(dto, ifMatch, actor);
  }

  @Get('saved-views')
  @Roles(...INSIGHTS_READ_ROLES)
  @ApiOperation({ summary: 'Vistas guardadas del usuario' })
  @ApiOkResponse({ type: InsightsSavedViewListResponseDto })
  listSavedViews(@CurrentUser() actor: AuthenticatedUser) {
    return this.workspace.listSavedViews(actor);
  }

  @Audited({
    action: 'MARKETING_INSIGHTS_SAVED_VIEW_SET',
    entity: 'insights_saved_view',
    entityId: 'param:id',
  })
  @Put('saved-views/:id')
  @Roles(...INSIGHTS_WRITE_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Guarda una vista con el id que manda el cliente (idempotente)',
    description:
      'El nombre es único por usuario: otro id con el mismo nombre responde 409 MARKETING_INSIGHTS_VIEW_NAME_TAKEN.',
  })
  @ApiOkResponse({ type: InsightsSavedViewResponseDto })
  putSavedView(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PutSavedViewDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.workspace.putSavedView(id, dto, actor);
  }

  @Audited({
    action: 'MARKETING_INSIGHTS_SAVED_VIEW_DELETED',
    entity: 'insights_saved_view',
    entityId: 'param:id',
  })
  @Delete('saved-views/:id')
  @Roles(...INSIGHTS_WRITE_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Borra una vista del usuario (idempotente)' })
  @ApiNoContentResponse()
  deleteSavedView(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.workspace.deleteSavedView(id, actor);
  }

  @Get('reports')
  @Roles(...INSIGHTS_READ_ROLES)
  @ApiOperation({
    summary:
      'Historial de informes del usuario (máximo 12, el más nuevo primero)',
  })
  @ApiOkResponse({ type: InsightsReportListResponseDto })
  listReports(@CurrentUser() actor: AuthenticatedUser) {
    return this.workspace.listReports(actor);
  }

  @Audited({
    action: 'MARKETING_INSIGHTS_REPORT_SET',
    entity: 'insights_report',
    entityId: 'param:id',
  })
  @Put('reports/:id')
  @Roles(...INSIGHTS_WRITE_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Guarda un informe en el historial (idempotente por id)',
    description: 'Máximo 12 por usuario: el 13.º expulsa el más viejo.',
  })
  @ApiOkResponse({ type: InsightsReportResponseDto })
  putReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PutReportDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.workspace.putReport(id, dto, actor);
  }

  @Audited({
    action: 'MARKETING_INSIGHTS_REPORT_DELETED',
    entity: 'insights_report',
    entityId: 'param:id',
  })
  @Delete('reports/:id')
  @Roles(...INSIGHTS_WRITE_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Borra un informe del usuario (idempotente)' })
  @ApiNoContentResponse()
  deleteReport(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.workspace.deleteReport(id, actor);
  }
}
