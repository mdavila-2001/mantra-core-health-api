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
  type AuthenticatedUser,
} from '../../../common';
import {
  AccessRequestsService,
  EngagementRequestsService,
  SupportCatalogService,
  SupportEngagementsService,
} from '../services';
import {
  ConfirmedSupportEngagementViewDto,
  CreateEngagementRequestDto,
  CreateSupportAccessRequestDto,
  DecideEngagementRequestDto,
  EngagementDecisionResultDto,
  ListEngagementRequestsQueryDto,
  ListEngagementRequestsResponseDto,
  MySupportEngagementsResponseDto,
  ResourceCreatedDto,
  SupportCatalogQueryDto,
  SupportCatalogResponseDto,
} from '../dto';

/**
 * Solicitudes de vínculo de apoyo. La persona pide (y ve lo suyo); la
 * organización decide solo sobre su tenant, ítem por ítem.
 */
@ApiTags('delegated-access-support-requests')
@ApiBearerAuth()
@Controller()
export class SupportEngagementRequestsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param requests - Solicitudes de vínculo.
   * @param engagements - Vínculos de apoyo.
   * @param catalogService - Catálogo de doctores, servicios y ubicaciones.
   * @param accessRequests - Solicitudes de acceso clínico temporal.
   */
  constructor(
    private readonly requests: EngagementRequestsService,
    private readonly engagements: SupportEngagementsService,
    private readonly catalogService: SupportCatalogService,
    private readonly accessRequests: AccessRequestsService,
  ) {}

  /**
   * Vínculos de apoyo de la persona y sus solicitudes. Sin tenant: una
   * persona puede asistir a varias organizaciones y esta lectura es solo lo suyo.
   */
  @Get('me/support-engagements')
  @TenantAgnostic()
  @ApiOperation({ summary: 'Mis vínculos de apoyo y mis solicitudes' })
  async mine(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MySupportEngagementsResponseDto> {
    const engagements = await this.engagements.listMine(actor.id);
    const requests = await this.requests.listMine(actor.id);
    return { ...engagements, requests };
  }

  /**
   * La persona declara «sigo trabajando aquí» sobre su propio vínculo. Solo deja
   * el asiento de auditoría: no renueva el período ni reactiva; eso lo hace la
   * organización con `POST /org/support-engagements/:id/recertify`. Sin tenant
   * activo, y la organización queda en el sello de auditoría.
   */
  @Audited({
    action: 'SUPPORT_ENGAGEMENT_CONFIRMED_BY_PERSON',
    entity: 'organization_user_assignment',
    entityId: 'param:id',
    tenantId: 'result.tenantId',
  })
  @Post('me/support-engagements/:id/confirm')
  @TenantAgnostic()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmar mi propio vínculo de apoyo' })
  confirmMine(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ConfirmedSupportEngagementViewDto> {
    return this.engagements.confirmMine(id, actor);
  }

  /**
   * Doctores, servicios y ubicaciones de una organización, para que la persona
   * arme lo que pide. Sin tenant activo: la organización llega en `org`.
   */
  @Get('me/support-catalog')
  @TenantAgnostic()
  @ApiOperation({ summary: 'Catálogo de una organización para pedir permisos' })
  catalog(
    @Query() query: SupportCatalogQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SupportCatalogResponseDto> {
    return this.catalogService.forPerson(actor.id, query.org);
  }

  /**
   * La persona pide un vínculo de apoyo o la ampliación de uno. Sin tenant
   * activo: todavía no es parte de la organización a la que pide.
   */
  @Audited({
    action: 'SUPPORT_ENGAGEMENT_REQUESTED',
    entity: 'engagement_request',
    entityId: 'result.id',
    tenantId: 'result.tenantId',
  })
  @Post('support-engagement-requests')
  @TenantAgnostic()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Pedir un vínculo de apoyo o su ampliación' })
  create(
    @Body() dto: CreateEngagementRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    return this.requests.create(dto, actor);
  }

  /**
   * Caso 10: la persona de apoyo pide ver la historia clínica de un paciente
   * por un rato. Sin tenant activo (la organización llega en el cuerpo y se
   * contrasta con su vínculo); lo decide el doctor, no la administración.
   */
  @Audited({
    action: 'SUPPORT_CLINICAL_ACCESS_REQUESTED',
    entity: 'delegated_access_approval_request',
    entityId: 'result.id',
    tenantId: 'result.tenantId',
  })
  @Post('me/support-access-requests')
  @TenantAgnostic()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Pedir acceso clínico temporal a un paciente (lo decide el doctor)',
  })
  requestClinicalAccess(
    @Body() dto: CreateSupportAccessRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    return this.accessRequests.requestAsSupport(dto, actor);
  }

  /** Solicitudes de la organización activa. */
  @Get('org/support-engagement-requests')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Solicitudes de vínculo de apoyo de la organización',
  })
  list(
    @Query() query: ListEngagementRequestsQueryDto,
  ): Promise<ListEngagementRequestsResponseDto> {
    return this.requests.listForTenant(query);
  }

  /** Decisión por ítem: aprobar, ajustar o rechazar con motivo. */
  @Audited({
    action: 'SUPPORT_ENGAGEMENT_REQUEST_DECIDED',
    entity: 'engagement_request',
    entityId: 'param:id',
  })
  @Post('org/support-engagement-requests/:id/decision')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decidir una solicitud de apoyo ítem por ítem' })
  decide(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecideEngagementRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EngagementDecisionResultDto> {
    return this.requests.decide(id, dto, actor);
  }
}
