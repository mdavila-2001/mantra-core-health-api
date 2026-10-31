import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import {
  TeamAdminRequestsService,
  TeamAdminService,
  type TeamCapabilitiesView,
  type TeamMembersView,
  type TeamMemberView,
  type TeamRequestsView,
} from '../services';
import {
  AffiliationInvitationCreatedDto,
  CreateAffiliationInvitationDto,
  CreateSupportGrantDto,
  GrantChangePendingDto,
  DecideEngagementRequestDto,
  EngagementDecisionResultDto,
  HandoverPreviewDto,
  OffboardEngagementDto,
  OffboardResultDto,
  OperationResultDto,
  ReactivateEngagementDto,
  RecertifyEngagementDto,
  ResourceCreatedDto,
  SuspendEngagementDto,
  SuspensionResultDto,
  UpdateSupportGrantDto,
} from '../dto';

/**
 * Administración delegada con techo (jefe de servicio o de piso, CONTRATO-GOBIERNO
 * §6.4). El rol de borde (`SECURITY_ADMIN`, `SUPPORT_STAFF`) solo deja pasar: la
 * autorización real es del servicio (átomo `team.*`, alcance y techo), y un
 * administrador delegado de una organización no opera en otra. `SECURITY_ADMIN`
 * usa las mismas rutas con alcance total.
 */
@ApiTags('delegated-access-team-admin')
@ApiBearerAuth()
@Controller('org/team')
export class TeamAdminController {
  /**
   * @param team - Personas, permisos y ciclo de vida por alcance.
   * @param requests - Invitaciones y solicitudes por alcance.
   */
  constructor(
    private readonly team: TeamAdminService,
    private readonly teamRequests: TeamAdminRequestsService,
  ) {}

  /** Mi alcance, mi techo y qué puedo hacer. */
  @Get('capabilities')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @ApiOperation({ summary: 'Mi alcance, mi techo y lo que puedo hacer' })
  capabilities(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TeamCapabilitiesView> {
    return this.team.capabilities(actor);
  }

  /** Solo las personas que puedo administrar y su parte dentro de mi alcance. */
  @Get('members')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @ApiOperation({ summary: 'Personas del equipo que puedo administrar' })
  members(@CurrentUser() actor: AuthenticatedUser): Promise<TeamMembersView> {
    return this.team.listMembers(actor);
  }

  /** Una persona; fuera de mi alcance responde 404. */
  @Get('members/:id')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @ApiOperation({
    summary: 'Una persona del equipo y sus permisos en mi alcance',
  })
  member(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TeamMemberView> {
    return this.team.getMember(id, actor);
  }

  /** Otorga un permiso dentro de mi alcance y techo. */
  @Audited({
    action: 'SUPPORT_GRANT_CREATED',
    entity: 'support_scope_grant',
    entityId: 'result.id',
  })
  @Post('members/:id/grants')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: ResourceCreatedDto })
  @ApiAcceptedResponse({
    type: GrantChangePendingDto,
    description:
      'Agrega o amplía (alcance, modo DYNAMIC o vigencia) un permiso crítico: no se escribió nada y queda a la espera de la aprobación de otra persona (cuatro ojos).',
  })
  @ApiOperation({ summary: 'Otorgar un permiso dentro de mi techo' })
  async addGrant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSupportGrantDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ResourceCreatedDto | GrantChangePendingDto> {
    const out = await this.team.addGrant(id, dto, actor);
    // Un permiso con átomos CRÍTICA queda a la espera de otra persona (cuatro ojos).
    if ('approvalId' in out) res.status(HttpStatus.ACCEPTED);
    return out;
  }

