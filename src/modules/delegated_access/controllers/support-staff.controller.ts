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
import { Throttle } from '@nestjs/throttler';
import {
  Audited,
  CurrentUser,
  Roles,
  TenantAgnostic,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import {
  CreateEngagementRequestDto,
  DecideSupportLinkDto,
  InviteSupportStaffDto,
  ListSupportRequestsQueryDto,
  MySupportEngagementsResponseDto,
  SupportAccessResponseDto,
  SupportAgendaQueryDto,
  SupportAgendaResponseDto,
  SupportCatalogQueryDto,
  SupportCatalogResponseDto,
  SupportLinkListDto,
  SupportLinkReasonDto,
  SupportLinksCreatedDto,
  SupportLinkViewDto,
} from '../dto/support-staff.dto';
import { SupportStaffService } from '../services/support-staff.service';

/**
 * La secretaria (personal de apoyo hospitalario) y sus vínculos.
 *
 * Las rutas `/me/*` y `/support-engagement-requests` son de la persona y van
 * **sin tenant activo** (`@TenantAgnostic`): pide entrar a hospitales de los que
 * todavía no es parte, y una persona puede trabajar en varios. Exigen el rol
 * `SUPPORT_STAFF`, que da su alta. Lo que puede ver lo decide el servicio con
 * sus vínculos activos, no el rol.
 *
 * Mismas rutas que el PR #1175 (`/me/support-engagements`,
 * `/me/support-catalog`, `/support-engagement-requests`) para que el cliente
 * del front siga funcionando.
 */
@ApiTags('delegated-access-support-staff')
@ApiBearerAuth()
@Controller()
export class SupportStaffController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param support - Casos de uso de los vínculos de la secretaria.
   */
  constructor(private readonly support: SupportStaffService) {}

  /** Sus vínculos y, aparte, los pendientes. */
  @Get('me/support-engagements')
  @TenantAgnostic()
  @Roles('SUPPORT_STAFF')
  @ApiOperation({ summary: 'Mis vínculos de apoyo y mis solicitudes' })
  mine(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MySupportEngagementsResponseDto> {
    return this.support.listMine(actor);
  }

  /** Lo que puede ver: hospitales, sedes, servicios, pisos y doctores. */
  @Get('me/support-access')
  @TenantAgnostic()
  @Roles('SUPPORT_STAFF')
  @ApiOperation({
    summary: 'Mi alcance: hospitales, doctores y pisos de mis vínculos activos',
  })
  access(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SupportAccessResponseDto> {
    return this.support.myAccess(actor);
  }

  /** Catálogo de un hospital para armar el pedido. */
  @Get('me/support-catalog')
  @TenantAgnostic()
  @Roles('SUPPORT_STAFF')
  @ApiOperation({
    summary: 'Sedes, servicios, pisos y doctores de un hospital para pedir',
  })
  catalog(
    @Query() query: SupportCatalogQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SupportCatalogResponseDto> {
    return this.support.catalogForSupport(actor, query.org);
  }

  /** La secretaria pide entrar a un hospital o asistir a sus doctores. */
  @Audited({
    action: 'SUPPORT_ENGAGEMENT_REQUESTED',
    entity: 'organization_user_assignment',
    entityId: 'result.id',
  })
  @Post('support-engagement-requests')
  @TenantAgnostic()
  @Roles('SUPPORT_STAFF')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Pedir un vínculo de apoyo (hospital, sede, servicio, piso o doctor)',
  })
  request(
    @Body() dto: CreateEngagementRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SupportLinksCreatedDto> {
    return this.support.request(dto, actor);
  }

  /** Acepta una invitación del hospital o de un doctor. */
  @Audited({
    action: 'SUPPORT_ENGAGEMENT_CONFIRMED_BY_PERSON',
    entity: 'organization_user_assignment',
    entityId: 'param:id',
  })
  @Post('me/support-engagements/:id/confirm')
  @TenantAgnostic()
  @Roles('SUPPORT_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aceptar una invitación de apoyo' })
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SupportLinkViewDto> {
    return this.support.confirmMine(id, actor);
  }

  /** Rechaza una invitación. */
  @Audited({
    action: 'SUPPORT_ENGAGEMENT_DECLINED_BY_PERSON',
    entity: 'organization_user_assignment',
    entityId: 'param:id',
  })
  @Post('me/support-engagements/:id/decline')
  @TenantAgnostic()
  @Roles('SUPPORT_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rechazar una invitación de apoyo' })
  decline(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() _dto: SupportLinkReasonDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SupportLinkViewDto> {
    return this.support.declineMine(id, actor);
  }

  /** Deja un vínculo o retira un pedido propio. */
  @Audited({
    action: 'SUPPORT_ENGAGEMENT_LEFT_BY_PERSON',
    entity: 'organization_user_assignment',
    entityId: 'param:id',
  })
  @Post('me/support-engagements/:id/leave')
  @TenantAgnostic()
  @Roles('SUPPORT_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dejar un vínculo o retirar mi pedido' })
  leave(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SupportLinkViewDto> {
    return this.support.leaveMine(id, actor);
  }

  /** Agenda de un doctor al que asiste (sólo con vínculo activo con él). */
  @Get('me/support-agenda')
  @TenantAgnostic()
  @Roles('SUPPORT_STAFF')
  @ApiOperation({
    summary: 'Agenda de un doctor asignado (403 si no hay vínculo activo)',
  })
  agenda(
    @Query() query: SupportAgendaQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SupportAgendaResponseDto> {
    return this.support.agenda(query, actor);
  }

  // --- El hospital (tenant activo; lo decide quien lo administra) -----------

  /** Catálogo del hospital activo, para invitar. */
  @Get('org/support-catalog')
  @ApiOperation({ summary: 'Sedes, servicios, pisos y doctores para invitar' })
  orgCatalog(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SupportCatalogResponseDto> {
    return this.support.catalogForOrganization(requireTenantId(), actor);
  }

  /** Bandeja del hospital: vínculos en un estado (por defecto pendientes). */
  @Get('org/support-engagement-requests')
  @ApiOperation({
    summary: 'Solicitudes e invitaciones de apoyo del hospital',
    description:
      'Sin `@Roles`: lo decide el servicio por ser OWNER/ADMIN del hospital ' +
      'activo (o plataforma). `awaiting` dice quién tiene que decidir.',
  })
  orgRequests(
    @Query() query: ListSupportRequestsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SupportLinkListDto> {
    return this.support.listForOrganization(
      requireTenantId(),
      actor,
      query.status,
    );
  }

  /** El hospital acepta o rechaza lo que pidió una secretaria. */
  @Audited({
    action: 'SUPPORT_ENGAGEMENT_REQUEST_DECIDED',
    entity: 'organization_user_assignment',
    entityId: 'param:id',
  })
  @Post('org/support-engagement-requests/:id/decision')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aceptar o rechazar una solicitud de apoyo' })
  decide(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecideSupportLinkDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SupportLinkViewDto> {
    return this.support.decideForOrganization(
      requireTenantId(),
      id,
      dto,
      actor,
    );
  }

  /** Personal de apoyo del hospital (vínculos activos y pendientes). */
  @Get('org/support-engagements')
  @ApiOperation({ summary: 'Personal de apoyo del hospital' })
  orgEngagements(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SupportLinkListDto> {
    return this.support.listEngagementsForOrganization(
      requireTenantId(),
      actor,
    );
  }

  /** El hospital termina un vínculo o retira una invitación. */
  @Audited({
    action: 'SUPPORT_ENGAGEMENT_ENDED',
    entity: 'organization_user_assignment',
    entityId: 'param:id',
  })
  @Post('org/support-engagements/:id/end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Terminar un vínculo de apoyo' })
  end(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() _dto: SupportLinkReasonDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SupportLinkViewDto> {
    return this.support.endForOrganization(requireTenantId(), id, actor);
  }

  /** El hospital invita a una secretaria registrada (por su documento). */
  @Audited({
    action: 'SUPPORT_STAFF_INVITED',
    entity: 'organization_user_assignment',
    entityId: 'result.id',
  })
  @Post('org/team/invitations')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Invitar a una secretaria a lugares o doctores' })
  invite(
    @Body() dto: InviteSupportStaffDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SupportLinksCreatedDto> {
    return this.support.inviteForOrganization(requireTenantId(), dto, actor);
  }
}
