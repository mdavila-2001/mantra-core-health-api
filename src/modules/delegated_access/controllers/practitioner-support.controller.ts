import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
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
  TenantAgnostic,
  type AuthenticatedUser,
} from '../../../common';
import {
  PractitionerSupportService,
  SupportActivityService,
  SupportMaintenanceService,
  SupportPatientSearchService,
  type EffectiveRefreshAllResult,
  type RecertificationSweepResult,
  type RequestExpiryResult,
} from '../services';
import {
  AcceptSupportDelegateDto,
  OperationResultDto,
  ReplySettingsDto,
  SupportActivityQueryDto,
  SupportActivityResponseDto,
  SupportPatientSearchDto,
  SupportPatientSearchResponseDto,
  SupportAccessRequestsResponseDto,
  SupportTeamResponseDto,
} from '../dto';

/**
 * Lo del doctor sobre su equipo de apoyo y lo de la persona de apoyo que no
 * pertenece a un doctor ni a la organización (búsqueda exacta de pacientes).
 * Cada quien ve y toca solo lo suyo.
 */
@ApiTags('delegated-access-practitioner-support')
@ApiBearerAuth()
@Controller()
export class PractitionerSupportController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param support - Equipo de apoyo del doctor.
   * @param activity - Bitácora de actividad.
   * @param search - Búsqueda exacta de pacientes.
   */
  constructor(
    private readonly support: PractitionerSupportService,
    private readonly activity: SupportActivityService,
    private readonly search: SupportPatientSearchService,
  ) {}

  /** Equipo de apoyo del doctor. */
  @Get('me/practitioner/support-team')
  @Roles('PRACTITIONER', 'CLINICIAN')
  @ApiOperation({ summary: 'Mi equipo de apoyo' })
  @ApiOkResponse({ type: SupportTeamResponseDto })
  team(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SupportTeamResponseDto> {
    return this.support.supportTeam(actor);
  }

  /** Solicitudes de acceso clínico temporal que mi equipo espera que decida. */
  @Get('me/practitioner/support-access-requests')
  @Roles('PRACTITIONER', 'CLINICIAN')
  @ApiOperation({
    summary: 'Solicitudes de acceso clínico temporal de mi equipo',
  })
  accessRequests(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SupportAccessRequestsResponseDto> {
    return this.support.accessRequests(actor);
  }

  /** Qué hizo mi equipo de apoyo. */
  @Get('me/practitioner/support-activity')
  @Roles('PRACTITIONER', 'CLINICIAN')
  @ApiOperation({ summary: 'Actividad de mi equipo de apoyo' })
  teamActivity(
    @Query() query: SupportActivityQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SupportActivityResponseDto> {
    return this.activity.forPractitioner(actor, query);
  }

  /**
   * Qué hizo la propia persona de apoyo, en las organizaciones donde tiene un
   * vínculo. Sin organización activa: solo lo suyo, filtrable por `tenantId`.
   */
  @Get('me/support-activity')
  @TenantAgnostic()
  @ApiOperation({ summary: 'Mi actividad como personal de apoyo' })
  myActivity(
    @Query() query: SupportActivityQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SupportActivityResponseDto> {
    return this.activity.forPerson(actor, query);
  }

  /** El doctor acepta a una persona de apoyo. */
  @Audited({
    action: 'SUPPORT_DELEGATE_ACCEPTED',
    entity: 'practitioner_delegate_assignment',
    entityId: 'param:id',
  })
  @Post('practitioner-delegates/:id/accept')
  @Roles('PRACTITIONER', 'CLINICIAN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aceptar a una persona de apoyo' })
  accept(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AcceptSupportDelegateDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OperationResultDto> {
    return this.support.accept(id, dto, actor);
  }

  /** Ajustes de respuesta en nombre del doctor. */
  @Audited({
    action: 'SUPPORT_REPLY_SETTINGS_CHANGED',
    entity: 'practitioner_delegate_assignment',
    entityId: 'param:id',
  })
  @Patch('practitioner-delegates/:id/reply-settings')
  @Roles('PRACTITIONER', 'CLINICIAN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Permitir o no responder en mi nombre' })
  replySettings(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReplySettingsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OperationResultDto> {
    return this.support.replySettings(id, dto, actor);
  }

  /**
   * Búsqueda EXACTA de pacientes del personal de apoyo; cada búsqueda queda
   * auditada. La organización viene en el cuerpo y la política la contrasta con
   * los vínculos de la persona.
   */
  @Audited({ action: 'SUPPORT_PATIENT_SEARCHED', entity: 'patient_search' })
  @Post('me/support-patient-search')
  @TenantAgnostic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Buscar un paciente (búsqueda exacta, auditada)' })
  patientSearch(
    @Body() dto: SupportPatientSearchDto,
    @CurrentUser() actor: AuthenticatedUser,
    // `@Ip()` ya respeta `TRUST_PROXY_HOPS`: cuenta para el tope por IP.
    @Ip() ip: string,
  ): Promise<SupportPatientSearchResponseDto> {
    return this.search.search(dto, actor, ip);
  }
}

/** Tareas periódicas del personal de apoyo que dispara el worker. */
@ApiTags('delegated-access-support-maintenance')
@ApiBearerAuth()
@Controller('delegated-access/support')
export class SupportMaintenanceController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param maintenance - Tareas periódicas.
   */
  constructor(private readonly maintenance: SupportMaintenanceService) {}

  /** Vence las solicitudes pendientes pasados los 15 días. */
  @Audited({
    action: 'SUPPORT_REQUESTS_EXPIRED',
    entity: 'engagement_request',
  })
  @Post('expire-requests')
  @Roles('SYSTEM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Vencer solicitudes de apoyo sin decidir (15 días)',
  })
  expireRequests(): Promise<RequestExpiryResult> {
    return this.maintenance.expireRequests();
  }

  /** Suspende los vínculos sin recertificar a tiempo. */
  @Audited({
    action: 'SUPPORT_RECERTIFICATION_SWEPT',
    entity: 'organization_user_assignment',
  })
  @Post('recertification-sweep')
  @Roles('SYSTEM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspender vínculos sin recertificar (15 días)' })
  recertificationSweep(): Promise<RecertificationSweepResult> {
    return this.maintenance.sweepRecertification();
  }

  /** Recalcula el acceso efectivo de todas las organizaciones. */
  @Audited({
    action: 'SUPPORT_EFFECTIVE_ACCESS_REFRESHED',
    entity: 'effective_support_access',
  })
  @Post('refresh-effective-access')
  @Roles('SYSTEM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recalcular el acceso efectivo del personal de apoyo',
  })
  refresh(): Promise<EffectiveRefreshAllResult> {
    return this.maintenance.refreshEffectiveAccess();
  }
}