  /** Quita o edita un permiso de mi alcance. */
  @Audited({
    action: 'SUPPORT_GRANT_UPDATED',
    entity: 'support_scope_grant',
    entityId: 'body.grantId',
  })
  @Patch('members/:id/grants')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: OperationResultDto })
  @ApiAcceptedResponse({
    type: GrantChangePendingDto,
    description:
      'Agrega o amplía (alcance, modo DYNAMIC o vigencia) un permiso crítico: no se escribió nada y queda a la espera de la aprobación de otra persona (cuatro ojos).',
  })
  @ApiOperation({ summary: 'Quitar o editar un permiso de mi alcance' })
  async updateGrant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupportGrantDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<OperationResultDto | GrantChangePendingDto> {
    const out = await this.team.updateGrant(id, dto, actor);
    if ('approvalId' in out) res.status(HttpStatus.ACCEPTED);
    return out;
  }

  /** Recertifica a la persona. */
  @Audited({
    action: 'SUPPORT_ENGAGEMENT_RECERTIFIED',
    entity: 'organization_user_assignment',
    entityId: 'param:id',
  })
  @Post('members/:id/recertify')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recertificar a una persona de mi equipo' })
  recertify(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecertifyEngagementDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OperationResultDto> {
    return this.team.recertify(id, dto, actor);
  }

  /** Suspende a la persona al instante. */
  @Audited({
    action: 'SUPPORT_ENGAGEMENT_SUSPENDED',
    entity: 'organization_user_assignment',
    entityId: 'param:id',
  })
  @Post('members/:id/suspend')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspender a una persona de mi equipo' })
  suspend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuspendEngagementDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SuspensionResultDto> {
    return this.team.suspend(id, dto, actor);
  }

  /** Pide reactivar (cuatro ojos, 202). */
  @Audited({
    action: 'FOUR_EYES_REQUESTED',
    entity: 'four_eyes_request',
    entityId: 'result.approvalId',
  })
  @Post('members/:id/reactivate')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Pedir la reactivación de una persona de mi equipo',
  })
  reactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReactivateEngagementDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SuspensionResultDto> {
    return this.team.reactivate(id, dto, actor);
  }

  /** Baja con traspaso. */
  @Audited({
    action: 'SUPPORT_ENGAGEMENT_OFFBOARDED',
    entity: 'organization_user_assignment',
    entityId: 'param:id',
  })
  @Post('members/:id/offboard')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dar de baja con traspaso a una persona de mi equipo',
  })
  offboard(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OffboardEngagementDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OffboardResultDto> {
    return this.team.offboard(id, dto, actor);
  }

  /** Lo que la persona tiene en las manos. */
  @Get('members/:id/handover-preview')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @ApiOperation({
    summary: 'Vista previa del traspaso de una persona de mi equipo',
  })
  handoverPreview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<HandoverPreviewDto> {
    return this.team.handoverPreview(id, actor);
  }

  /** Invitación con plantillas de mi techo. */
  @Audited({
    action: 'AFFILIATION_INVITATION_CREATED',
    entity: 'affiliation_invitation',
    entityId: 'result.id',
  })
  @Post('invitations')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Invitar personal de apoyo dentro de mi techo' })
  invite(
    @Body() dto: CreateAffiliationInvitationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AffiliationInvitationCreatedDto> {
    return this.teamRequests.invite(dto, actor);
  }

  /** Solicitudes pendientes con los ítems de mi alcance. */
  @Get('requests')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @ApiOperation({ summary: 'Solicitudes pendientes dentro de mi alcance' })
  requests(@CurrentUser() actor: AuthenticatedUser): Promise<TeamRequestsView> {
    return this.teamRequests.listRequests(actor);
  }

  /** Decide solo los ítems propios; el resto sigue pendiente. */
  @Audited({
    action: 'SUPPORT_ENGAGEMENT_REQUEST_DECIDED',
    entity: 'engagement_request',
    entityId: 'param:id',
  })
  @Post('requests/:id/decision')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Decidir los ítems de una solicitud dentro de mi alcance',
  })
  decide(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecideEngagementRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EngagementDecisionResultDto> {
    return this.teamRequests.decide(id, dto, actor);
  }
}
